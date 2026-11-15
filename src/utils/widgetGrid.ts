import { GRID_COLUMNS, MOBILE_COLUMNS, WIDGET_SIZES } from "@/models/WidgetSize";
import type { Widget, WidgetSize } from "@/types/Widget";

export interface Rect {
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

export function fits(rect: Rect, others: Rect[], columns = GRID_COLUMNS) {
  return (
    rect.x >= 0 &&
    rect.y >= 0 &&
    rect.x + rect.w <= columns &&
    !others.some(other => overlaps(rect, other))
  );
}

// Première place libre, de gauche à droite puis de haut en bas
export function findFreeSpot(size: WidgetSize, others: Rect[], columns = GRID_COLUMNS) {
  const { w, h } = WIDGET_SIZES[size];

  for (let y = 0; ; y++) {
    for (let x = 0; x + w <= columns; x++) {
      if (fits({ x, y, w, h }, others, columns)) {
        return { x, y };
      }
    }
  }
}

// Positions sur la grille du mobile : celles choisies sur mobile quand elles tiennent encore, puis
// les autres widgets dans l'ordre de lecture de l'ordinateur (de haut en bas, de gauche à droite)
export function mobileLayout(widgets: Widget[]): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  const placed: Rect[] = [];
  function place(widget: Widget, position: { x: number; y: number }) {
    positions.set(widget.id, position);
    placed.push({ ...position, ...WIDGET_SIZES[widget.size] });
  }

  for (const widget of widgets) {
    if (
      widget.mobile &&
      fits({ ...widget.mobile, ...WIDGET_SIZES[widget.size] }, placed, MOBILE_COLUMNS)
    ) {
      place(widget, widget.mobile);
    }
  }

  const rest = widgets
    .filter(widget => !positions.has(widget.id))
    .sort((a, b) => a.y - b.y || a.x - b.x);
  for (const widget of rest) {
    place(widget, findFreeSpot(widget.size, placed, MOBILE_COLUMNS));
  }

  return positions;
}
