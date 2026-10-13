<script lang="ts" setup>
// Panneau de réglages du fork Bonjourr : colonne scrollée à gauche, sections
// déroulées comme l'original (Bonjourr/src/settings.html), fermeture par Échap
// (advanced.escKey). Les cases ultérieures du PLAN branchent les réglages de
// chaque section sur store.config. Depuis la case 13, la section Horloge porte
// elle-même des cases à cocher : les tests visent la section, plus la position.
import { computed, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { PROVIDERS } from "@/bonjourr/backgrounds";
import { IANA_TIMEZONES, UTC_OFFSETS, type WorldClockEntry } from "@/bonjourr/clock";
import type { BonjourrConfig } from "@/bonjourr/config";
import { requestBackgroundRefresh } from "@/bonjourr/events";
import { translate } from "@/bonjourr/i18n";
import { addLink } from "@/bonjourr/links";
import { NOTES_FALLBACK_BACKGROUND, hexFromSplitRange, opacityFromHex } from "@/bonjourr/notes";
import { minutesToSeconds, playAlarmSound, secondsToMinutes } from "@/bonjourr/pomodoro";
import { canStoreUrl } from "@/bonjourr/quotes";
import { isValidCustomRequest, SEARCHBAR_ENGINES } from "@/bonjourr/search";
import { useBonjourrStore } from "@/stores/bonjourr";

const emit = defineEmits<{ close: [] }>();
const settings = useBonjourrStore();

// i18n FR/EN (case 21) : le français est la langue par défaut et la clé du
// dictionnaire ; `translate` est la version bicouche de `trads()` (i18n.ts).
const t = (key: string) => translate(settings.config.lang, key);

// Section « Données » (settings.html l.2139-2196 ; settings.ts l.1442-1543).
const dataEl = ref<HTMLTextAreaElement | null>(null);
const fileEl = ref<HTMLInputElement | null>(null);
const downloadEl = ref<HTMLAnchorElement | null>(null);

function copyData() {
  void navigator.clipboard?.writeText(settings.exportJson());
}

function applyData() {
  if (dataEl.value) {
    settings.importText(dataEl.value.value);
  }
}

function pickImportFile() {
  fileEl.value?.click();
}

async function loadImportFile(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (file) {
    settings.importText(await file.text());
    input.value = "";
  }
}

/** `saveImportFile` (settings.ts l.1442-1462) : Blob application/json, nom `bonjourr-….json`. */
function saveExportFile() {
  const anchor = downloadEl.value;
  if (!anchor) {
    return;
  }
  anchor.href = URL.createObjectURL(
    new Blob([settings.exportJson()], { type: "application/json" }),
  );
  anchor.download = `bonjourr-${window.location.hostname || "starbreakers"}.json`;
  anchor.click();
  URL.revokeObjectURL(anchor.href);
}

// Trois emplacements d'heures du monde (l'original en propose cinq, settings.html
// l.963-1018) ; régions et fuseaux par défaut repris de features/clock/index.ts l.58-59.
const WORLD_CLOCK_SLOTS = [0, 1, 2];
const WORLD_CLOCK_REGIONS = ["Paris", "New York", "Tokyo"];
const WORLD_CLOCK_TIMEZONES = ["Europe/Paris", "America/Sao_Paulo", "America/Los_Angeles"];

const TIMEZONE_GROUPS = [
  { label: "Automatique", options: [{ value: "auto", label: "Automatique" }] },
  { label: "Décalage UTC", options: UTC_OFFSETS.map((value) => ({ value, label: `UTC ${value}` })) },
  { label: "Zones IANA", options: IANA_TIMEZONES.map((value) => ({ value, label: value })) },
];

const DATE_FORMATS = [
  { value: "auto", label: "Automatique" },
  { value: "eu", label: "Jour date mois" },
  { value: "us", label: "Jour, mois date" },
  { value: "cn", label: "Mois date jour" },
];

const ANALOG_SHAPES = [
  { value: "round", label: "Rond" },
  { value: "square", label: "Carré" },
  { value: "rectangle", label: "Rectangle" },
];

const ANALOG_FACES = [
  { value: "none", label: "Aucun" },
  { value: "number", label: "Chiffres" },
  { value: "roman", label: "Chiffres romains" },
  { value: "marks", label: "Repères" },
];

const ANALOG_HANDS = [
  { value: "modern", label: "Moderne" },
  { value: "classic", label: "Classique" },
  { value: "swiss", label: "Railway suisse" },
];

// Case 20 — Les quatre valeurs de `i_dark` (settings.html l.54-59), libellés FR
// de _locales/fr/translations.json l.106-111.
const DARK_MODES = [
  { value: "system", label: "Système" },
  { value: "auto", label: "La nuit" },
  { value: "enable", label: "Activé" },
  { value: "disable", label: "Désactivé" },
];

// Les neuf graisses de `i_weight` (settings.html l.1824-1834), libellés FR de
// translations.json l.334-341, plus « Medium » à l.201.
const FONT_WEIGHTS = [
  { value: "100", label: "Fin" },
  { value: "200", label: "Très léger" },
  { value: "300", label: "Léger" },
  { value: "400", label: "Normale" },
  { value: "500", label: "Moyens" },
  { value: "600", label: "Semi-gras" },
  { value: "700", label: "Gras" },
  { value: "800", label: "Très gras" },
  { value: "900", label: "Noir" },
];

// `i_timehide` (settings.html l.942-946), libellés FR de translations.json l.242-244.
const TIMEHIDE_OPTIONS = [
  { value: "all", label: "Horloge et date" },
  { value: "date", label: "Horloge seulement" },
  { value: "clock", label: "Date seulement" },
];

// `i_weatherhide` (settings.html l.1191-1196), libellés FR de translations.json
// l.288-290 et « Disabled » à l.107.
const WEATHERHIDE_OPTIONS = [
  { value: "all", label: "Description et icône" },
  { value: "icon", label: "Description seulement" },
  { value: "desc", label: "Icône seulement" },
  { value: "disabled", label: "Désactivé" },
];

/** Valeur courante de `i_timehide`, inverse de la règle de settings.ts l.689. */
const timehideValue = computed(() => {
  const { clock, date } = settings.config.hide;

  if (clock && !date) {
    return "clock";
  }

  if (date && !clock) {
    return "date";
  }

  return "all";
});

/** Changement de `i_timehide` (settings.ts l.689) : « clock » masque l’horloge. */
function patchTimehide(value: string) {
  settings.patch({ hide: { clock: value === "clock", date: value === "date" } });
}

/** Valeur courante de `i_weatherhide`, inverse de settings.ts l.733-734. */
const weatherhideValue = computed(() => {
  const { weatherdesc, weathericon } = settings.config.hide;

  if (weatherdesc && weathericon) {
    return "disabled";
  }

  if (weatherdesc) {
    return "desc";
  }

  if (weathericon) {
    return "icon";
  }

  return "all";
});

/** Changement de `i_weatherhide` (settings.ts l.733-734). */
function patchWeatherhide(value: string) {
  settings.patch({
    hide: {
      weatherdesc: value === "disabled" || value === "desc",
      weathericon: value === "disabled" || value === "icon",
    },
  });
}

// Famille saisie dans `i_customfont` (settings.html l.1802-1812). La source
// tranche entre police système et Fontsource (fonts.ts l.124-170) ; le fork
// n’a ni le test `systemFontChecker` ni la liste Fontsource à 800 familles :
// la valeur est appliquée telle quelle en famille Fontsource (règle
// `@font-face` de fonts.ts l.236-245 posée par applyVisuals), et une valeur
// vide revient au neutre système (l.129-133). Écart écrit au journal.
const customFamily = ref(settings.config.font.family);

function applyCustomFamily() {
  const family = customFamily.value.trim();

  if (family) {
    settings.patch({ font: { family, system: false } });
  } else {
    settings.patch({ font: { family: "", system: true } });
  }
}

// Cinq types, comme settings.html l.139-145 ; le type « files » reste affiché
// mais le fork n’a pas de magasin de fichiers du navigateur (journal-de-bord.md).
const BACKGROUND_TYPES = [
  { value: "images", label: "Images" },
  { value: "videos", label: "Vidéos" },
  { value: "files", label: "Fichiers locaux" },
  { value: "urls", label: "URL" },
  { value: "color", label: "Couleur unie" },
];

// Cinq fréquences, comme settings.html l.234-240.
const BACKGROUND_FREQUENCIES = [
  { value: "tabs", label: "Chaque onglet" },
  { value: "hour", label: "Chaque heure" },
  { value: "period", label: "Lumière du jour" },
  { value: "day", label: "Chaque jour" },
  { value: "pause", label: "Verrouillé" },
];

// Noms français des cinq fournisseurs (features/backgrounds/providers.ts
// l.1-75, traductions de _locales/fr/translations.json l.119-186).
const PROVIDER_LABELS: Record<string, string> = {
  "bonjourr-images-daylight": "Lumière du jour Bonjourr",
  "bonjourr-videos-daylight": "Lumière du jour Bonjourr",
  "unsplash-images-collections": "Collections Unsplash",
  "unsplash-images-search": "Recherche Unsplash",
  "pixabay-videos-search": "Recherche Pixabay",
};

const backgrounds = computed(() => settings.config.backgrounds);
const isCollectionType = computed(() => backgrounds.value.type === "images" || backgrounds.value.type === "videos");
const isVideos = computed(() => backgrounds.value.type === "videos");

/** Le nom de collection courant, clé des requêtes personnalisées (index.ts l.291). */
const collectionName = computed(() => (isVideos.value ? backgrounds.value.videos : backgrounds.value.images));

const providerOptions = computed(() =>
  (isVideos.value ? PROVIDERS.VIDEOS : PROVIDERS.IMAGES).flatMap((group) =>
    group.options.map((option) => ({ value: option.value, label: PROVIDER_LABELS[option.value] ?? option.value })),
  ),
);

/** Le champ de requête change d’identité selon le fournisseur (index.ts l.889-899). */
const queryField = computed(() => {
  if (collectionName.value.endsWith("-collections")) {
    return { id: "i_background-user-coll", label: "Collection personnalisée" };
  }

  if (collectionName.value.endsWith("-search")) {
    return { id: "i_background-user-search", label: "Recherche personnalisée" };
  }

  return undefined;
});

const queryValue = computed(() => backgrounds.value.queries[collectionName.value] ?? "");

function patchBackgrounds(partial: Partial<BonjourrConfig["backgrounds"]>) {
  settings.patch({ backgrounds: partial });
}

function patchProvider(value: string) {
  patchBackgrounds(isVideos.value ? { videos: value } : { images: value });
}

function patchQuery(value: string) {
  patchBackgrounds({ queries: { [collectionName.value]: value } });
}

function onBackgroundRange(name: "blur" | "bright" | "fadein", raw: string) {
  if (raw !== "" && Number.isFinite(Number(raw))) {
    patchBackgrounds({ [name]: Number(raw) } as Partial<BonjourrConfig["backgrounds"]>);
  }
}

const GREETING_FIELDS = [
  { key: "morning", label: "Le matin" },
  { key: "afternoon", label: "L’après-midi" },
  { key: "evening", label: "Le soir" },
  { key: "night", label: "La nuit" },
] as const;

// Réglages météo (case 14) : mêmes options que settings.html (i_geol l.1189 env.,
// i_units, i_show_unit, i_forecast, i_temp, i_moreinfo, i_provider), libellés français
// de _locales/fr/translations.json. Écart assumé : « source » et « apikey » choisissent
// la source de données, l’original n’interrogeant que son proxy weather.bonjourr.fr.
const WEATHER_SOURCES = [
  { value: "open-meteo", label: "Open-Meteo (sans clé)" },
  { value: "bonjourr", label: "Proxy Bonjourr" },
  { value: "openweathermap", label: "OpenWeatherMap (clé)" },
  { value: "meteofrance", label: "Météo-France (jeton)" },
];

const WEATHER_GEOLOCATIONS = [
  { value: "off", label: "Manuelle" },
  { value: "approximate", label: "Approximative" },
  { value: "precise", label: "Précise" },
];

const WEATHER_UNITS = [
  { value: "metric", label: "Celsius" },
  { value: "imperial", label: "Fahrenheit" },
];

const WEATHER_FORECASTS = [
  { value: "auto", label: "Automatique" },
  { value: "always", label: "Toujours" },
  { value: "never", label: "Jamais" },
];

const WEATHER_TEMPERATURES = [
  { value: "actual", label: "Réelle" },
  { value: "feelslike", label: "Ressenti" },
  { value: "both", label: "Les deux" },
];

const WEATHER_MOREINFO = [
  { value: "none", label: "Aucun" },
  { value: "accu", label: "Accuweather" },
  { value: "msnw", label: "MSN Weather" },
  { value: "yhw", label: "Yahoo Weather" },
  { value: "windy", label: "Windy.com" },
  { value: "custom", label: "Fournisseur personnalisé" },
];

// Une seule clé par source : appid OpenWeatherMap, jeton Météo-France (les deux
// endpoints répondent 401 sans clé, vérifié le 16/10/2026).
const WEATHER_KEY_LABELS: Record<string, string> = {
  openweathermap: "Clé API OpenWeatherMap",
  meteofrance: "Jeton Météo-France",
};

function worldClock(index: number): WorldClockEntry {
  return (
    settings.config.worldclocks[index] ?? {
      region: "",
      timezone: WORLD_CLOCK_TIMEZONES[index] ?? "auto",
    }
  );
}

function patchWorldClock(index: number, partial: Partial<WorldClockEntry>) {
  const entries = [...settings.config.worldclocks];

  while (entries.length <= index) {
    const slot = entries.length;
    entries.push({
      region: "",
      timezone: WORLD_CLOCK_TIMEZONES[slot] ?? "auto",
    });
  }

  entries[index] = { ...entries[index], ...partial };
  settings.patch({ worldclocks: entries });
}

// Réglages météo : la fusion profonde du store suffit (patch({ weather: {...} })).
function patchWeather(partial: Partial<typeof settings.config.weather>) {
  settings.patch({ weather: partial });
}

// Réglages des liens rapides (case 15) : mêmes champs que settings.html l.588-727
// (i_quicklinks, f_addlink, i_linkgroups, i_linknewtab, i_icon_radius, i_row, i_linkstyle,
// b_showtitles, b_showbackgrounds) ; libellés français de _locales/fr/translations.json
// l.191-206. Écart assumé : les deux boutons-icônes « T » et « fond » deviennent des
// cases à cocher libellées, et l'import des favoris du navigateur (l.633-642) n'existe
// pas hors extension.
const LINK_STYLES = [
  { value: "large", label: "Grands" },
  { value: "medium", label: "Moyens" },
  { value: "small", label: "Petits" },
  { value: "inline", label: "En ligne" },
  { value: "text", label: "Texte" },
];

const newLink = reactive({ title: "", url: "" });

function patchLinkStyle(style: string) {
  settings.patch({ linkstyle: style as BonjourrConfig["linkstyle"] });
}

// `f_addlink` (settings.html l.598-630) : l'URL est requise, le titre ne l'est pas.
function addLinkFromPanel() {
  if (newLink.url.trim() === "") return;
  settings.patch({
    links: addLink(settings.config.links, {
      title: newLink.title,
      url: newLink.url,
      parent: settings.config.linkgroups.selected,
    }),
  });
  newLink.title = "";
  newLink.url = "";
}

// Réglages des notes (case 16) : mêmes champs que settings.html l.1317-1376
// (i_notes, i_notesalign, i_noteswidth, i_notes-opacity, i_notes-shade) ; la molette
// d'opacité et la nuance n'écrivent qu'un hexadécimal `notes.background`, comme
// settings.ts l.806-812 qui appelle `notes(undefined, { background: true })`.
const NOTES_ALIGNMENTS = [
  { value: "left", label: "Gauche" },
  { value: "center", label: "Centré" },
  { value: "right", label: "Droite" },
];

const notesBackground = computed(
  () => settings.config.notes.background ?? NOTES_FALLBACK_BACKGROUND,
);
const notesOpacity = computed(() => opacityFromHex(notesBackground.value));
// Nuance lue sur l'hexadécimal stocké (settings.ts l.279).
const notesShade = computed(() => (notesBackground.value.includes("#000") ? "dark" : "light"));

function patchNotesShade(shade: string) {
  settings.patch({
    notes: {
      background: hexFromSplitRange(
        notesOpacity.value,
        shade === "dark" ? "dark" : "light",
      ),
    },
  });
}

function patchNotesAlign(align: string) {
  settings.patch({ notes: { align: align as BonjourrConfig["notes"]["align"] } });
}

function patchNotesOpacity(opacity: number) {
  settings.patch({ notes: { background: hexFromSplitRange(opacity, notesShade.value) } });
}

// Citations : options de settings.html l.1547-1648, libellés français de
// _locales/fr/translations.json l.148-152 et l.321-329.
const QUOTE_TYPES = [
  { value: "classic", label: "Classique" },
  { value: "inspirobot", label: "Inspirobot" },
  { value: "kaamelott", label: "Kaamelott" },
  { value: "stoic", label: "Stoic" },
  { value: "hitokoto", label: "Hitokoto" },
  { value: "office", label: "The Office" },
  { value: "user", label: "Personnalisé" },
  { value: "url", label: "URL" },
];

const QUOTE_FREQUENCIES = [
  { value: "tabs", label: "Chaque onglet" },
  { value: "hour", label: "Chaque heure" },
  { value: "day", label: "Chaque jour" },
  { value: "pause", label: "Pause" },
];

const quoteUrlInput = reactive({ value: settings.config.quotes.url });
const quoteUrlWarning = ref("");

function patchQuoteType(type: string) {
  settings.patch({ quotes: { type: type as BonjourrConfig["quotes"]["type"] } });
}

function patchQuoteFrequency(frequency: string) {
  settings.patch({ quotes: { frequency: frequency as BonjourrConfig["quotes"]["frequency"] } });
}

// `f_qturl` n’accepte qu’une URL vide ou en http(s) (quotes.ts l.325-333) ; le
// avertissement imite `networkForm.warn` (shared/form.ts).
function submitQuoteUrl() {
  if (!canStoreUrl(quoteUrlInput.value)) {
    quoteUrlWarning.value = "URL invalide : http(s) requis.";
    return;
  }

  quoteUrlWarning.value = "";
  settings.patch({ quotes: { url: quoteUrlInput.value } });
}

// « Prochaine citation » : l’original date la citation puis avance d’un cran
// (quotes.ts l.99-101) ; le composant réagit à l’horodatage.
function nextQuote() {
  settings.patch({ quotes: { last: Date.now() } });
}

// Case 18 : minuteur. Le panneau règle les durées en minutes, le magasin les
// garde en secondes (features/pomodoro.ts l.592, settings.ts l.237-240).
const POMODORO_DURATIONS = [
  { key: "pomodoro", id: "i_pmdr_pomodoro", label: "Temps par défaut" },
  { key: "break", id: "i_pmdr_break", label: "Temps de pause" },
  { key: "longbreak", id: "i_pmdr_longbreak", label: "Temps de longue pause" },
] as const;

// `i_pmdr_alarms` (settings.html l.1690-1693).
const POMODORO_ALARMS = [
  { value: "marimba", label: "Marimba" },
  { value: "clock-alarm", label: "Clock Alarm" },
];

type PomodoroDurationKey = (typeof POMODORO_DURATIONS)[number]["key"];

function durationMinutes(mode: PomodoroDurationKey): number {
  return secondsToMinutes(settings.config.pomodoro.timeFor[mode]);
}

function patchDuration(mode: PomodoroDurationKey, minutes: number) {
  settings.patch({
    pomodoro: { timeFor: { ...settings.config.pomodoro.timeFor, [mode]: minutesToSeconds(minutes) } },
  });
}

function onDurationInput(mode: PomodoroDurationKey, raw: string) {
  const minutes = Number(raw);

  if (raw !== "" && Number.isFinite(minutes)) {
    patchDuration(mode, minutes);
  }
}

function patchPomodoroAlarm(alarm: string) {
  settings.patch({ pomodoro: { alarm } });
}

// `i_pmdr_listen` (settings.html l.1695-1706) : l’original lit le mp3 de la
// mélodie ; le fork joue l’alarme synthétisée.
function listenAlarm() {
  playAlarmSound(settings.config.pomodoro.volume, settings.config.pomodoro.alarm);
}

function patchPomodoro(partial: Partial<typeof settings.config.pomodoro>) {
  settings.patch({ pomodoro: partial });
}

// `i_pmdr_volume` (settings.html l.1714-1723) : min .1, max 1, pas de .1.
function patchVolume(raw: string) {
  const volume = Number(raw);

  if (raw !== "" && Number.isFinite(volume)) {
    settings.patch({ pomodoro: { volume } });
  }
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === "Escape" && settings.config.escKey) {
    emit("close");
  }
}

onMounted(() => window.addEventListener("keydown", onKeydown));
onBeforeUnmount(() => window.removeEventListener("keydown", onKeydown));
</script>

<template>
  <aside class="settings-panel apple-blurred bonjourr-settings-panel">
    <h3 class="panel-title">{{ t("Réglages Bonjourr") }}</h3>

    <section class="panel-section">
      <h4 class="panel-section-title">{{ t("Apparence") }}</h4>

      <!-- Langue (settings.html l.45-46, `i_lang` rempli par settings.ts
           l.297-308) ; noms natifs non traduits, comme la source. -->
      <label class="setting" for="i_lang">
        <span>{{ t("Langue") }}</span>
        <select
          id="i_lang"
          :value="settings.config.lang"
          @change="settings.patch({ lang: ($event.target as HTMLSelectElement).value })">
          <option value="fr">Français</option>
          <option value="en">English</option>
        </select>
      </label>

      <!-- Mode sombre (settings.html l.52-60), champs d’onglet (l.64-96) et
           icône des réglages (l.111-118) ; libellés FR de translations.json
           l.27, l.106-117. -->
      <label class="setting" for="i_dark">
        <span>{{ t("Mode sombre") }}</span>
        <select
          id="i_dark"
          :value="settings.config.dark"
          @change="settings.patch({ dark: ($event.target as HTMLSelectElement).value as BonjourrConfig['dark'] })">
          <option v-for="mode in DARK_MODES" :key="mode.value" :value="mode.value">
            {{ t(mode.label) }}
          </option>
        </select>
      </label>

      <label class="setting" for="i_favicon">
        <span>{{ t("Icône nouvel onglet") }}</span>
        <input
          id="i_favicon"
          autocomplete="off"
          autocorrect="off"
          maxlength="2"
          name="favicon"
          placeholder="🌤"
          spellcheck="false"
          type="text"
          :value="settings.config.favicon"
          @input="settings.patch({ favicon: ($event.target as HTMLInputElement).value })" />
      </label>

      <label class="setting" for="i_tabtitle">
        <span>{{ t("Titre du nouvel onglet") }}</span>
        <input
          id="i_tabtitle"
          autocomplete="off"
          autocorrect="off"
          maxlength="80"
          name="tabtitle"
          :placeholder="t('Nouvel onglet')"
          spellcheck="false"
          type="text"
          :value="settings.config.tabtitle"
          @input="settings.patch({ tabtitle: ($event.target as HTMLInputElement).value })" />
      </label>

      <label class="setting" for="i_settingshide">
        <span>{{ t("Masquer l'icône des paramètres") }}</span>
        <input
          id="i_settingshide"
          class="switch"
          :checked="settings.config.hide.settingsicon"
          type="checkbox"
          @change="settings.patch({ hide: { settingsicon: ($event.target as HTMLInputElement).checked } })" />
      </label>

      <hr class="panel-separator" />

      <!-- Famille (settings.html l.1802-1812), graisse (l.1822-1835), couleur
           (l.1839-1846), taille et ombre (l.1850-1860) ; libellés FR de
           translations.json l.124, l.331-343. Le bouton est `type="button"` :
           happy-dom ne déclenche pas le submit du formulaire source. -->
      <div class="setting fontfamily">
        <span>{{ t("Police") }}</span>
        <div class="fontfamily-fields">
          <input
            id="i_customfont"
            autocomplete="off"
            list="dl_fontfamily"
            name="customfont"
            type="text"
            v-model="customFamily" />
          <datalist id="dl_fontfamily"></datalist>
          <button id="b_customfont" :title="t('Appliquer la police')" type="button" @click="applyCustomFamily">
            Appliquer
          </button>
        </div>
      </div>

      <label class="setting" for="i_weight">
        <span>{{ t("Épaisseur") }}</span>
        <select
          id="i_weight"
          :value="settings.config.font.weight"
          @change="settings.patch({ font: { weight: ($event.target as HTMLSelectElement).value } })">
          <option v-for="weight in FONT_WEIGHTS" :key="weight.value" :value="weight.value">
            {{ t(weight.label) }}
          </option>
        </select>
      </label>

      <label class="setting" for="i_font-color">
        <span>{{ t("Couleur") }}</span>
        <input
          id="i_font-color"
          name="font-color"
          type="color"
          :value="settings.config.font.color"
          @input="settings.patch({ font: { color: ($event.target as HTMLInputElement).value } })" />
      </label>

      <label class="setting" for="i_size">
        <span>{{ t("Taille") }}</span>
        <input
          id="i_size"
          max="26"
          min="5"
          name="fontsize"
          step="0.05"
          type="range"
          :value="settings.config.font.size"
          @input="settings.patch({ font: { size: ($event.target as HTMLInputElement).value } })" />
      </label>

      <label class="setting" for="i_textshadow">
        <span>{{ t("Ombres") }}</span>
        <input
          id="i_textshadow"
          max="1"
          min="0"
          name="textshadow"
          step="0.025"
          type="range"
          :value="settings.config.textShadow"
          @input="settings.patch({ textShadow: Number(($event.target as HTMLInputElement).value) })" />
      </label>

      <hr class="panel-separator" />

      <!-- Largeur et écart de page (settings.html l.1902-1921), libellés FR de
           translations.json l.355-356. -->
      <label class="setting" for="i_pagewidth">
        <span>{{ t("Largeur de la page") }}</span>
        <input
          id="i_pagewidth"
          max="2200"
          min="600"
          name="page_width"
          step="100"
          type="range"
          :value="settings.config.pagewidth"
          @input="settings.patch({ pagewidth: Number(($event.target as HTMLInputElement).value) })" />
      </label>

      <label class="setting" for="i_pagegap">
        <span>{{ t("Écart de la page") }}</span>
        <input
          id="i_pagegap"
          max="8"
          min="0"
          name="page_gap"
          step="0.5"
          type="range"
          :value="settings.config.pagegap"
          @input="settings.patch({ pagegap: Number(($event.target as HTMLInputElement).value) })" />
      </label>

      <hr class="panel-separator" />

      <!-- CSS personnalisé : `#css-editor-textarea`, maxlength 8080 et
           aria-labelledby « lbl-css » (css.ts l.37-40), libellés FR de
           translations.json l.360 et l.365. -->
      <label class="setting css-editor" for="css-editor-textarea">
        <span id="lbl-css">Style personnalisé</span>
        <textarea
          id="css-editor-textarea"
          aria-labelledby="lbl-css"
          maxlength="8080"
          :placeholder="t('Saisissez votre CSS personnalisé')"
          spellcheck="false"
          :value="settings.config.css"
          @input="settings.patch({ css: ($event.target as HTMLTextAreaElement).value })"></textarea>
      </label>
    </section>

    <section class="panel-section">
      <h4 class="panel-section-title">{{ t("Fonds") }}</h4>

      <!-- settings.html l.138-145 (types), l.152-153 (fournisseur),
           l.231-252 (fréquence + « Arrière-plan suivant »), l.431-439 (liste
           d’URL), l.446-451 (couleur), l.460-461 (son), l.470-504 (curseurs). -->
      <label class="setting">
        <span>{{ t("Type d'arrière-plan") }}</span>
        <select
          id="i_type"
          :value="backgrounds.type"
          @change="patchBackgrounds({ type: ($event.target as HTMLSelectElement).value as never })">
          <option v-for="type in BACKGROUND_TYPES" :key="type.value" :value="type.value">
            {{ t(type.label) }}
          </option>
        </select>
      </label>

      <p v-if="backgrounds.type === 'files'" class="panel-empty">
        {{ t("Les fichiers locaux ne sont pas disponibles dans le fork.") }}
      </p>

      <label v-show="isCollectionType" class="setting">
        <span>{{ t("Fournisseur") }}</span>
        <select
          id="i_background-provider"
          :value="collectionName"
          @change="patchProvider(($event.target as HTMLSelectElement).value)">
          <option v-for="provider in providerOptions" :key="provider.value" :value="provider.value">
            {{ t(provider.label) }}
          </option>
        </select>
      </label>

      <label v-if="queryField" class="setting" :for="queryField.id">
        <span>{{ t(queryField.label) }}</span>
        <input
          :id="queryField.id"
          :value="queryValue"
          type="text"
          @input="patchQuery(($event.target as HTMLInputElement).value)" />
      </label>

      <label class="setting">
        <span>{{ t("Fréquence") }}</span>
        <select
          id="i_freq"
          :value="backgrounds.frequency"
          @change="patchBackgrounds({ frequency: ($event.target as HTMLSelectElement).value as never })">
          <option v-for="frequency in BACKGROUND_FREQUENCIES" :key="frequency.value" :value="frequency.value">
            {{ t(frequency.label) }}
          </option>
        </select>
      </label>

      <button
        id="i_refresh"
        class="param-btn"
        :title="t('Arrière-plan suivant')"
        type="button"
        @click="requestBackgroundRefresh()">
        Arrière-plan suivant
      </button>

      <label class="setting">
        <span>{{ t("URL d'arrière-plan") }}</span>
        <textarea
          id="i_background-urls"
          rows="3"
          :value="backgrounds.urls"
          @input="patchBackgrounds({ urls: ($event.target as HTMLTextAreaElement).value })"></textarea>
      </label>

      <label class="setting">
        <span>{{ t("Couleur de fond") }}</span>
        <input
          id="i_solid-background"
          :value="backgrounds.color"
          type="color"
          @input="patchBackgrounds({ color: ($event.target as HTMLInputElement).value })" />
      </label>

      <label class="setting" for="i_background-mute-videos">
        <span>{{ t("Couper le son des vidéos") }}</span>
        <input
          id="i_background-mute-videos"
          class="switch"
          :checked="backgrounds.mute"
          type="checkbox"
          @change="patchBackgrounds({ mute: ($event.target as HTMLInputElement).checked })" />
      </label>

      <label class="setting" for="i_blur">
        <span>{{ t("Intensité du flou") }}</span>
        <input
          id="i_blur"
          :value="backgrounds.blur"
          max="50"
          min="0"
          step="1"
          type="range"
          @input="onBackgroundRange('blur', ($event.target as HTMLInputElement).value)" />
      </label>

      <label class="setting" for="i_bright">
        <span>{{ t("Luminosité") }}</span>
        <input
          id="i_bright"
          :value="backgrounds.bright"
          max="1"
          min="0.2"
          step="0.01"
          type="range"
          @input="onBackgroundRange('bright', ($event.target as HTMLInputElement).value)" />
      </label>

      <label class="setting" for="i_fadein">
        <span>{{ t("Temps de fondu") }}</span>
        <input
          id="i_fadein"
          :value="backgrounds.fadein"
          max="1200"
          min="0"
          step="100"
          type="range"
          @input="onBackgroundRange('fadein', ($event.target as HTMLInputElement).value)" />
      </label>
    </section>

    <section class="panel-section">
      <h4 class="panel-section-title">{{ t("Horloge") }}</h4>
      <label class="setting">
        <span>{{ t("Heure sur 12 h") }}</span>
        <input
          :checked="settings.config.clock.ampm"
          type="checkbox"
          @change="settings.patch({ clock: { ampm: ($event.target as HTMLInputElement).checked } })" />
      </label>
      <label class="setting">
        <span>{{ t("Afficher les secondes") }}</span>
        <input
          :checked="settings.config.clock.seconds"
          type="checkbox"
          @change="settings.patch({ clock: { seconds: ($event.target as HTMLInputElement).checked } })" />
      </label>
      <label class="setting">
        <span>{{ t("Cadran analogique") }}</span>
        <input
          :checked="settings.config.clock.analog"
          type="checkbox"
          @change="settings.patch({ clock: { analog: ($event.target as HTMLInputElement).checked } })" />
      </label>
      <template v-if="settings.config.clock.analog">
        <label class="setting">
          <span>{{ t("Forme du cadran") }}</span>
          <select
            :value="settings.config.analogstyle.shape"
            @change="settings.patch({ analogstyle: { shape: ($event.target as HTMLSelectElement).value as never } })">
            <option v-for="shape in ANALOG_SHAPES" :key="shape.value" :value="shape.value">
              {{ t(shape.label) }}
            </option>
          </select>
        </label>
        <label class="setting">
          <span>{{ t("Chiffres du cadran") }}</span>
          <select
            :value="settings.config.analogstyle.face"
            @change="settings.patch({ analogstyle: { face: ($event.target as HTMLSelectElement).value as never } })">
            <option v-for="face in ANALOG_FACES" :key="face.value" :value="face.value">
              {{ t(face.label) }}
            </option>
          </select>
        </label>
        <label class="setting">
          <span>{{ t("Aiguilles") }}</span>
          <select
            :value="settings.config.analogstyle.hands"
            @change="settings.patch({ analogstyle: { hands: ($event.target as HTMLSelectElement).value as never } })">
            <option v-for="hands in ANALOG_HANDS" :key="hands.value" :value="hands.value">
              {{ t(hands.label) }}
            </option>
          </select>
        </label>
      </template>
      <label class="setting">
        <span>{{ t("Fuseau horaire") }}</span>
        <select
          :value="settings.config.clock.timezone"
          @change="settings.patch({ clock: { timezone: ($event.target as HTMLSelectElement).value } })">
          <optgroup v-for="group in TIMEZONE_GROUPS" :key="group.label" :label="group.label">
            <option v-for="option in group.options" :key="option.value" :value="option.value">
              {{ t(option.label) }}
            </option>
          </optgroup>
        </select>
      </label>
      <label class="setting">
        <span>{{ t("Format de date") }}</span>
        <select
          :value="settings.config.dateformat"
          @change="settings.patch({ dateformat: ($event.target as HTMLSelectElement).value as never })">
          <option v-for="format in DATE_FORMATS" :key="format.value" :value="format.value">
            {{ t(format.label) }}
          </option>
        </select>
      </label>
      <!-- `i_timehide` (settings.html l.940-947), libellé « Affichage » de
           translations.json l.241. -->
      <label class="setting" for="i_timehide">
        <span>{{ t("Affichage") }}</span>
        <select
          id="i_timehide"
          :value="timehideValue"
          @change="patchTimehide(($event.target as HTMLSelectElement).value)">
          <option v-for="option in TIMEHIDE_OPTIONS" :key="option.value" :value="option.value">
            {{ t(option.label) }}
          </option>
        </select>
      </label>
      <label class="setting">
        <span>{{ t("Heures du monde") }}</span>
        <input
          :checked="settings.config.clock.worldclocks"
          type="checkbox"
          @change="settings.patch({ clock: { worldclocks: ($event.target as HTMLInputElement).checked } })" />
      </label>
      <div v-if="settings.config.clock.worldclocks" class="worldclocks">
        <label v-for="index in WORLD_CLOCK_SLOTS" :key="index" class="setting worldclock">
          <input
            :placeholder="WORLD_CLOCK_REGIONS[index] ?? 'Région'"
            :value="worldClock(index).region"
            :aria-label="t('Ajouter une ville')"
            maxlength="24"
            type="text"
            @input="patchWorldClock(index, { region: ($event.target as HTMLInputElement).value })" />
          <select
            :value="worldClock(index).timezone"
            @change="patchWorldClock(index, { timezone: ($event.target as HTMLSelectElement).value })">
            <option v-for="zone in IANA_TIMEZONES" :key="zone" :value="zone">{{ zone }}</option>
          </select>
        </label>
      </div>
      <hr class="panel-separator" />
      <label class="setting">
        <span>{{ t("Prénom de salutation") }}</span>
        <input
          :value="settings.config.greeting"
          autocomplete="off"
          maxlength="64"
          :placeholder="t('Prénom')"
          type="text"
          @input="settings.patch({ greeting: ($event.target as HTMLInputElement).value })" />
      </label>
      <label class="setting">
        <span>{{ t("Mode de salutation") }}</span>
        <select
          :value="settings.config.greetingsmode"
          @change="settings.patch({ greetingsmode: ($event.target as HTMLSelectElement).value as never })">
          <option value="auto">{{ t("Automatique") }}</option>
          <option value="custom">{{ t("Personnalisé") }}</option>
        </select>
      </label>
      <template v-if="settings.config.greetingsmode === 'custom'">
        <label v-for="field in GREETING_FIELDS" :key="field.key" class="setting">
          <span>{{ t(field.label) }}</span>
          <input
            :value="settings.config.greetingscustom[field.key]"
            autocomplete="off"
            maxlength="64"
            type="text"
            @input="
              settings.patch({
                greetingscustom: { [field.key]: ($event.target as HTMLInputElement).value },
              })
            " />
        </label>
      </template>
    </section>

    <section class="panel-section">
      <h4 class="panel-section-title">{{ t("Météo") }}</h4>
      <label class="setting">
        <span>{{ t("Météo") }}</span>
        <input
          :checked="settings.showWeather"
          type="checkbox"
          @change="settings.setShowWeather(($event.target as HTMLInputElement).checked)" />
      </label>
      <label class="setting">
        <span>{{ t("Source des données") }}</span>
        <select
          :value="settings.config.weather.source"
          @change="patchWeather({ source: ($event.target as HTMLSelectElement).value as never })">
          <option v-for="source in WEATHER_SOURCES" :key="source.value" :value="source.value">
            {{ t(source.label) }}
          </option>
        </select>
      </label>
      <label
        v-if="WEATHER_KEY_LABELS[settings.config.weather.source]"
        class="setting">
        <span>{{ WEATHER_KEY_LABELS[settings.config.weather.source] }}</span>
        <input
          :value="settings.config.weather.apikey"
          autocomplete="off"
          maxlength="256"
          type="password"
          @input="patchWeather({ apikey: ($event.target as HTMLInputElement).value })" />
      </label>
      <label class="setting">
        <span>{{ t("Géolocalisation") }}</span>
        <select
          :value="settings.config.weather.geolocation"
          @change="
            patchWeather({ geolocation: ($event.target as HTMLSelectElement).value as never })
          ">
          <option
            v-for="geolocation in WEATHER_GEOLOCATIONS"
            :key="geolocation.value"
            :value="geolocation.value">
            {{ t(geolocation.label) }}
          </option>
        </select>
      </label>
      <label v-if="settings.config.weather.geolocation === 'off'" class="setting">
        <span>{{ t("Ville") }}</span>
        <input
          :value="settings.config.weather.city"
          autocomplete="off"
          maxlength="128"
          placeholder="Paris"
          type="text"
          @input="patchWeather({ city: ($event.target as HTMLInputElement).value })" />
      </label>
      <label class="setting">
        <span>{{ t("Unité de température") }}</span>
        <select
          :value="settings.config.weather.unit"
          @change="patchWeather({ unit: ($event.target as HTMLSelectElement).value as never })">
          <option v-for="unit in WEATHER_UNITS" :key="unit.value" :value="unit.value">
            {{ t(unit.label) }}
          </option>
        </select>
      </label>
      <label class="setting">
        <span>{{ t("Afficher l’unité") }}</span>
        <input
          :checked="settings.config.weather.show_unit"
          type="checkbox"
          @change="
            patchWeather({ show_unit: ($event.target as HTMLInputElement).checked })
          " />
      </label>
      <label class="setting">
        <span>{{ t("Prévisions") }}</span>
        <select
          :value="settings.config.weather.forecast"
          @change="patchWeather({ forecast: ($event.target as HTMLSelectElement).value as never })">
          <option
            v-for="forecast in WEATHER_FORECASTS"
            :key="forecast.value"
            :value="forecast.value">
            {{ t(forecast.label) }}
          </option>
        </select>
      </label>
      <label class="setting">
        <span>{{ t("Température") }}</span>
        <select
          :value="settings.config.weather.temperature"
          @change="
            patchWeather({ temperature: ($event.target as HTMLSelectElement).value as never })
          ">
          <option
            v-for="temperature in WEATHER_TEMPERATURES"
            :key="temperature.value"
            :value="temperature.value">
            {{ t(temperature.label) }}
          </option>
        </select>
      </label>
      <label class="setting">
        <span>{{ t("Météo détaillée") }}</span>
        <select
          :value="settings.config.weather.moreinfo"
          @change="patchWeather({ moreinfo: ($event.target as HTMLSelectElement).value as never })">
          <option
            v-for="moreinfo in WEATHER_MOREINFO"
            :key="moreinfo.value"
            :value="moreinfo.value">
            {{ t(moreinfo.label) }}
          </option>
        </select>
      </label>
      <label v-if="settings.config.weather.moreinfo === 'custom'" class="setting">
        <span>{{ t("URL du fournisseur") }}</span>
        <input
          :value="settings.config.weather.provider"
          autocomplete="off"
          maxlength="512"
          placeholder="https://weatherbug.com/"
          type="url"
          @input="patchWeather({ provider: ($event.target as HTMLInputElement).value })" />
      </label>
      <!-- `i_weatherhide` (settings.html l.1189-1197) et `i_greethide`
           (l.1202-1205), libellés FR « Affichage » (translations.json l.241)
           et « Bienvenue » (l.249). -->
      <label class="setting" for="i_weatherhide">
        <span>{{ t("Affichage") }}</span>
        <select
          id="i_weatherhide"
          :value="weatherhideValue"
          @change="patchWeatherhide(($event.target as HTMLSelectElement).value)">
          <option v-for="option in WEATHERHIDE_OPTIONS" :key="option.value" :value="option.value">
            {{ t(option.label) }}
          </option>
        </select>
      </label>
      <label class="setting" for="i_greethide">
        <span>{{ t("Bienvenue") }}</span>
        <input
          id="i_greethide"
          class="switch"
          :checked="!settings.config.hide.greetings"
          type="checkbox"
          @change="settings.patch({ hide: { greetings: !($event.target as HTMLInputElement).checked } })" />
      </label>
    </section>

    <section class="panel-section">
      <h4 class="panel-section-title">{{ t("Barre de recherche") }}</h4>
      <label class="setting">
        <span>{{ t("Barre de recherche") }}</span>
        <input
          :checked="settings.config.searchbar.on"
          type="checkbox"
          @change="settings.patch({ searchbar: { on: ($event.target as HTMLInputElement).checked } })" />
      </label>
      <label class="setting">
        <span>{{ t("Moteur") }}</span>
        <select
          :value="settings.config.searchbar.engine"
          @change="settings.patch({ searchbar: { engine: ($event.target as HTMLSelectElement).value } })">
          <option v-for="engine in SEARCHBAR_ENGINES" :key="engine" :value="engine">
            {{ engine }}
          </option>
        </select>
      </label>
      <label class="setting">
        <span>{{ t("Placeholder") }}</span>
        <input
          :value="settings.config.searchbar.placeholder"
          type="text"
          @input="settings.patch({ searchbar: { placeholder: ($event.target as HTMLInputElement).value } })" />
      </label>
      <label v-if="settings.config.searchbar.engine === 'custom'" class="setting">
        <span>{{ t("Requête (%s)") }}</span>
        <input
          :value="settings.config.searchbar.request"
          :class="{ invalid: !isValidCustomRequest(settings.config.searchbar.request) }"
          placeholder="https://exemple.fr/?q=%s"
          type="text"
          @input="settings.patch({ searchbar: { request: ($event.target as HTMLInputElement).value } })" />
      </label>
      <label class="setting">
        <span>{{ t("Ouvrir dans un nouvel onglet") }}</span>
        <input
          :checked="settings.config.searchbar.newtab"
          type="checkbox"
          @change="settings.patch({ searchbar: { newtab: ($event.target as HTMLInputElement).checked } })" />
      </label>
    </section>

    <section class="panel-section">
      <h4 class="panel-section-title">{{ t("Liens rapides") }}</h4>
      <label class="setting">
        <span>{{ t("Activer") }}</span>
        <input
          :checked="settings.config.quicklinks"
          type="checkbox"
          @change="settings.patch({ quicklinks: ($event.target as HTMLInputElement).checked })" />
      </label>
      <form class="setting addlink" @submit.prevent="addLinkFromPanel">
        <span>{{ t("Nouveau lien") }}</span>
        <div class="addlink-fields">
          <input
            v-model="newLink.title"
            :aria-label="t('Titre du nouveau lien')"
            id="i_addlink-title"
            maxlength="64"
            :placeholder="t('Titre')"
            type="text" />
          <input
            v-model="newLink.url"
            :aria-label="t('URL du nouveau lien')"
            id="i_addlink-url"
            maxlength="512"
            placeholder="example.com"
            type="text" />
          <button id="i_addlink" type="submit">{{ t("Ajouter") }}</button>
        </div>
      </form>
      <label class="setting">
        <span>{{ t("Afficher les groupes") }}</span>
        <input
          :checked="settings.config.linkgroups.on"
          type="checkbox"
          @change="settings.patch({ linkgroups: { on: ($event.target as HTMLInputElement).checked } })" />
      </label>
      <label class="setting">
        <span>{{ t("Ouvrir dans un nouvel onglet") }}</span>
        <input
          :checked="settings.config.linknewtab"
          type="checkbox"
          @change="settings.patch({ linknewtab: ($event.target as HTMLInputElement).checked })" />
      </label>
      <label class="setting">
        <span>{{ t("Arrondi de l’icône") }}</span>
        <input
          :value="settings.config.linkiconradius"
          max="2.4"
          min="0"
          step="0.1"
          type="range"
          @input="settings.patch({ linkiconradius: Number(($event.target as HTMLInputElement).value) })" />
      </label>
      <label class="setting">
        <span>{{ t("Nombre de liens par ligne") }}</span>
        <input
          :value="settings.config.linksrow"
          max="16"
          min="1"
          step="1"
          type="range"
          @input="settings.patch({ linksrow: Number(($event.target as HTMLInputElement).value) })" />
      </label>
      <label class="setting">
        <span>{{ t("Apparence") }}</span>
        <select
          :value="settings.config.linkstyle"
          @change="patchLinkStyle(($event.target as HTMLSelectElement).value)">
          <option v-for="style in LINK_STYLES" :key="style.value" :value="style.value">
            {{ t(style.label) }}
          </option>
        </select>
      </label>
      <label class="setting">
        <span>{{ t("Afficher les titres des liens") }}</span>
        <input
          :checked="settings.config.linktitles"
          type="checkbox"
          @change="settings.patch({ linktitles: ($event.target as HTMLInputElement).checked })" />
      </label>
      <label class="setting">
        <span>{{ t("Afficher l’arrière-plan des liens") }}</span>
        <input
          :checked="settings.config.linkbackgrounds"
          type="checkbox"
          @change="settings.patch({ linkbackgrounds: ($event.target as HTMLInputElement).checked })" />
      </label>
      <p class="panel-hint">
        {{ t("Clic droit sur la grille pour ajouter un lien, clic droit sur un lien ou un groupe pour le modifier.") }}
      </p>
    </section>

    <section class="panel-section">
      <h4 class="panel-section-title">{{ t("Notes") }}</h4>
      <label class="setting">
        <span>{{ t("Activer") }}</span>
        <input
          :checked="settings.config.notes.on"
          type="checkbox"
          @change="settings.patch({ notes: { on: ($event.target as HTMLInputElement).checked } })" />
      </label>
      <label class="setting">
        <span>{{ t("Alignement du texte") }}</span>
        <select
          :value="settings.config.notes.align"
          @change="patchNotesAlign(($event.target as HTMLSelectElement).value)">
          <option v-for="align in NOTES_ALIGNMENTS" :key="align.value" :value="align.value">
            {{ t(align.label) }}
          </option>
        </select>
      </label>
      <label class="setting">
        <span>{{ t("Largeur") }}</span>
        <input
          :value="settings.config.notes.width"
          max="70"
          min="20"
          step="1"
          type="range"
          @input="settings.patch({ notes: { width: Number(($event.target as HTMLInputElement).value) } })" />
      </label>
      <label class="setting">
        <span>{{ t("Arrière-plan") }}</span>
        <input
          :value="notesOpacity"
          max="15"
          min="0"
          step="1"
          type="range"
          @input="patchNotesOpacity(Number(($event.target as HTMLInputElement).value))" />
      </label>
      <label class="setting">
        <span>{{ t("Nuance") }}</span>
        <select :value="notesShade" @change="patchNotesShade(($event.target as HTMLSelectElement).value)">
          <option value="light">{{ t("Claire") }}</option>
          <option value="dark">{{ t("Sombre") }}</option>
        </select>
      </label>
      <p class="panel-hint">
        {{ t("Écris directement sur la page : titres « # », listes « - », cases « [ ] », gras « ** », lien « [texte](url) ».") }}
      </p>
    </section>

    <section class="panel-section">
      <h4 class="panel-section-title">{{ t("Citations") }}</h4>
      <label class="setting">
        <span>{{ t("Activer") }}</span>
        <input
          :checked="settings.config.quotes.on"
          type="checkbox"
          @change="settings.patch({ quotes: { on: ($event.target as HTMLInputElement).checked } })" />
      </label>
      <label class="setting">
        <span>{{ t("Toujours afficher l’auteur") }}</span>
        <input
          :checked="settings.config.quotes.author"
          type="checkbox"
          @change="settings.patch({ quotes: { author: ($event.target as HTMLInputElement).checked } })" />
      </label>
      <label class="setting">
        <span>{{ t("Type de citations") }}</span>
        <select
          :value="settings.config.quotes.type"
          @change="patchQuoteType(($event.target as HTMLSelectElement).value)">
          <option v-for="type in QUOTE_TYPES" :key="type.value" :value="type.value">
            {{ t(type.label) }}
          </option>
        </select>
      </label>
      <label v-if="settings.config.quotes.type === 'user'" class="setting quote-list">
        <span>{{ t("Citations personnalisées") }}</span>
        <textarea
          :value="settings.config.quotes.userlist"
          maxlength="8000"
          placeholder="Auteur, Votre citation.&#10;Auteur, Votre deuxième citation."
          rows="4"
          @input="settings.patch({ quotes: { userlist: ($event.target as HTMLTextAreaElement).value } })"></textarea>
      </label>
      <form v-if="settings.config.quotes.type === 'url'" class="setting quote-url" @submit.prevent="submitQuoteUrl">
        <span>{{ t("URL") }}</span>
        <div class="quote-url-fields">
          <input
            id="i_qturl"
            v-model="quoteUrlInput.value"
            maxlength="512"
            placeholder="https://exemple.fr/citations.csv"
            type="url" />
          <button id="i_qturl-submit" type="button" @click="submitQuoteUrl">{{ t("Valider") }}</button>
        </div>
        <small v-if="quoteUrlWarning" class="panel-warning">{{ quoteUrlWarning }}</small>
      </form>
      <label class="setting">
        <span>{{ t("Fréquence") }}</span>
        <select
          :value="settings.config.quotes.frequency"
          @change="patchQuoteFrequency(($event.target as HTMLSelectElement).value)">
          <option v-for="frequency in QUOTE_FREQUENCIES" :key="frequency.value" :value="frequency.value">
            {{ t(frequency.label) }}
          </option>
        </select>
      </label>
      <!-- `i_qtrefresh` (settings.html l.1635-1646) : bouton « Prochaine citation ». -->
      <button class="panel-btn" :title="t('Prochaine citation')" type="button" @click="nextQuote">
        Prochaine citation
      </button>
      <p class="panel-hint">{{ t("Utilisez les collections de citations par défaut ou importez les vôtres.") }}</p>
    </section>

    <section class="panel-section">
      <!-- Case 18 : `i_pomodoro` et sa descente (settings.html l.1669-1779). -->
      <h4 class="panel-section-title">{{ t("Pomodoro") }}</h4>
      <label class="setting">
        <span>{{ t("Activer") }}</span>
        <input
          id="i_pomodoro"
          type="checkbox"
          :checked="settings.config.pomodoro.on"
          @change="patchPomodoro({ on: ($event.target as HTMLInputElement).checked })" />
      </label>
      <hr class="panel-separator" />
      <label class="setting">
        <span>{{ t("Alerte sonore") }}</span>
        <input
          id="i_pmdr_sound"
          type="checkbox"
          :checked="settings.config.pomodoro.sound"
          @change="patchPomodoro({ sound: ($event.target as HTMLInputElement).checked })" />
      </label>
      <label class="setting">
        <span>{{ t("Mélodie de l'alarme") }}</span>
        <span class="pmdr-alarm">
          <select
            id="i_pmdr_alarms"
            :value="settings.config.pomodoro.alarm"
            @change="patchPomodoroAlarm(($event.target as HTMLSelectElement).value)">
            <option v-for="alarm in POMODORO_ALARMS" :key="alarm.value" :value="alarm.value">
              {{ t(alarm.label) }}
            </option>
          </select>
          <button id="i_pmdr_listen" :title="t(&quot;Écouter l'alarme&quot;)" type="button" @click="listenAlarm">
            <span aria-hidden="true">♪</span>
          </button>
        </span>
      </label>
      <label class="setting">
        <span>{{ t("Volume de l'alarme") }}</span>
        <input
          id="i_pmdr_volume"
          max="1"
          min="0.1"
          step="0.1"
          type="range"
          :value="settings.config.pomodoro.volume"
          @input="patchVolume(($event.target as HTMLInputElement).value)" />
      </label>
      <hr class="panel-separator" />
      <!-- Les trois `input[type=number]` min 1 max 59, suffixe « min » (l.1728-1779). -->
      <label
        v-for="duration in POMODORO_DURATIONS"
        :key="duration.key"
        class="setting">
        <span>{{ t(duration.label) }}</span>
        <span class="pmdr-duration">
          <input
            :id="duration.id"
            autocomplete="off"
            max="59"
            min="1"
            type="number"
            :value="durationMinutes(duration.key)"
            @input="onDurationInput(duration.key, ($event.target as HTMLInputElement).value)" />
          <span class="pmdr-suffix">min</span>
        </span>
      </label>
    </section>

    <section class="panel-section">
      <h4 class="panel-section-title">{{ t("Données") }}</h4>
      <!-- ids de la source (settings.html l.2139-2196) ; `b_settings-cancel`
           et `b_settings-data` sont propres à l'éditeur d'export de la source,
           le fork applique directement la zone de texte. -->
      <textarea
        id="settings-data"
        ref="dataEl"
        rows="6"
        spellcheck="false"
        :aria-label="t('Copier la configuration')"
        :value="settings.exportJson()"></textarea>
      <div class="panel-buttons">
        <button
          id="b_settings-copy"
          :title="t('Copier la configuration')"
          type="button"
          @click="copyData">
          {{ t("Copier") }}
        </button>
        <button
          id="b_settings-apply"
          :title="t('Appliquer la configuration saisie')"
          type="button"
          @click="applyData">
          {{ t("Enregistrer") }}
        </button>
      </div>
      <div class="panel-buttons">
        <button
          id="b_file-load"
          :title="t('Importer un fichier de configuration')"
          type="button"
          @click="pickImportFile">
          {{ t("Importer") }}
        </button>
        <button
          id="b_file-save"
          :title="t('Exporter la configuration')"
          type="button"
          @click="saveExportFile">
          {{ t("Exporter") }}
        </button>
      </div>
      <input
        id="file-import"
        ref="fileEl"
        class="panel-hidden-input"
        type="file"
        accept="application/json, text/plain"
        @change="loadImportFile" />
      <a id="file-download" ref="downloadEl" class="panel-hidden-input" aria-hidden="true" tabindex="-1"></a>
    </section>

    <section class="panel-section">
      <h4 class="panel-section-title">{{ t("À propos") }}</h4>
      <p class="panel-about">
        {{ t("Fonctionne hors ligne, aucune requête réseau.") }}
        Fork natif Vue/TypeScript de
        <a href="https://bonjourr.fr" rel="noopener" target="_blank">Bonjourr</a>
        intégré à StarbreakersNet.
      </p>
    </section>
  </aside>
</template>

<style lang="sass" scoped>
.bonjourr-settings-panel
  position: fixed
  top: 0
  left: 0
  bottom: 0
  width: min(360px, 90vw)
  padding: 1.5rem 1.25rem 3rem
  overflow-y: auto
  background: rgba(30, 30, 36, 0.72)
  color: #fff
  z-index: 30
  font-size: 0.9rem

  .panel-title
    margin: 0 0 1rem
    font-size: 1.1rem
    font-weight: 600

  .panel-section
    border-top: 1px solid rgba(255, 255, 255, 0.12)
    padding: 0.75rem 0

  .panel-section-title
    margin: 0 0 0.5rem
    font-size: 0.8rem
    letter-spacing: 0.04em
    text-transform: uppercase
    opacity: 0.75

  .setting
    align-items: center
    display: flex
    gap: 0.75rem
    justify-content: space-between
    margin: 0.4rem 0

  .panel-empty
    margin: 0.25rem 0
    opacity: 0.6

  .panel-hint
    font-size: 0.8rem
    margin: 0.25rem 0
    opacity: 0.6

  // Section « Données » (case 21) : rangées de boutons et champs techniques
  // masqués (sélecteur de fichier, lien de téléchargement).
  .panel-buttons
    display: flex
    gap: 0.4rem
    margin: 0.3rem 0

    button
      flex: 1

  .panel-hidden-input
    display: none

  #settings-data
    font-family: monospace
    font-size: 0.75rem
    margin: 0.3rem 0
    min-height: 8rem
    width: 100%

  .addlink
    display: block

    .addlink-fields
      display: flex
      gap: 0.4rem
      margin-top: 0.3rem

      input
        flex: 1
        min-width: 0

      button
        background: rgba(255, 255, 255, 0.18)
        border: none
        border-radius: 0.4rem
        color: inherit
        cursor: pointer
        font: inherit
        padding: 0.3rem 0.6rem

  .panel-btn
    background: rgba(255, 255, 255, 0.18)
    border: none
    border-radius: 0.4rem
    color: inherit
    cursor: pointer
    font: inherit
    margin: 0.4rem 0
    padding: 0.3rem 0.6rem

  .panel-warning
    color: #ff9a9a

  .quote-list
    align-items: flex-start
    display: block

    textarea
      font: inherit
      margin-top: 0.3rem
      resize: vertical
      width: 100%

  .quote-url
    display: block

    .quote-url-fields
      display: flex
      gap: 0.4rem
      margin-top: 0.3rem

      input
        flex: 1
        min-width: 0

      button
        background: rgba(255, 255, 255, 0.18)
        border: none
        border-radius: 0.4rem
        color: inherit
        cursor: pointer
        font: inherit
        padding: 0.3rem 0.6rem

  // Case 20 : champ « Police » (settings.html l.1802-1812) et éditeur CSS
  // (css.ts l.37-40), alignés comme les autres blocs à deux étages du panneau.
  .fontfamily
    align-items: flex-start
    display: block

    .fontfamily-fields
      display: flex
      gap: 0.4rem
      margin-top: 0.3rem

      input
        flex: 1
        min-width: 0

      button
        background: rgba(255, 255, 255, 0.18)
        border: none
        border-radius: 0.4rem
        color: inherit
        cursor: pointer
        font: inherit
        padding: 0.3rem 0.6rem

  .css-editor
    align-items: flex-start
    display: block

    textarea
      font: inherit
      margin-top: 0.3rem
      resize: vertical
      width: 100%

  .panel-separator
    border: none
    border-top: 1px solid rgba(255, 255, 255, 0.12)
    margin: 0.75rem 0

  // Case 18 : `i_pmdr_alarms` + `i_pmdr_listen` (settings.html l.1689-1707) et
  // les trois durées avec leur suffixe « min » (l.1730-1778).
  .pmdr-alarm
    display: flex
    gap: 0.4rem
    margin-left: auto

    select
      flex: 1
      min-width: 0

    button
      background: rgba(255, 255, 255, 0.18)
      border: none
      border-radius: 0.4rem
      color: inherit
      cursor: pointer
      font: inherit
      padding: 0.3rem 0.6rem

  .pmdr-duration
    display: flex
    align-items: center
    gap: 0.3rem
    margin-left: auto

    input
      font: inherit
      padding: 0.3rem 0.4rem
      width: 4.5rem

    .pmdr-suffix
      opacity: 0.7

  .worldclocks
    display: flex
    flex-direction: column
    gap: 0.4rem

  .worldclock
    justify-content: flex-end

  .worldclock input
    flex: 1

  .panel-about a
    color: #7ed8b2
</style>
