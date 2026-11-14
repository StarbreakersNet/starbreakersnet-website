import type { Wallpaper } from "@/types/Wallpaper";

// Widgets de Buroh (/buroh), placés sur une grille comme ceux du bureau de macOS

export type WidgetType = "clock" | "markdown" | "links" | "weather" | "countdown" | "calendar";

// Tailles en cases de la grille, comme les widgets de macOS : petit carré, moyen, grand
export type WidgetSize = "small" | "medium" | "large";

export interface ClockSettings {
  style: "analog" | "digital";
  seconds: boolean;
  // Fuseau IANA (« Europe/Paris »), null pour l'heure de l'appareil
  timezone: string | null;
  // Nom affiché sous l'horloge, vide pour celui déduit du fuseau
  label: string;
}

export interface MarkdownSettings {
  content: string;
}

export interface LinkItem {
  id: string;
  title: string;
  url: string;
}

export interface LinksSettings {
  links: LinkItem[];
  newTab: boolean;
}

export interface WeatherLocation {
  name: string;
  // Région et pays, pour distinguer les homonymes (« Paris, Texas »)
  detail: string;
  latitude: number;
  longitude: number;
}

export interface WeatherSettings {
  mode: "city" | "device";
  location: WeatherLocation;
  unit: "celsius" | "fahrenheit";
}

export interface CountdownSettings {
  title: string;
  // Date et heure visées, au format ISO
  target: string;
}

export interface CalendarSettings {
  weekNumbers: boolean;
}

export interface WidgetSettingsMap {
  clock: ClockSettings;
  markdown: MarkdownSettings;
  links: LinksSettings;
  weather: WeatherSettings;
  countdown: CountdownSettings;
  calendar: CalendarSettings;
}

interface WidgetOf<T extends WidgetType> {
  id: string;
  type: T;
  size: WidgetSize;
  // Position sur la grille, en cases
  x: number;
  y: number;
  // Position sur la grille du mobile (MOBILE_COLUMNS colonnes), une fois le widget déplacé sur
  // mobile. Absente : le widget suit l'ordre de lecture de la grille de l'ordinateur.
  mobile?: { x: number; y: number };
  settings: WidgetSettingsMap[T];
}

export type Widget = { [T in WidgetType]: WidgetOf<T> }[WidgetType];

// Format enregistré (navigateur et colonne user_settings.widgets) : widgets et fond d'écran
export interface WidgetsDocument {
  version: 1;
  widgets: Widget[];
  wallpaper?: Wallpaper;
  unsplashKey?: string;
}

// Widget placé sur la grille (components/widgets/WidgetGrid.vue), en cases
export interface GridItem {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

// Position d'un widget après un glisser-déposer
export type GridPosition = Pick<GridItem, "id" | "x" | "y">;
