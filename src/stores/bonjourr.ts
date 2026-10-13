// Fork natif TypeScript de Bonjourr : modèle de réglages typé (src/bonjourr/config,
// sous-ensemble documenté de SYNC_DEFAULT) persisté en localStorage.
// Les accesseurs legacy (backgroundUrl, showWeather, blur) mappent vers le modèle.
import { computed, reactive } from "vue";
import { defineStore } from "pinia";
import {
  type BonjourrConfig,
  DEFAULTS,
  deepMerge,
  mergeWithDefaults,
} from "@/bonjourr/config";
import {
  exportConfig,
  isImportable,
  mergeConfig,
  parseConfig,
} from "@/bonjourr/datamanage";

export const STORAGE_KEY = "starbreakers-bonjourr";

function migrateLegacy(parsed: Record<string, unknown>): Record<string, unknown> {
  const backgrounds = (
    typeof parsed.backgrounds === "object" && parsed.backgrounds !== null
      ? { ...(parsed.backgrounds as Record<string, unknown>) }
      : {}
  ) as Record<string, unknown>;
  if (typeof parsed.backgroundUrl === "string" && parsed.backgroundUrl) {
    if (backgrounds.urls === undefined) backgrounds.urls = parsed.backgroundUrl;
    if (backgrounds.type === undefined) backgrounds.type = "urls";
  }
  if (typeof parsed.blur === "number" && backgrounds.blur === undefined) {
    backgrounds.blur = parsed.blur;
  }
  if (parsed.showWeather === false && parsed.hide === undefined) {
    parsed.hide = { weatherdesc: true, weathericon: true };
  }
  delete parsed.backgroundUrl;
  delete parsed.showWeather;
  delete parsed.blur;
  if (Object.keys(backgrounds).length > 0) parsed.backgrounds = backgrounds;
  return parsed;
}

function loadConfig(): BonjourrConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULTS);
    const parsed = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return structuredClone(DEFAULTS);
    return mergeWithDefaults(migrateLegacy(parsed));
  } catch {
    return structuredClone(DEFAULTS);
  }
}

export type ConfigPatch = {
  [K in keyof BonjourrConfig]?: BonjourrConfig[K] extends object
    ? Partial<BonjourrConfig[K]>
    : BonjourrConfig[K];
};

export const useBonjourrStore = defineStore("bonjourr", () => {
  const config = reactive(loadConfig());

  function persist() {
    const snapshot = JSON.parse(JSON.stringify(config)) as Record<string, unknown>;
    // Miroirs legacy (session 1) pour la compatibilité disque.
    snapshot.backgroundUrl = backgroundUrl.value;
    snapshot.showWeather = showWeather.value;
    snapshot.blur = config.backgrounds.blur;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  }

  function patch(partial: ConfigPatch) {
    deepMerge(config as Record<string, unknown>, partial as Record<string, unknown>);
    persist();
  }

  /** Section « Données » : JSON ordonné de la config (stringify.ts l.6-36). */
  function exportJson(): string {
    return exportConfig(config);
  }

  /** `loadImportFile` + `importSettings` (settings.ts l.1464-1543) ; false si rien d'importable. */
  function importText(text: string): boolean {
    const parsed = parseConfig(text);
    if (!isImportable(parsed)) return false;
    const merged = mergeConfig(config, parsed) as Record<string, unknown>;
    for (const key of Object.keys(config)) {
      delete (config as Record<string, unknown>)[key];
    }
    Object.assign(config, merged);
    persist();
    return true;
  }

  const backgroundUrl = computed({
    get: () =>
      config.backgrounds.type === "urls"
        ? (config.backgrounds.urls
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean)[0] ?? "")
        : "",
    set: (url: string) => {
      config.backgrounds.type = "urls";
      config.backgrounds.urls = url;
      persist();
    },
  });

  const showWeather = computed({
    get: () => !(config.hide.weatherdesc && config.hide.weathericon),
    set: (value: boolean) => {
      config.hide.weatherdesc = !value;
      config.hide.weathericon = !value;
      persist();
    },
  });

  const blur = computed({
    get: () => config.backgrounds.blur,
    set: (value: number) => {
      config.backgrounds.blur = value;
      persist();
    },
  });

  function setBackgroundUrl(url: string) {
    backgroundUrl.value = url;
  }

  function setShowWeather(value: boolean) {
    showWeather.value = value;
  }

  function setBlur(value: number) {
    blur.value = value;
  }

  return {
    config,
    patch,
    exportJson,
    importText,
    backgroundUrl,
    showWeather,
    blur,
    setBackgroundUrl,
    setShowWeather,
    setBlur,
  };
});
