// Fork natif TypeScript de Bonjourr : météo.
// Rendu visé (affichage_bonjourr.png) :
// « Plutôt dégagé. Il fait actuellement 20° avec un maximum de 13° demain. » + icône jour/nuit.
//
// Case 14 : providers open-meteo (défaut, sans clé), proxy d'origine weather.bonjourr.fr,
// meteofrance et openweathermap (clé utilisateur), unités metric/imperial, moreinfo,
// géolocalisation précise/approximative/manuelle et recherche de ville.
// Sources : Bonjourr/src/scripts/features/weather/{request,display,settings}.ts et
// Bonjourr/src/types/sync.ts l.211-221.

import type {
  WeatherForecast,
  WeatherMoreInfo,
  WeatherSource,
  WeatherTemperature,
  WeatherUnit,
} from "@/bonjourr/config";

export type Coords = { lat: number; lon: number };

export type Weather = {
  currentTemp: number;
  code: number;
  isDay: boolean;
  tomorrowMax: number;
};

type FetchImpl = (input: string) => Promise<Response>;

const WEATHER_DESCRIPTIONS: Record<number, string> = {
  0: "Ciel dégagé",
  1: "Plutôt dégagé",
  2: "Partiellement nuageux",
  3: "Très nuageux",
  45: "Brouillard",
  48: "Brouillard givrant",
  51: "Bruine faible",
  53: "Bruine",
  55: "Bruine dense",
  56: "Bruine verglaçante",
  57: "Bruine verglaçante dense",
  61: "Pluie faible",
  63: "Pluie modérée",
  65: "Pluie forte",
  66: "Pluie verglaçante",
  67: "Pluie verglaçante forte",
  71: "Neige faible",
  73: "Neige modérée",
  75: "Neige forte",
  77: "Grésil",
  80: "Averses",
  81: "Averses modérées",
  82: "Averses violentes",
  85: "Averses de neige",
  86: "Fortes averses de neige",
  95: "Orage",
  96: "Orage et grêle",
  99: "Orage et forte grêle",
};

export function describeWeatherCode(code: number): string {
  return WEATHER_DESCRIPTIONS[code] ?? "Temps variable";
}

type OpenMeteoResponse = {
  current: { temperature_2m: number; weather_code: number; is_day: number };
  daily: { temperature_2m_max: number[] };
};

export function parseWeatherResponse(payload: OpenMeteoResponse): Weather {
  return {
    currentTemp: Math.round(payload.current.temperature_2m),
    code: payload.current.weather_code,
    isDay: payload.current.is_day === 1,
    tomorrowMax: Math.round(payload.daily.temperature_2m_max[1]),
  };
}

export function formatWeatherLine(weather: Weather): string {
  // Repli historique (session 1) : la phrase de la capture, prise à 22 h, donc celle
  // d'après le coucher du soleil (« demain ») et sans ressenti.
  return formatWeatherSentence(
    {
      description: describeWeatherCode(weather.code),
      temp: weather.currentTemp,
      feels: weather.currentTemp,
      isDay: weather.isDay,
      todayHigh: weather.tomorrowMax,
      tomorrowHigh: weather.tomorrowMax,
    },
    {
      unit: "metric",
      showUnit: false,
      temperature: "actual",
      forecast: "always",
      hour: 22,
      sunsetHour: 18,
    },
  );
}

export function weatherIcon(weather: Pick<Weather, "isDay">): "sun" | "moon" {
  return weather.isDay ? "sun" : "moon";
}

export async function fetchWeather(
  coords: Coords,
  fetchImpl: FetchImpl = (input) => fetch(input),
): Promise<Weather | null> {
  const url =
    "https://api.open-meteo.com/v1/forecast" +
    `?latitude=${coords.lat}&longitude=${coords.lon}` +
    "&current=temperature_2m,weather_code,is_day" +
    "&daily=temperature_2m_max" +
    "&temperature_unit=celsius&timezone=auto&forecast_days=2";
  try {
    const response = await fetchImpl(url);
    if (!response.ok) return null;
    const payload = (await response.json()) as OpenMeteoResponse;
    return parseWeatherResponse(payload);
  } catch {
    return null;
  }
}

// Géolocalisation navigateur avec repli Paris, comme consigné dans journal-de-bord.md.
export const DEFAULT_COORDS: Coords = { lat: 48.857, lon: 2.351 };

export function locate(timeoutMs = 5000): Promise<Coords> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve(DEFAULT_COORDS);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          lat: Number(position.coords.latitude.toFixed(3)),
          lon: Number(position.coords.longitude.toFixed(3)),
        }),
      () => resolve(DEFAULT_COORDS),
      { timeout: timeoutMs },
    );
  });
}

// --- Case 14 : providers, unités, moreinfo, ville ------------------------------------

/**
 * Sources de données du fork. Le proxy d'origine (`bonjourr`) ne connaît qu'AccuWeather
 * et Foreca ; meteofrance et openweathermap demandent une clé que l'utilisateur fournit.
 */
export type WeatherProvider = WeatherSource;

export const WEATHER_PROVIDERS: WeatherProvider[] = [
  "open-meteo",
  "bonjourr",
  "meteofrance",
  "openweathermap",
];

export type WeatherRequest = {
  provider: WeatherProvider;
  /** `weather.unit` de l'origine : metric (C) ou imperial (F). */
  unit: WeatherUnit;
  /** Langue demandée au provider (proxy d'origine et OpenWeatherMap). */
  lang?: string;
  /** Coordonnées issues de la géolocalisation (précise ou approximative). */
  coords?: Coords;
  /** Ville saisie à la main quand `geolocation` vaut `off` (request.ts l.56-60). */
  city?: string;
  /** `appid` OpenWeatherMap ou jeton Météo-France. */
  key?: string;
};

/** Rapport normalisé, quel que soit le provider. */
export type WeatherReport = {
  description: string;
  temp: number;
  feels: number;
  isDay: boolean;
  todayHigh: number | null;
  tomorrowHigh: number | null;
  sunrise?: [number, number];
  sunset?: [number, number];
  city?: string;
  country?: string;
  /** Lien de la page météo du fournisseur, pour `moreinfo: accu` (display.ts l.124). */
  link?: string;
};

function floor(value: unknown): number | null {
  // display.ts l.22-23 : les températures sont arrondies à l'entier inférieur.
  return typeof value === "number" && Number.isFinite(value) ? Math.floor(value) : null;
}

function isoHourMinute(value: unknown): [number, number] | undefined {
  // Heures locales telles que fournies (« 2026-10-16T08:12 »), sans décalage de fuseau.
  const match = typeof value === "string" ? /T(\d{2}):(\d{2})/.exec(value) : null;
  return match ? [Number(match[1]), Number(match[2])] : undefined;
}

function epochHourMinute(seconds: unknown, offset: unknown): [number, number] | undefined {
  if (typeof seconds !== "number" || !Number.isFinite(seconds)) return undefined;
  const date = new Date((seconds + (typeof offset === "number" ? offset : 0)) * 1000);
  return [date.getUTCHours(), date.getUTCMinutes()];
}

export function buildWeatherUrl(request: WeatherRequest): string | null {
  const { provider, unit, coords, city, key } = request;

  if (provider === "open-meteo") {
    if (!coords) return null;
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", String(coords.lat));
    url.searchParams.set("longitude", String(coords.lon));
    url.searchParams.set("current", "temperature_2m,apparent_temperature,weather_code,is_day");
    url.searchParams.set("daily", "temperature_2m_max,sunrise,sunset");
    url.searchParams.set("temperature_unit", unit === "imperial" ? "fahrenheit" : "celsius");
    url.searchParams.set("timezone", "auto");
    url.searchParams.set("forecast_days", "2");
    return url.toString();
  }

  if (provider === "bonjourr") {
    // Requête du proxy d'origine (request.ts l.44-60) : provider=auto, unit C|F,
    // lat/lon ou query=ville.
    const url = new URL("https://weather.bonjourr.fr/");
    url.searchParams.set("provider", "auto");
    url.searchParams.set("data", "simple");
    url.searchParams.set("lang", request.lang ?? "fr");
    url.searchParams.set("unit", unit === "imperial" ? "F" : "C");
    if (coords) {
      url.searchParams.set("lat", String(coords.lat));
      url.searchParams.set("lon", String(coords.lon));
    } else {
      url.searchParams.set("query", city ?? "Paris");
    }
    return url.toString();
  }

  if (provider === "openweathermap") {
    if (!key) return null;
    const url = new URL("https://api.openweathermap.org/data/2.5/weather");
    if (coords) {
      url.searchParams.set("lat", String(coords.lat));
      url.searchParams.set("lon", String(coords.lon));
    } else if (city) {
      url.searchParams.set("q", city);
    } else {
      return null;
    }
    url.searchParams.set("units", unit === "imperial" ? "imperial" : "metric");
    url.searchParams.set("lang", request.lang ?? "fr");
    url.searchParams.set("appid", key);
    return url.toString();
  }

  // meteofrance : l'API publique exige un jeton (401 vérifié sans jeton le 16/10/2026).
  if (!key || !coords) return null;
  const url = new URL("https://webservice.meteofrance.com/forecast");
  url.searchParams.set("lat", String(coords.lat));
  url.searchParams.set("lon", String(coords.lon));
  url.searchParams.set("token", key);
  return url.toString();
}

type OpenMeteoPayload = {
  current?: {
    temperature_2m?: number;
    apparent_temperature?: number;
    weather_code?: number;
    is_day?: number;
  };
  daily?: { temperature_2m_max?: number[]; sunrise?: string[]; sunset?: string[] };
};

/** `SimpleWeather` du proxy d'origine (Bonjourr/src/types/sync.ts l.224-241). */
type SimpleWeatherPayload = {
  now?: { description?: string; temp?: number; feels?: number; icon?: string };
  daily?: { high?: number; low?: number }[];
  sun?: { rise?: [number, number]; set?: [number, number] };
  geo?: { city?: string; country?: string };
  meta?: { url?: string };
};

type OpenWeatherMapPayload = {
  weather?: { description?: string; icon?: string }[];
  main?: { temp?: number; feels_like?: number; temp_max?: number };
  name?: string;
  timezone?: number;
  sys?: { country?: string; sunrise?: number; sunset?: number };
};

type MeteoFrancePayload = {
  properties?: {
    name?: string;
    forecast?: {
      time?: string;
      T?: number;
      T_windchill?: number;
      weather_icon?: string;
      weather_description?: string;
    }[];
    daily_forecast?: { time?: string; T_max?: number }[];
  };
};

function parseOpenMeteo(payload: OpenMeteoPayload): WeatherReport | null {
  const temp = floor(payload.current?.temperature_2m);
  if (temp === null) return null;
  return {
    description: describeWeatherCode(payload.current?.weather_code ?? -1),
    temp,
    feels: floor(payload.current?.apparent_temperature) ?? temp,
    isDay: payload.current?.is_day === 1,
    todayHigh: floor(payload.daily?.temperature_2m_max?.[0]),
    tomorrowHigh: floor(payload.daily?.temperature_2m_max?.[1]),
    sunrise: isoHourMinute(payload.daily?.sunrise?.[0]),
    sunset: isoHourMinute(payload.daily?.sunset?.[0]),
  };
}

function parseBonjourr(payload: SimpleWeatherPayload, now: Date): WeatherReport | null {
  const temp = floor(payload.now?.temp);
  if (temp === null) return null;
  const rise = payload.sun?.rise;
  const set = payload.sun?.set;
  const hour = now.getHours();
  return {
    description: payload.now?.description ?? "Temps variable",
    temp,
    feels: floor(payload.now?.feels) ?? temp,
    isDay: rise && set ? hour >= rise[0] && hour < set[0] : true,
    todayHigh: floor(payload.daily?.[0]?.high),
    tomorrowHigh: floor(payload.daily?.[1]?.high),
    sunrise: rise,
    sunset: set,
    city: payload.geo?.city,
    country: payload.geo?.country,
    link: payload.meta?.url,
  };
}

function parseOpenWeatherMap(payload: OpenWeatherMapPayload): WeatherReport | null {
  const temp = floor(payload.main?.temp);
  if (temp === null) return null;
  // L'icône OWM finit par « n » la nuit (ex. « 01n »), ce qui remplace un is_day absent.
  const icon = payload.weather?.[0]?.icon ?? "01d";
  return {
    description: payload.weather?.[0]?.description ?? "Temps variable",
    temp,
    feels: floor(payload.main?.feels_like) ?? temp,
    isDay: !icon.endsWith("n"),
    todayHigh: floor(payload.main?.temp_max),
    // /data/2.5/weather ne fournit pas le maximum de demain : la phrase omet la prévision.
    tomorrowHigh: null,
    city: payload.name,
    country: payload.sys?.country,
    sunrise: epochHourMinute(payload.sys?.sunrise, payload.timezone),
    sunset: epochHourMinute(payload.sys?.sunset, payload.timezone),
  };
}

function parseMeteoFrance(payload: MeteoFrancePayload, now: Date): WeatherReport | null {
  const slots = payload.properties?.forecast ?? [];
  const daily = payload.properties?.daily_forecast ?? [];
  const hourly = slots.filter((slot) => typeof slot.T === "number");
  const current =
    [...hourly].reverse().find((slot) => new Date(String(slot.time)).getTime() <= now.getTime()) ??
    hourly[0];
  const temp = floor(current?.T);
  if (temp === null || !current) return null;
  return {
    description: current.weather_description ?? "Temps variable",
    temp,
    feels: floor(current.T_windchill) ?? temp,
    isDay: (current.weather_icon ?? "p01d").endsWith("d"),
    todayHigh: floor(daily[0]?.T_max),
    tomorrowHigh: floor(daily[1]?.T_max),
    city: payload.properties?.name,
  };
}

export function parseWeatherReport(
  provider: WeatherProvider,
  payload: unknown,
  now = new Date(),
): WeatherReport | null {
  if (payload === null || typeof payload !== "object") return null;
  try {
    if (provider === "open-meteo") return parseOpenMeteo(payload as OpenMeteoPayload);
    if (provider === "bonjourr") return parseBonjourr(payload as SimpleWeatherPayload, now);
    if (provider === "openweathermap") return parseOpenWeatherMap(payload as OpenWeatherMapPayload);
    return parseMeteoFrance(payload as MeteoFrancePayload, now);
  } catch {
    return null;
  }
}

export async function fetchWeatherReport(
  request: WeatherRequest,
  fetchImpl: FetchImpl = (input) => fetch(input),
): Promise<WeatherReport | null> {
  const url = buildWeatherUrl(request);
  if (!url) return null;
  try {
    const response = await fetchImpl(url);
    if (!response.ok) return null;
    return parseWeatherReport(request.provider, await response.json());
  } catch {
    return null;
  }
}

export type WeatherSentenceOptions = {
  unit: WeatherUnit;
  /** `weather.show_unit` : affiche ou non le symbole du degré (display.ts l.162-168). */
  showUnit: boolean;
  temperature: WeatherTemperature;
  forecast: WeatherForecast;
  /** Heure locale (userDate().getHours()). */
  hour: number;
  /** Heure de coucher du soleil ; par défaut celle du rapport, sinon 18 h. */
  sunsetHour?: number;
};

/** display.ts l.151-159 : `auto` ne montre la prévision que le matin ou après le coucher. */
export function shouldShowForecast(
  forecast: WeatherForecast,
  hour: number,
  sunsetHour: number,
): boolean {
  if (forecast === "never") return false;
  if (forecast === "always") return true;
  return hour < 12 || hour > sunsetHour;
}

/**
 * Phrase complète, composée comme display.ts l.21-59 avec les gabarits français
 * (Bonjourr/_locales/fr/translations.json l.13-17).
 */
export function formatWeatherSentence(
  report: WeatherReport,
  options: WeatherSentenceOptions,
): string {
  const symbol = options.showUnit ? (options.unit === "imperial" ? "F" : "C") : "";
  const sunsetHour = options.sunsetHour ?? report.sunset?.[0] ?? 18;
  const afterSunset = options.hour > sunsetHour;
  const high = afterSunset ? report.tomorrowHigh : report.todayHigh;
  const description =
    report.description.charAt(0).toUpperCase() + report.description.slice(1);
  const actual = `${report.temp}°${symbol}`;
  const feels = `${report.feels}°${symbol}`;
  const temperature =
    options.temperature === "feelslike"
      ? `Il y a actuellement un ressenti de ${feels}`
      : options.temperature === "both"
        ? `Il fait actuellement ${actual} avec un ressenti de ${feels}`
        : `Il fait actuellement ${actual}`;
  const forecast =
    high === null || !shouldShowForecast(options.forecast, options.hour, sunsetHour)
      ? ""
      : ` avec un maximum de ${high}°${symbol} ${afterSunset ? "demain" : "aujourd'hui"}`;
  return `${description}. ${temperature}${forecast}.`;
}

/** display.ts l.114-133 : `custom` renvoie l'URL saisie (`weather.provider` de l'origine). */
export function moreInfoLink(
  moreinfo: WeatherMoreInfo,
  options: { link?: string; custom?: string },
): string | null {
  if (!moreinfo || moreinfo === "none") return null;
  if (moreinfo === "custom") return options.custom ?? null;
  if (moreinfo === "accu") return options.link ?? "https://www.accuweather.com/";
  if (moreinfo === "msnw") return "https://www.msn.com/en-xl/weather/forecast/";
  if (moreinfo === "yhw") return "https://www.yahoo.com/news/weather/";
  if (moreinfo === "windy") return "https://www.windy.com/";
  return null;
}

export type WeatherCity = { name: string; country?: string; lat: number; lon: number };

/**
 * Suggestions de villes pour la géolocalisation manuelle. L'origine passe par le proxy
 * (settings.ts l.205-238) ; le fork utilise le géocodage Open-Meteo, sans clé.
 */
export async function searchCities(
  query: string,
  fetchImpl: FetchImpl = (input) => fetch(input),
): Promise<WeatherCity[]> {
  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.searchParams.set("name", query);
  url.searchParams.set("count", "5");
  url.searchParams.set("language", "fr");
  url.searchParams.set("format", "json");
  try {
    const response = await fetchImpl(url.toString());
    if (!response.ok) return [];
    const payload = (await response.json()) as {
      results?: { name?: string; country?: string; latitude?: number; longitude?: number }[];
    };
    return (payload.results ?? [])
      .filter((city) => typeof city.latitude === "number" && typeof city.longitude === "number")
      .map((city) => ({
        name: String(city.name),
        country: city.country,
        lat: Number(city.latitude),
        lon: Number(city.longitude),
      }));
  } catch {
    return [];
  }
}
