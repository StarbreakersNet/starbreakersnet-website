import type {
  ClockSettings,
  LinkItem,
  LinksSettings,
  MarkdownSettings,
  Widget,
  WidgetSettingsMap,
  WidgetSize,
  WidgetType,
  WidgetsDocument,
} from "@/types/Widget";

// Grille du bureau : colonnes de cases carrées
export const GRID_COLUMNS = 12;

export const WIDGET_SIZES: Record<WidgetSize, { w: number; h: number; label: string }> = {
  small: { w: 2, h: 2, label: "Petit" },
  medium: { w: 4, h: 2, label: "Moyen" },
  large: { w: 4, h: 4, label: "Grand" },
};

interface WidgetDefinition<T extends WidgetType> {
  label: string;
  description: string;
  icon: string;
  sizes: WidgetSize[];
  defaultSize: WidgetSize;
  defaultSettings: () => WidgetSettingsMap[T];
  // Réglages relus depuis le stockage : valeurs manquantes ou invalides remplacées par défaut
  normalize: (raw: Record<string, unknown>) => WidgetSettingsMap[T];
}

export const WIDGET_DEFINITIONS: { [T in WidgetType]: WidgetDefinition<T> } = {
  clock: {
    label: "Horloge",
    description: "L'heure ici ou ailleurs, à aiguilles ou en chiffres.",
    icon: "clock",
    sizes: ["small", "medium"],
    defaultSize: "small",
    defaultSettings: (): ClockSettings => ({
      style: "analog",
      seconds: true,
      timezone: null,
      label: "",
    }),
    normalize: raw => ({
      style: raw.style === "digital" ? "digital" : "analog",
      seconds: typeof raw.seconds === "boolean" ? raw.seconds : true,
      timezone:
        typeof raw.timezone === "string" && isValidTimezone(raw.timezone) ? raw.timezone : null,
      label: typeof raw.label === "string" ? raw.label.slice(0, 40) : "",
    }),
  },
  markdown: {
    label: "Note",
    description: "Un bloc de texte mis en forme avec Markdown.",
    icon: "note-sticky",
    sizes: ["small", "medium", "large"],
    defaultSize: "medium",
    defaultSettings: (): MarkdownSettings => ({
      content: "## Nouvelle note\n\nÉcrivez ici en **Markdown**.",
    }),
    normalize: raw => ({
      content: typeof raw.content === "string" ? raw.content.slice(0, MARKDOWN_MAX_LENGTH) : "",
    }),
  },
  links: {
    label: "Liens",
    description: "Vos sites favoris, à portée de clic.",
    icon: "link",
    sizes: ["small", "medium", "large"],
    defaultSize: "medium",
    defaultSettings: (): LinksSettings => ({ links: [], newTab: true }),
    normalize: raw => ({
      links: Array.isArray(raw.links)
        ? raw.links.flatMap(link => normalizeLink(link)).slice(0, LINKS_MAX)
        : [],
      newTab: typeof raw.newTab === "boolean" ? raw.newTab : true,
    }),
  },
};

export const WIDGET_TYPES = Object.keys(WIDGET_DEFINITIONS) as WidgetType[];

export const MARKDOWN_MAX_LENGTH = 5000;
export const LINKS_MAX = 24;

export function createId() {
  return crypto.randomUUID();
}

// « Europe/Paris » → « Paris », « America/New_York » → « New York »
export function timezoneCity(timezone: string) {
  return (timezone.split("/").pop() ?? timezone).replace(/_/g, " ");
}

export function localTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

function isValidTimezone(timezone: string) {
  try {
    new Intl.DateTimeFormat("fr", { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

// Adresse saisie par l'utilisateur : https:// ajouté si besoin, seuls http et https acceptés
export function normalizeUrl(input: string): string | null {
  const value = input.trim();
  if (!value) return null;

  try {
    const url = new URL(/^[a-z][a-z\d+.-]*:/i.test(value) ? value : `https://${value}`);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}

function normalizeLink(raw: unknown): LinkItem[] {
  if (!raw || typeof raw !== "object") return [];
  const link = raw as Record<string, unknown>;
  const url = typeof link.url === "string" ? normalizeUrl(link.url) : null;
  if (!url) return [];

  return [
    {
      id: typeof link.id === "string" ? link.id : createId(),
      title: typeof link.title === "string" ? link.title.slice(0, 40) : "",
      url,
    },
  ];
}

// --- Placement sur la grille

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function widgetRect(widget: Pick<Widget, "x" | "y" | "size">): Rect {
  const { w, h } = WIDGET_SIZES[widget.size];
  return { x: widget.x, y: widget.y, w, h };
}

function overlaps(a: Rect, b: Rect) {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}

export function fits(rect: Rect, others: Rect[]) {
  return (
    rect.x >= 0 &&
    rect.y >= 0 &&
    rect.x + rect.w <= GRID_COLUMNS &&
    !others.some(other => overlaps(rect, other))
  );
}

// Première place libre, de gauche à droite puis de haut en bas
export function findFreeSpot(size: WidgetSize, others: Rect[]) {
  const { w, h } = WIDGET_SIZES[size];

  for (let y = 0; ; y++) {
    for (let x = 0; x + w <= GRID_COLUMNS; x++) {
      if (fits({ x, y, w, h }, others)) {
        return { x, y };
      }
    }
  }
}

// --- Lecture du stockage (navigateur ou compte)

// Document relu tel quel : widgets inconnus ou abîmés écartés, chevauchements replacés ailleurs
export function normalizeDocument(raw: unknown): Widget[] | null {
  if (!raw || typeof raw !== "object" || !Array.isArray((raw as WidgetsDocument).widgets)) {
    return null;
  }

  const placed: Rect[] = [];
  const widgets: Widget[] = [];

  for (const item of (raw as WidgetsDocument).widgets as unknown[]) {
    if (!item || typeof item !== "object") continue;
    const entry = item as Record<string, unknown>;
    const type = entry.type as WidgetType;
    const definition = WIDGET_DEFINITIONS[type];
    if (!definition) continue;

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

    const widget = {
      id: typeof entry.id === "string" ? entry.id : createId(),
      type,
      size,
      ...position,
      settings,
    } as Widget;

    placed.push(widgetRect(widget));
    widgets.push(widget);
  }

  return widgets;
}

export function toDocument(widgets: Widget[]): WidgetsDocument {
  return { version: 1, widgets };
}

// --- Bureau par défaut (visiteurs, et membres qui n'ont encore rien changé)

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
          "## Bienvenue sur votre bureau\n\n" +
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
