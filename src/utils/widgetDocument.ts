import { WIDGET_DEFINITIONS } from "@/models/WidgetDefinition";
import { WIDGET_SIZES } from "@/models/WidgetSize";
import { createId } from "@/utils/id";
import { findFreeSpot, fits, widgetRect, type Rect } from "@/utils/widgetGrid";
import type { Wallpaper } from "@/types/Wallpaper";
import type { Widget, WidgetSize, WidgetType, WidgetsDocument } from "@/types/Widget";

function normalizeWidget(item: unknown, placed: Rect[]): Widget | null {
  if (!item || typeof item !== "object") {
    return null;
  }

  const entry = item as Record<string, unknown>;
  const type = entry.type as WidgetType;
  const definition = WIDGET_DEFINITIONS[type];

  if (!definition) {
    return null;
  }

  const size = definition.sizes.includes(entry.size as WidgetSize)
    ? (entry.size as WidgetSize)
    : definition.defaultSize;
  const settings = definition.normalize(
    entry.settings && typeof entry.settings === "object"
      ? (entry.settings as Record<string, unknown>)
      : {}
  );

  let position = {
    x: Number.isInteger(entry.x) ? (entry.x as number) : -1,
    y: Number.isInteger(entry.y) ? (entry.y as number) : -1,
  };
  if (!fits({ ...position, ...WIDGET_SIZES[size] }, placed)) {
    position = findFreeSpot(size, placed);
  }

  const mobile = entry.mobile as Record<string, unknown> | undefined;
  return {
    id: typeof entry.id === "string" ? entry.id : createId(),
    type,
    size,
    ...position,
    // Vérifiée à l'affichage par mobileLayout, comme les chevauchements
    ...(Number.isInteger(mobile?.x) && Number.isInteger(mobile?.y)
      ? { mobile: { x: mobile!.x as number, y: mobile!.y as number } }
      : {}),
    settings,
  } as Widget;
}

// Document relu tel quel : widgets inconnus ou abîmés écartés, chevauchements replacés ailleurs
export function normalizeDocument(raw: unknown): Widget[] | null {
  if (!raw || typeof raw !== "object" || !Array.isArray((raw as WidgetsDocument).widgets)) {
    return null;
  }

  const placed: Rect[] = [];
  const widgets: Widget[] = [];

  for (const item of (raw as WidgetsDocument).widgets as unknown[]) {
    const widget = normalizeWidget(item, placed);

    if (widget) {
      placed.push(widgetRect(widget));
      widgets.push(widget);
    }
  }

  return widgets;
}

export function toDocument(
  widgets: Widget[],
  wallpaper: Wallpaper,
  unsplashKey: string
): WidgetsDocument {
  return { version: 1, widgets, wallpaper, unsplashKey };
}

// Buroh par défaut : visiteurs, et membres qui n'ont encore rien changé
export function defaultWidgets(): Widget[] {
  return [
    {
      id: createId(),
      type: "clock",
      size: "small",
      x: 0,
      y: 0,
      settings: WIDGET_DEFINITIONS.clock.defaultSettings(),
    },
    {
      id: createId(),
      type: "markdown",
      size: "medium",
      x: 2,
      y: 0,
      settings: {
        content:
          "## Bienvenue sur Buroh\n\n" +
          "Cliquez sur **Modifier les widgets** pour ajouter, déplacer ou régler vos widgets.",
      },
    },
    {
      id: createId(),
      type: "links",
      size: "medium",
      x: 6,
      y: 0,
      settings: {
        newTab: true,
        links: [
          { id: createId(), title: "GitHub", url: "https://github.com/StarbreakersNet" },
          {
            id: createId(),
            title: "Le Zap",
            url: "https://www.youtube.com/playlist?list=PLRyncVRdYNSJIUIHfr8f5Tewxmab2BtIj",
          },
        ],
      },
    },
  ];
}
