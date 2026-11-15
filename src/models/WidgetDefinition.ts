import { DateTime } from "luxon";
import { isValidTimezone } from "@/utils/timezone";
import { roundCoordinates } from "@/utils/weather";
import { normalizeLink, normalizeLocation } from "@/utils/widgetSettings";
import type {
  CalendarSettings,
  ClockSettings,
  CountdownSettings,
  LinksSettings,
  MarkdownSettings,
  WidgetSettingsMap,
  WidgetSize,
  WidgetType,
  WeatherLocation,
  WeatherSettings,
} from "@/types/Widget";

export interface WidgetDefinition<T extends WidgetType> {
  label: string;
  description: string;
  icon: string;
  sizes: WidgetSize[];
  defaultSize: WidgetSize;
  defaultSettings: () => WidgetSettingsMap[T];
  // Réglages relus depuis le stockage : valeurs manquantes ou invalides remplacées par défaut
  normalize: (raw: Record<string, unknown>) => WidgetSettingsMap[T];
}

export const MARKDOWN_MAX_LENGTH = 5000;
export const LINKS_MAX = 24;

const DEFAULT_LOCATION: WeatherLocation = {
  name: "Paris",
  detail: "Île-de-France, France",
  latitude: 48.85341,
  longitude: 2.3488,
};

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
  weather: {
    label: "Météo",
    description: "Le temps qu'il fait, et les jours à venir.",
    icon: "cloud-sun",
    sizes: ["small", "medium"],
    defaultSize: "small",
    defaultSettings: (): WeatherSettings => ({
      mode: "city",
      location: DEFAULT_LOCATION,
      unit: "celsius",
    }),
    normalize: raw => {
      const location = normalizeLocation(raw.location);
      const mode = location && raw.mode === "device" ? "device" : "city";

      return {
        mode,
        location: location
          ? mode === "device"
            ? { ...location, ...roundCoordinates(location) }
            : location
          : DEFAULT_LOCATION,
        unit: raw.unit === "fahrenheit" ? "fahrenheit" : "celsius",
      };
    },
  },
  countdown: {
    label: "Compte à rebours",
    description: "Le temps qui reste avant un évènement.",
    icon: "hourglass-half",
    sizes: ["small", "medium"],
    defaultSize: "small",
    defaultSettings: (): CountdownSettings => ({
      title: "Nouvel an",
      target: DateTime.now().plus({ years: 1 }).startOf("year").toISO()!,
    }),
    normalize: raw => ({
      title: typeof raw.title === "string" ? raw.title.slice(0, 40) : "",
      target:
        typeof raw.target === "string" && DateTime.fromISO(raw.target).isValid
          ? raw.target
          : DateTime.now().plus({ years: 1 }).startOf("year").toISO()!,
    }),
  },
  calendar: {
    label: "Calendrier",
    description: "Le mois en cours, et la date du jour.",
    icon: "calendar-days",
    sizes: ["small", "medium"],
    defaultSize: "small",
    defaultSettings: (): CalendarSettings => ({ weekNumbers: false }),
    normalize: raw => ({
      weekNumbers: typeof raw.weekNumbers === "boolean" ? raw.weekNumbers : false,
    }),
  },
};

export const WIDGET_TYPES = Object.keys(WIDGET_DEFINITIONS) as WidgetType[];
