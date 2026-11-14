import type { WeatherLocation, WeatherSettings } from "@/types/Widget";

// Météo et recherche de villes par Open-Meteo (https://open-meteo.com) : gratuit, sans clé ni
// compte, appelé depuis le navigateur. Seules les coordonnées de la ville choisie, ou de la position
// de l'appareil arrondies à ~1 km, lui sont envoyées.

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

// Position de l'appareil : attente maximale, et âge accepté d'une position déjà connue du navigateur
const LOCATE_TIMEOUT = 10 * 1000;
const LOCATE_MAX_AGE = 10 * 60 * 1000;

const cache = new Map<string, { at: number; promise: Promise<Forecast> }>();

// Coordonnées arrondies à 2 décimales (~1 km) : assez pour la météo, sans enregistrer sur le compte
// ni envoyer à Open-Meteo l'adresse précise de l'appareil
export function roundCoordinates({ latitude, longitude }: { latitude: number; longitude: number }) {
  const round = (value: number) => Math.round(value * 100) / 100;

  return { latitude: round(latitude), longitude: round(longitude) };
}

export function fetchForecast(settings: WeatherSettings): Promise<Forecast> {
  const { unit } = settings;
  const location = roundCoordinates(settings.location);
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

// Position de l'appareil, demandée au navigateur (qui demande l'autorisation la première fois) et
// arrondie. Échec : erreur au message court et lisible (« Position refusée par le navigateur »).
export function locateDevice(): Promise<{ latitude: number; longitude: number }> {
  if (!window.isSecureContext) {
    return Promise.reject(new Error("Position disponible seulement en HTTPS"));
  }
  if (!("geolocation" in navigator)) {
    return Promise.reject(new Error("Position non prise en charge par ce navigateur"));
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      position => resolve(roundCoordinates(position.coords)),
      error => reject(new Error(locateErrorMessage(error))),
      { enableHighAccuracy: false, timeout: LOCATE_TIMEOUT, maximumAge: LOCATE_MAX_AGE }
    );
  });
}

function locateErrorMessage(error: GeolocationPositionError) {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return "Position refusée par le navigateur";
    case error.TIMEOUT:
      return "Position introuvable à temps";
    default:
      return "Position indisponible";
  }
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
