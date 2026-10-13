import { describe, expect, it, vi } from "vitest";
import {
  buildWeatherUrl,
  describeWeatherCode,
  fetchWeather,
  fetchWeatherReport,
  formatWeatherLine,
  formatWeatherSentence,
  moreInfoLink,
  parseWeatherReport,
  parseWeatherResponse,
  searchCities,
  weatherIcon,
} from "@/bonjourr/weather";

// Payload au format Open-Meteo, valeurs calées sur la capture affichage_bonjourr.png
const payload = {
  current: { time: "2026-10-13T22:06", temperature_2m: 20.4, weather_code: 1, is_day: 0 },
  daily: {
    time: ["2026-10-13", "2026-10-14"],
    temperature_2m_max: [21.0, 13.2],
  },
};

describe("parseWeatherResponse", () => {
  it("extrait température courante, code, jour/nuit et max de demain", () => {
    expect(parseWeatherResponse(payload)).toEqual({
      currentTemp: 20,
      code: 1,
      isDay: false,
      tomorrowMax: 13,
    });
  });
});

describe("formatWeatherLine (phrase exacte de la capture)", () => {
  it("produit « Plutôt dégagé. Il fait actuellement 20° avec un maximum de 13° demain. »", () => {
    const weather = parseWeatherResponse(payload);
    expect(formatWeatherLine(weather)).toBe(
      "Plutôt dégagé. Il fait actuellement 20° avec un maximum de 13° demain.",
    );
  });
});

describe("describeWeatherCode", () => {
  it("traduit les codes weather d'Open-Meteo", () => {
    expect(describeWeatherCode(0)).toBe("Ciel dégagé");
    expect(describeWeatherCode(1)).toBe("Plutôt dégagé");
    expect(describeWeatherCode(3)).toBe("Très nuageux");
    expect(describeWeatherCode(61)).toBe("Pluie faible");
    expect(describeWeatherCode(95)).toBe("Orage");
    expect(describeWeatherCode(42)).toBe("Temps variable"); // code inconnu → repli neutre
  });
});

describe("weatherIcon", () => {
  it("retourne la lune la nuit (capture : lune à 22h) et le soleil le jour", () => {
    expect(weatherIcon({ ...parseWeatherResponse(payload) })).toBe("moon");
    expect(weatherIcon({ ...parseWeatherResponse(payload), isDay: true })).toBe("sun");
  });
});

describe("fetchWeather", () => {
  it("interpelle Open-Meteo avec les coordonnées demandées", async () => {
    const fetchImpl = vi.fn(async (url: string) => {
      expect(url).toContain("api.open-meteo.com");
      expect(url).toContain("latitude=48.857");
      return { ok: true, json: async () => payload } as unknown as Response;
    });
    const weather = await fetchWeather({ lat: 48.857, lon: 2.351 }, fetchImpl);
    expect(weather?.currentTemp).toBe(20);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("revient à null sans réseau (repli silencieux)", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new TypeError("fetch failed");
    });
    await expect(fetchWeather({ lat: 0, lon: 0 }, fetchImpl)).resolves.toBeNull();
  });

  it("revient à null si la réponse n'est pas ok", async () => {
    const fetchImpl = vi.fn(async () => ({ ok: false }) as unknown as Response);
    await expect(fetchWeather({ lat: 0, lon: 0 }, fetchImpl)).resolves.toBeNull();
  });
});

// Case 14 : providers multiples, unités, moreinfo, géoloc/ville.
// Fixtures : payloads open-meteo, proxy d'origine (weather.bonjourr.fr) et geocoding
// capturés en direct le 16/10/2026 depuis ce poste ; openweathermap et meteofrance sont
// documentés (les deux endpoints répondent 401 sans clé, vérifié le 16/10/2026).

const openMeteoFixture = {
  latitude: 48.853382,
  timezone: "Europe/Paris",
  current: {
    time: "2026-10-16T01:45",
    temperature_2m: 16.4,
    apparent_temperature: 16.5,
    weather_code: 0,
    is_day: 0,
  },
  daily: {
    time: ["2026-10-16", "2026-10-17"],
    temperature_2m_max: [21.5, 16.0],
    sunrise: ["2026-10-16T08:12", "2026-10-17T08:13"],
    sunset: ["2026-10-16T18:59", "2026-10-17T18:57"],
  },
};

const bonjourrFixture = {
  meta: {
    url: "https://accuweather.com/fr/fr/saint-victor/2608459/weather-forecast/2608459",
    lang: "fr",
    provider: "accuweather",
  },
  geo: { city: "saint-victor", country: "FR", lat: 48.85, lon: 2.35 },
  now: { icon: "clearsky", description: "Plutôt dégagé", temp: 16, feels: 16 },
  sun: { rise: [8, 12], set: [19, 0] },
  daily: [
    { time: "2026-10-15T23:00:00.000Z", high: 22, low: 9 },
    { time: "2026-10-16T23:00:00.000Z", high: 17, low: 6 },
  ],
};

const openWeatherMapFixture = {
  coord: { lon: 2.35, lat: 48.85 },
  weather: [{ id: 800, main: "Clear", description: "ciel dégagé", icon: "01n" }],
  base: "stations",
  main: { temp: 16.4, feels_like: 15.2, temp_min: 9.2, temp_max: 21.6, pressure: 1013 },
  wind: { speed: 3.1, deg: 250 },
  clouds: { all: 0 },
  dt: 1760580300,
  sys: { type: 1, id: 648, country: "FR", sunrise: 1760593920, sunset: 1760633940 },
  id: 2988507,
  name: "Paris",
  cod: 200,
};

const meteoFranceFixture = {
  update_time: "2026-10-16T00:00:00Z",
  type: "prediction",
  geometry: {},
  properties: {
    name: "Paris",
    daily_forecast: [
      {
        time: "2026-10-16T12:00:00Z",
        T_min: 9.2,
        T_max: 21.6,
        daily_weather_icon: "p01d",
        daily_weather_description: "Ensoleillé",
      },
      {
        time: "2026-10-17T12:00:00Z",
        T_min: 7.1,
        T_max: 16.0,
        daily_weather_icon: "p02d",
        daily_weather_description: "Partiellement nuageux",
      },
    ],
    forecast: [
      {
        time: "2026-10-16T00:00:00Z",
        T: 16.4,
        T_windchill: 15.1,
        weather_icon: "p01n",
        weather_description: "Nuit claire",
      },
      {
        time: "2026-10-16T01:00:00Z",
        T: 16.0,
        T_windchill: 15.0,
        weather_icon: "p01n",
        weather_description: "Ciel dégagé",
      },
      {
        time: "2026-10-16T02:00:00Z",
        T: 15.4,
        T_windchill: 14.2,
        weather_icon: "p02n",
        weather_description: "Quelques nuages",
      },
    ],
  },
};

// Heure choisie entre le 2e et le 3e créneau horaire du fixture Météo-France.
const at0130 = new Date("2026-10-16T01:30:00Z");

describe("buildWeatherUrl (un URL par provider)", () => {
  const coords = { lat: 48.85, lon: 2.35 };

  it("envoie l'unité demandée à Open-Meteo", () => {
    const celsius = buildWeatherUrl({ provider: "open-meteo", unit: "metric", coords });
    const fahrenheit = buildWeatherUrl({ provider: "open-meteo", unit: "imperial", coords });
    expect(celsius).toContain("api.open-meteo.com/v1/forecast");
    expect(celsius).toContain("temperature_unit=celsius");
    expect(fahrenheit).toContain("temperature_unit=fahrenheit");
  });

  it("reprend la requête du proxy d'origine (provider=auto, unit C|F)", () => {
    const url = new URL(
      buildWeatherUrl({ provider: "bonjourr", unit: "imperial", lang: "fr", coords }) ?? "",
    );
    expect(url.origin + url.pathname).toBe("https://weather.bonjourr.fr/");
    expect(url.searchParams.get("provider")).toBe("auto");
    expect(url.searchParams.get("data")).toBe("simple");
    expect(url.searchParams.get("unit")).toBe("F");
    expect(url.searchParams.get("lang")).toBe("fr");
    expect(url.searchParams.get("lat")).toBe("48.85");
  });

  it("passe par query=ville quand la géolocalisation est manuelle", () => {
    const url = new URL(
      buildWeatherUrl({ provider: "bonjourr", unit: "metric", city: "Lyon, FR" }) ?? "",
    );
    expect(url.searchParams.get("query")).toBe("Lyon, FR");
    expect(url.searchParams.has("lat")).toBe(false);
  });

  it("exige une clé pour openweathermap et meteofrance", () => {
    const owm = buildWeatherUrl({
      provider: "openweathermap",
      unit: "metric",
      coords,
      key: "CLE-OWM",
    });
    expect(owm).toContain("api.openweathermap.org/data/2.5/weather");
    expect(owm).toContain("units=metric");
    expect(owm).toContain("appid=CLE-OWM");
    const mf = buildWeatherUrl({ provider: "meteofrance", unit: "metric", coords, key: "TOKEN" });
    expect(mf).toContain("webservice.meteofrance.com/forecast");
    expect(mf).toContain("token=TOKEN");
    expect(buildWeatherUrl({ provider: "openweathermap", unit: "metric", coords })).toBeNull();
    expect(buildWeatherUrl({ provider: "meteofrance", unit: "metric", coords })).toBeNull();
  });
});

describe("parseWeatherReport (un parseur par provider)", () => {
  it("lit Open-Meteo : ressenti, jour/nuit, max du jour et de demain", () => {
    const report = parseWeatherReport("open-meteo", openMeteoFixture, at0130);
    expect(report).toMatchObject({
      description: "Ciel dégagé",
      temp: 16,
      feels: 16,
      isDay: false,
      todayHigh: 21,
      tomorrowHigh: 16,
      sunrise: [8, 12],
      sunset: [18, 59],
    });
  });

  it("lit le proxy d'origine : description, ville, lien et maxs", () => {
    const report = parseWeatherReport("bonjourr", bonjourrFixture, at0130);
    expect(report).toMatchObject({
      description: "Plutôt dégagé",
      temp: 16,
      feels: 16,
      todayHigh: 22,
      tomorrowHigh: 17,
      city: "saint-victor",
      country: "FR",
      link: "https://accuweather.com/fr/fr/saint-victor/2608459/weather-forecast/2608459",
      sunrise: [8, 12],
      sunset: [19, 0],
    });
  });

  it("lit OpenWeatherMap : ressenti, max du jour, nuit vue depuis l'icône", () => {
    const report = parseWeatherReport("openweathermap", openWeatherMapFixture, at0130);
    expect(report).toMatchObject({
      description: "ciel dégagé",
      temp: 16,
      feels: 15,
      isDay: false,
      todayHigh: 21,
      city: "Paris",
      country: "FR",
    });
  });

  it("lit Météo-France : dernier créneau horaire passé, max du jour et de demain", () => {
    const report = parseWeatherReport("meteofrance", meteoFranceFixture, at0130);
    expect(report).toMatchObject({
      description: "Ciel dégagé",
      temp: 16,
      feels: 15,
      isDay: false,
      todayHigh: 21,
      tomorrowHigh: 16,
      city: "Paris",
    });
  });

  it("revient à null sur un payload inattendu", () => {
    expect(parseWeatherReport("open-meteo", {}, at0130)).toBeNull();
    expect(parseWeatherReport("openweathermap", null, at0130)).toBeNull();
  });
});

describe("formatWeatherSentence (façon display.ts)", () => {
  const report = () => parseWeatherReport("bonjourr", bonjourrFixture, at0130)!;

  it("décrit la température réelle, ressentie ou les deux", () => {
    const base = { unit: "metric", showUnit: false, hour: 10, sunsetHour: 19 } as const;
    expect(
      formatWeatherSentence(report(), { ...base, temperature: "actual", forecast: "always" }),
    ).toBe("Plutôt dégagé. Il fait actuellement 16° avec un maximum de 22° aujourd'hui.");
    expect(
      formatWeatherSentence(report(), { ...base, temperature: "feelslike", forecast: "never" }),
    ).toBe("Plutôt dégagé. Il y a actuellement un ressenti de 16°.");
    expect(
      formatWeatherSentence(report(), { ...base, temperature: "both", forecast: "never" }),
    ).toBe("Plutôt dégagé. Il fait actuellement 16° avec un ressenti de 16°.");
  });

  it("ajoute C ou F quand show_unit est actif", () => {
    const sentence = formatWeatherSentence(
      { ...report(), temp: 61 },
      {
        unit: "imperial",
        showUnit: true,
        temperature: "actual",
        forecast: "always",
        hour: 10,
        sunsetHour: 19,
      },
    );
    expect(sentence).toBe(
      "Plutôt dégagé. Il fait actuellement 61°F avec un maximum de 22°F aujourd'hui.",
    );
  });

  it("bascule sur demain après le coucher du soleil", () => {
    const sentence = formatWeatherSentence(report(), {
      unit: "metric",
      showUnit: false,
      temperature: "actual",
      forecast: "always",
      hour: 22,
      sunsetHour: 19,
    });
    expect(sentence).toContain("avec un maximum de 17° demain.");
  });

  it("forecast auto : matin ou après le coucher, jamais l'après-midi", () => {
    const options = {
      unit: "metric",
      showUnit: false,
      temperature: "actual",
      forecast: "auto",
      sunsetHour: 19,
    } as const;
    expect(formatWeatherSentence(report(), { ...options, hour: 15 }).includes("maximum")).toBe(
      false,
    );
    expect(formatWeatherSentence(report(), { ...options, hour: 8 }).includes("maximum")).toBe(true);
  });
});

describe("moreInfoLink (display.ts l.114-133)", () => {
  const link = () => parseWeatherReport("bonjourr", bonjourrFixture, at0130)!.link;

  it("ne relie rien par défaut ni en custom sans fournisseur", () => {
    expect(moreInfoLink("none", { link: link() })).toBeNull();
    expect(moreInfoLink("custom", { link: link() })).toBeNull();
  });

  it("relie le fournisseur demandé", () => {
    expect(moreInfoLink("accu", { link: link() })).toContain("accuweather.com/fr/fr/saint-victor");
    expect(moreInfoLink("windy", { link: link() })).toBe("https://www.windy.com/");
    expect(moreInfoLink("yhw", { link: link() })).toBe("https://www.yahoo.com/news/weather/");
    expect(moreInfoLink("msnw", { link: link() })).toBe("https://www.msn.com/en-xl/weather/forecast/");
    expect(moreInfoLink("custom", { custom: "https://weatherbug.com/" })).toBe(
      "https://weatherbug.com/",
    );
  });
});

describe("fetchWeatherReport et recherche de ville", () => {
  it("ne demande rien à un provider sans clé (repli silencieux)", async () => {
    const fetchImpl = vi.fn();
    await expect(
      fetchWeatherReport({ provider: "openweathermap", unit: "metric", coords: { lat: 0, lon: 0 } }, fetchImpl),
    ).resolves.toBeNull();
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("interroge le provider choisi et normalise la réponse", async () => {
    const fetchImpl = vi.fn(async () => ({ ok: true, json: async () => bonjourrFixture }) as unknown as Response);
    const report = await fetchWeatherReport(
      { provider: "bonjourr", unit: "metric", lang: "fr", coords: { lat: 48.85, lon: 2.35 } },
      fetchImpl,
    );
    expect(report?.description).toBe("Plutôt dégagé");
    expect(fetchImpl.mock.calls[0][0]).toContain("weather.bonjourr.fr");
  });

  it("cherche des villes pour la géolocalisation manuelle", async () => {
    const fetchImpl = vi.fn(async (url: string) => {
      expect(url).toContain("geocoding-api.open-meteo.com");
      expect(url).toContain("name=Lyon");
      return {
        ok: true,
        json: async () => ({
          results: [
            { name: "Lyon", latitude: 45.74906, longitude: 4.84789, country: "France" },
            { name: "Lyon", latitude: 34.21789, longitude: -90.54204, country: "États-Unis" },
          ],
        }),
      } as unknown as Response;
    });
    const cities = await searchCities("Lyon", fetchImpl);
    expect(cities).toHaveLength(2);
    expect(cities[0]).toEqual({ name: "Lyon", country: "France", lat: 45.74906, lon: 4.84789 });
  });
});
