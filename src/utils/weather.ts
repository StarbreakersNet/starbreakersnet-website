import type { WeatherLocation, WeatherSettings } from "@/types/Widget";

// Météo et recherche de villes par Open-Meteo (https://open-meteo.com) : gratuit, sans clé ni
// compte, appelé depuis le navigateur. Seules les coordonnées de la ville choisie lui sont envoyées.

const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
// Prévisions gardées 15 minutes, partagées entre widgets de la même ville
const CACHE_DURATION = 15 * 60 * 1000;

export interface Forecast {
  temperature: number;
  apparent: number;
  code: number;
  isDay: boolean;
  days: { date: string; code: number; max: number; min: number }[];
}

const cache = new Map<string, { at: number; promise: Promise<Forecast> }>();

export function fetchForecast({ location, unit }: WeatherSettings): Promise<Forecast> {
  const key = `${location.latitude},${location.longitude},${unit}`;
  const cached = cache.get(key);
  if (cached && Date.now() - cached.at < CACHE_DURATION) {
    return cached.promise;
  }

  const params = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    current: "temperature_2m,apparent_temperature,weather_code,is_day",
    daily: "weather_code,temperature_2m_max,temperature_2m_min",
    temperature_unit: unit,
    timezone: "auto",
    forecast_days: "6",
  });

  const promise = fetch(`${FORECAST_URL}?${params}`)
    .then(response => {
      if (!response.ok) throw new Error(`Open-Meteo : ${response.status}`);
      return response.json();
    })
    .then(data => ({
      temperature: data.current.temperature_2m,
      apparent: data.current.apparent_temperature,
      code: data.current.weather_code,
      isDay: data.current.is_day === 1,
      days: (data.daily.time as string[]).map((date, index) => ({
        date,
        code: data.daily.weather_code[index],
        max: data.daily.temperature_2m_max[index],
        min: data.daily.temperature_2m_min[index],
      })),
    }));

  cache.set(key, { at: Date.now(), promise });
  // Échec : pas gardé en cache, le prochain rafraîchissement réessaiera
  promise.catch(() => cache.delete(key));
  return promise;
}

export async function searchCities(query: string): Promise<WeatherLocation[]> {
  const params = new URLSearchParams({ name: query, count: "6", language: "fr", format: "json" });
  const response = await fetch(`${GEOCODING_URL}?${params}`);
  if (!response.ok) throw new Error(`Open-Meteo : ${response.status}`);

  const data = await response.json();
  return ((data.results ?? []) as Record<string, unknown>[]).map(result => ({
    name: String(result.name),
    detail: [result.admin1, result.country].filter(Boolean).join(", "),
    latitude: Number(result.latitude),
    longitude: Number(result.longitude),
  }));
}

// Codes météo WMO, regroupés comme dans l'app Météo : libellé et icône (jour, nuit)
const CONDITIONS: { codes: number[]; label: string; day: string; night: string }[] = [
  { codes: [0], label: "Ciel dégagé", day: "sun", night: "moon" },
  { codes: [1], label: "Plutôt dégagé", day: "cloud-sun", night: "cloud-moon" },
  { codes: [2], label: "Partiellement nuageux", day: "cloud-sun", night: "cloud-moon" },
  { codes: [3], label: "Couvert", day: "cloud", night: "cloud" },
  { codes: [45, 48], label: "Brouillard", day: "smog", night: "smog" },
  { codes: [51, 53, 55, 56, 57], label: "Bruine", day: "cloud-rain", night: "cloud-rain" },
  { codes: [61, 63, 66, 80, 81], label: "Pluie", day: "cloud-rain", night: "cloud-rain" },
  {
    codes: [65, 67, 82],
    label: "Forte pluie",
    day: "cloud-showers-heavy",
    night: "cloud-showers-heavy",
  },
  { codes: [71, 73, 75, 77, 85, 86], label: "Neige", day: "snowflake", night: "snowflake" },
  { codes: [95, 96, 99], label: "Orage", day: "cloud-bolt", night: "cloud-bolt" },
];

export function describeWeather(code: number, isDay = true) {
  const condition = CONDITIONS.find(item => item.codes.includes(code)) ?? CONDITIONS[3]!;
  return { label: condition.label, icon: isDay ? condition.day : condition.night };
}
