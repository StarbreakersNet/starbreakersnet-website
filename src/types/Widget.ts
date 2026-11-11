// Widgets de la page Bureau (/bureau), placés sur une grille comme ceux du bureau de macOS

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
  settings: WidgetSettingsMap[T];
}

export type Widget = { [T in WidgetType]: WidgetOf<T> }[WidgetType];

// Format enregistré (navigateur et colonne user_settings.widgets)
export interface WidgetsDocument {
  version: 1;
  widgets: Widget[];
}
