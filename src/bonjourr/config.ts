// Modèle de réglages du fork Bonjourr : sous-ensemble documenté de SYNC_DEFAULT
// (Bonjourr/src/scripts/defaults.ts + src/types/sync.ts), clés et valeurs
// nommées à l'identique de l'original. Voir specs/bonjourr-fonctionnalites.md.
// Écart assumé : « links » (liste LinkElem) vit ici, l'original la stocke par
// clés séparées (features/links/index.ts) — même modèle d'objet LinkElem.

export type DarkMode = "auto" | "system" | "enable" | "disable";
export type DateFormat = "auto" | "eu" | "us" | "cn";
export type GreetingsMode = "auto" | "custom";
// Cinq valeurs, comme types/shared.ts l.10 ; l’UI des citations n’en propose que
// quatre (settings.html l.1629-1634) mais « period » est bien géré par needsChange.
export type Frequency = "tabs" | "hour" | "day" | "period" | "pause";
export type BackgroundType = "files" | "urls" | "images" | "videos" | "color";
export type WeatherUnit = "metric" | "imperial";
export type WeatherForecast = "auto" | "always" | "never";
export type WeatherTemperature = "actual" | "feelslike" | "both";
export type WeatherGeolocation = "precise" | "approximate" | "off";
export type WeatherMoreInfo = "none" | "msnw" | "yhw" | "windy" | "accu" | "custom";
// Écart assumé : le fork laisse le choix de la source de données météo ; l'original
// interroge uniquement son proxy (features/weather/request.ts l.44-60).
export type WeatherSource = "open-meteo" | "bonjourr" | "meteofrance" | "openweathermap";
export type PomodoroMode = "pomodoro" | "break" | "longbreak";
export type QuotesType =
  | "classic"
  | "kaamelott"
  | "inspirobot"
  | "stoic"
  | "hitokoto"
  | "office"
  | "user"
  | "url";

export type LinkIconType = "auto" | "library" | "file" | "url"; // types/shared.ts l.11

// Médias d’arrière-plan : BackgroundImage / BackgroundVideo de types/shared.ts
// l.38-75, avec urls.full / urls.small (et medium?) comme l’original.
export type BackgroundMedia =
  | {
      format: "image";
      mimetype?: string;
      urls: { full: string; small: string; medium?: string };
      page?: string;
      username?: string;
      name?: string;
      city?: string;
      country?: string;
      color?: string;
      download?: string;
    }
  | {
      format: "video";
      mimetype?: string;
      duration: number;
      urls: { full: string; small: string; medium?: string };
      page?: string;
      username?: string;
      thumbnail?: string;
    };

export type LinkIcon = { type: LinkIconType; value?: string }; // types/shared.ts l.87-90

// LinkGroups de types/sync.ts l.58-64.
export type LinkGroups = {
  on: boolean;
  selected: string;
  groups: string[];
  pinned: string[];
  synced: string[];
};

// LinkElem de types/shared.ts l.77-85 (icon optionnel inclus).
export type LinkElem = {
  _id: string;
  order: number;
  title: string;
  url: string;
  folder?: false;
  parent?: string;
  icon?: LinkIcon;
};

export type BonjourrConfig = {
  lang: string;
  dark: DarkMode;
  favicon: string;
  tabtitle: string;
  greeting: string;
  greetingsmode: GreetingsMode;
  greetingscustom: {
    morning: string;
    afternoon: string;
    evening: string;
    night: string;
  };
  dateformat: DateFormat;
  hide: {
    clock?: boolean;
    date?: boolean;
    greetings?: boolean;
    weatherdesc?: boolean;
    weathericon?: boolean;
    settingsicon?: boolean;
  };
  css: string;
  escKey: boolean;
  quicklinks: boolean;
  // linkstyle de types/sync.ts l.13 (et isLinkStyle, index.ts l.921-923).
  linkstyle: "large" | "medium" | "small" | "inline" | "text";
  linktitles: boolean;
  linkbackgrounds: boolean;
  linknewtab: boolean;
  linksrow: number;
  linkiconradius: number;
  linkgroups: LinkGroups;
  textShadow: number;
  pagegap: number;
  pagewidth: number;
  links: LinkElem[];
  backgrounds: {
    type: BackgroundType;
    frequency: Frequency;
    fadein: number;
    blur: number;
    bright: number;
    color: string;
    urls: string;
    images: string;
    videos: string;
    mute: boolean;
    queries: Record<string, string>;
    // Types optionnels de types/sync.ts l.85-88 : le fond figé quand la
    // fréquence est « pause » (Verrouillé).
    pausedUrl?: string;
    pausedImage?: BackgroundMedia;
    pausedVideo?: BackgroundMedia;
  };
  clock: {
    size: number;
    ampm: boolean;
    analog: boolean;
    seconds: boolean;
    timezone: string;
    worldclocks: boolean;
  };
  analogstyle: {
    face: "none" | "number" | "roman" | "marks";
    hands: "modern" | "swiss" | "classic";
    shape: "round" | "square" | "rectangle";
    border: string;
    background: string;
  };
  worldclocks: { region: string; timezone: string }[];
  weather: {
    city?: string;
    unit: WeatherUnit;
    show_unit: boolean;
    moreinfo: WeatherMoreInfo;
    forecast: WeatherForecast;
    temperature: WeatherTemperature;
    geolocation: WeatherGeolocation;
    /** Sens d'origine : URL personnalisée du lien « plus d'infos » (sync.ts l.220). */
    provider: string;
    /** Écart assumé : source de données (l'original n'a que son proxy weather.bonjourr.fr). */
    source: WeatherSource;
    /** Écart assumé : clé OpenWeatherMap ou jeton Météo-France. */
    apikey: string;
  };
  searchbar: {
    on: boolean;
    opacity: number;
    newtab: boolean;
    suggestions: boolean;
    engine: string;
    request: string;
    placeholder: string;
  };
  // Notes de types/sync.ts l.168-175 (défauts de defaults.ts l.184-189) ; `text` reste
  // une chaîne vide ici, le gabarit traduit n'étant posé qu'à l'affichage (notes.ts l.73).
  notes: {
    on: boolean;
    width: number;
    opacity: number;
    align: "left" | "center" | "right";
    text: string;
    background?: string;
  };
  quotes: {
    on: boolean;
    author: boolean;
    /** Horodatage de la dernière citation vue (types/sync.ts l.180, jamais dans DEFAULTS). */
    last?: number;
    type: QuotesType;
    frequency: Frequency;
    userlist: string;
    url: string;
  };
  pomodoro: {
    on: boolean;
    mode: PomodoroMode;
    pause: number;
    end: number;
    timeFor: Record<PomodoroMode, number>;
    focus: boolean;
    sound: boolean;
    /** Mélodie de l’alarme, « marimba » par défaut (types/sync.ts l.231, defaults.ts l.219). */
    alarm: string;
    volume: number;
    /** Séances terminées, `endedAt` en millisecondes (types/sync.ts l.233-236). */
    history: { endedAt: string; duration: number }[];
  };
  font: {
    family: string;
    size: string;
    system: boolean;
    color: string;
    weight: string;
  };
};

export const DEFAULTS: BonjourrConfig = {
  lang: "fr",
  dark: "system",
  favicon: "",
  tabtitle: "",
  greeting: "",
  greetingsmode: "auto",
  greetingscustom: { morning: "", afternoon: "", evening: "", night: "" },
  dateformat: "auto",
  hide: {},
  css: "",
  escKey: true,
  quicklinks: true,
  linkstyle: "medium",
  linktitles: true,
  linkbackgrounds: true,
  linknewtab: false,
  linksrow: 6,
  linkiconradius: 1.1,
  // linkgroups de defaults.ts l.127-133.
  linkgroups: { on: false, selected: "default", groups: ["default"], pinned: [], synced: [] },
  textShadow: 0.2,
  pagegap: 1,
  pagewidth: 1600,
  links: [],
  backgrounds: {
    type: "urls",
    frequency: "hour",
    fadein: 600,
    // 15 pixels, comme defaults.ts l.137 (et c’est le seuil de `body.blurred`,
    // features/backgrounds/index.ts l.779).
    blur: 15,
    bright: 0.8,
    color: "#185A63",
    urls: "/bonjourr/background.jpg",
    images: "bonjourr-images-daylight",
    videos: "bonjourr-videos-daylight",
    mute: true,
    queries: {},
  },
  clock: {
    size: 1,
    ampm: false,
    analog: false,
    seconds: false,
    timezone: "auto",
    worldclocks: false,
  },
  analogstyle: {
    face: "none",
    hands: "modern",
    shape: "round",
    border: "#ffff",
    background: "#fff2",
  },
  worldclocks: [],
  weather: {
    unit: "metric",
    show_unit: false,
    moreinfo: "none",
    forecast: "auto",
    temperature: "actual",
    geolocation: "approximate",
    provider: "",
    source: "open-meteo",
    apikey: "",
  },
  searchbar: {
    on: false,
    opacity: 0.1,
    newtab: false,
    suggestions: true,
    engine: "default",
    request: "",
    placeholder: "",
  },
  notes: { on: false, width: 40, opacity: 0.1, align: "left", text: "" },
  quotes: { on: false, author: false, type: "classic", frequency: "day", userlist: "", url: "" },
  pomodoro: {
    on: false,
    mode: "pomodoro",
    pause: 0,
    end: 0,
    timeFor: { pomodoro: 1500, break: 300, longbreak: 1200 },
    focus: false,
    sound: true,
    alarm: "marimba",
    volume: 0.7,
    history: [],
  },
  font: { family: "", size: "14", system: true, color: "#ffffff", weight: "300" },
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// Copie structurelle à la place de `structuredClone` : celui-ci refuse les proxys, or un
// patch peut venir d'un tableau réactif Vue (les liens rapides, case 15) dont chaque
// élément est un proxy. Seuls les objets « plats » sont reconstruits (Date, Map, etc.
// sont recopiés tels quels).
function plainClone<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => plainClone(item)) as unknown as T;
  }

  if (isPlainObject(value)) {
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) {
      return value;
    }
    const copy: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) {
      copy[key] = plainClone(item);
    }
    return copy as T;
  }

  return value;
}

// Fusion profonde : les objets plans du patch écrasent frère par frère,
// tableaux et primitives remplacent entièrement (comme @victr/deepmerge).
export function mergeWithDefaults(
  patch: unknown,
  base: BonjourrConfig = DEFAULTS,
): BonjourrConfig {
  if (!isPlainObject(patch)) return plainClone(base);

  const result: Record<string, unknown> = plainClone(base) as Record<string, unknown>;
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) continue;
    if (isPlainObject(value) && isPlainObject(result[key])) {
      result[key] = mergeWithDefaults(value, result[key] as BonjourrConfig);
    } else {
      result[key] = plainClone(value);
    }
  }
  return result as unknown as BonjourrConfig;
}

export function deepMerge(
  target: Record<string, unknown>,
  patch: Record<string, unknown>,
): void {
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) continue;
    if (isPlainObject(value) && isPlainObject(target[key])) {
      deepMerge(target[key], value);
    } else {
      target[key] = plainClone(value);
    }
  }
}
