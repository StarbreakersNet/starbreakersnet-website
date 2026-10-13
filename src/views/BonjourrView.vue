<script lang="ts" setup>
// Fork natif TypeScript du projet Bonjourr (https://github.com/victrme/Bonjourr)
// intégré au châssis starbreakers : route /bonjourr, vue plein écran.
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import BonjourrAnalogClock from "@/components/BonjourrAnalogClock.vue";
import BonjourrBackground from "@/components/BonjourrBackground.vue";
import BonjourrLinks from "@/components/BonjourrLinks.vue";
import BonjourrNotes from "@/components/BonjourrNotes.vue";
import BonjourrPomodoro from "@/components/BonjourrPomodoro.vue";
import BonjourrQuotes from "@/components/BonjourrQuotes.vue";
import BonjourrSearchBar from "@/components/BonjourrSearchBar.vue";
import BonjourrSettingsPanel from "@/components/BonjourrSettingsPanel.vue";
import BonjourrVisuals from "@/components/BonjourrVisuals.vue";
import { formatFrenchDate, worldClockTimes, zoneParts } from "@/bonjourr/clock";
import { selectGreeting } from "@/bonjourr/greeting";
import { translate } from "@/bonjourr/i18n";
import {
  fetchWeatherReport,
  formatWeatherSentence,
  locate,
  moreInfoLink,
  searchCities,
  weatherIcon,
  type Coords,
  type WeatherReport,
} from "@/bonjourr/weather";
import { useBonjourrStore } from "@/stores/bonjourr";

const settings = useBonjourrStore();

// i18n FR/EN (case 21) : fr = la clé française telle quelle.
const t = (key: string) => translate(settings.config.lang, key);
const now = ref(new Date());
const weather = ref<WeatherReport | null>(null);
const showPanel = ref(false);
let timer: ReturnType<typeof setInterval> | undefined;

// Heures du monde : clock.ts l.32-40 (filtrées sur region, sinon fuseau principal).
const clocks = computed(() =>
  worldClockTimes(now.value, {
    ampm: settings.config.clock.ampm,
    seconds: settings.config.clock.seconds,
    worldclocks: settings.config.clock.worldclocks,
    entries: settings.config.worldclocks,
    timezone: settings.config.clock.timezone,
  }),
);

const greetingText = computed(() =>
  selectGreeting(now.value, {
    name: settings.config.greeting,
    mode: settings.config.greetingsmode,
    custom: settings.config.greetingscustom,
  }),
);

const dateText = computed(() =>
  formatFrenchDate(now.value, settings.config.dateformat, settings.config.clock.timezone),
);

const clockStyleVars = computed(() => ({
  "--clock-size": `${settings.config.clock.size}`,
}));

// Case 14 : la météo suit les réglages (provider, unités, géoloc/ville, plus d'infos).
// Cible de la requête d'après request.ts l.43-60 et getGeolocation l.138-157 :
// precise/approximate → géoloc navigateur, off → ville saisie (« Paris » par défaut).
// Écart assumé : chez l'original « approximate » n'envoie aucune coordonnée et laisse
// le proxy résoudre l'IP ; le fork n'a pas de service de géoloc IP sans clé, il demande
// donc la géoloc navigateur, sauf sur le proxy d'origine où la parité est respectée.
async function weatherTarget(): Promise<{ coords?: Coords; city?: string }> {
  const { geolocation, city, source } = settings.config.weather;
  if (geolocation === "off") {
    const name = city?.trim() || "Paris";
    if (source === "bonjourr" || source === "openweathermap") {
      return { city: name };
    }
    const [found] = await searchCities(name);
    return found ? { coords: { lat: found.lat, lon: found.lon } } : {};
  }
  if (source === "bonjourr" && geolocation === "approximate") {
    return {};
  }
  return { coords: await locate() };
}

async function refreshWeather() {
  const { source, unit, apikey } = settings.config.weather;
  const target = await weatherTarget();
  weather.value = await fetchWeatherReport({
    provider: source,
    unit,
    lang: settings.config.lang || "fr",
    key: apikey,
    ...target,
  });
}

// display.ts l.21-59 : la phrase dépend de l'heure locale (aujourd'hui/demain, forecast auto).
const weatherSentence = computed(() => {
  if (!weather.value) return "";
  const config = settings.config.weather;
  return formatWeatherSentence(weather.value, {
    unit: config.unit,
    showUnit: config.show_unit,
    temperature: config.temperature,
    forecast: config.forecast,
    hour: zoneParts(now.value, settings.config.clock.timezone).hour,
  });
});

const weatherTemp = computed(() => {
  if (!weather.value) return "";
  const config = settings.config.weather;
  const symbol = config.show_unit ? (config.unit === "imperial" ? "F" : "C") : "";
  return `${weather.value.temp}°${symbol}`;
});

const weatherLink = computed(() =>
  weather.value
    ? moreInfoLink(settings.config.weather.moreinfo, {
        link: weather.value.link,
        custom: settings.config.weather.provider,
      })
    : null,
);

onMounted(() => {
  timer = setInterval(() => {
    now.value = new Date();
  }, 1000);
  void refreshWeather();
});

// Les réglages météo relancent la requête, comme handleInput de features/weather/settings.ts.
watch(
  () => JSON.stringify([settings.config.weather, settings.config.lang]),
  () => {
    void refreshWeather();
  },
);

onBeforeUnmount(() => {
  if (timer) clearInterval(timer);
});
</script>

<template>
  <main class="bonjourr-view fullscreen-container">
    <BonjourrVisuals />
    <BonjourrBackground />
    <div class="bonjourr-content">
      <div class="clock" data-hide="clock" :style="clockStyleVars">
        <div v-for="(clock, index) in clocks" :key="index" class="clock-wrapper">
          <BonjourrAnalogClock
            v-if="settings.config.clock.analog"
            :analogstyle="settings.config.analogstyle"
            :now="now"
            :seconds="settings.config.clock.seconds"
            :timezone="settings.config.clock.timezone" />
          <div v-else class="clock-time">{{ clock.time }}</div>
          <span v-if="clock.region" class="clock-region">{{ clock.region }}</span>
        </div>
      </div>
      <div class="clock-date" data-hide="date">{{ dateText }}</div>
      <div class="greeting" data-hide="greetings">{{ greetingText }}</div>
      <BonjourrSearchBar />
      <BonjourrLinks />
      <BonjourrNotes />
      <BonjourrPomodoro />
      <BonjourrQuotes />
      <div v-if="weather && settings.showWeather" class="weather">
        <p class="weather-line" data-hide="weatherdesc">{{ weatherSentence }}</p>
        <div class="weather-icon" data-hide="weathericon">
          <a
            v-if="weatherLink"
            class="weather-more"
            :href="weatherLink"
            rel="noopener noreferrer"
            target="_blank">
            <font-awesome-icon :icon="['fas', weatherIcon(weather)]" />
          </a>
          <font-awesome-icon v-else :icon="['fas', weatherIcon(weather)]" />
          <span class="weather-temp">{{ weatherTemp }}</span>
        </div>
      </div>
      <slot name="widgets" />
    </div>
    <button
      class="settings-toggle"
      data-hide="settingsicon"
      type="button"
      :aria-label="t('Réglages Bonjourr')"
      @click="showPanel = !showPanel">
      <font-awesome-icon :icon="['fas', 'gear']" />
    </button>
    <BonjourrSettingsPanel v-if="showPanel" @close="showPanel = false" />
  </main>
</template>

<style lang="sass" scoped>
@import @/assets/variables.sass

.bonjourr-view
  display: flex
  align-items: center
  justify-content: center
  // Couleur du texte : `rgb(var(--font-color))` (_global.css l.104, fonts.ts l.263-267).
  color: rgb(var(--font-color, 255, 255, 255))

  .bonjourr-content
    position: relative
    display: flex
    flex-direction: column
    align-items: center
    // Page, police et ombre consommées comme `#interface` (interface/global.css
    // l.5-14) ; l'ombre reprend `--text-shadow-alpha` (_global.css l.17-18). Les
    // tailles d'en-tête du fork restent en `vmin` (modèle fourni), l'em base fait
    // varier tout ce qui est dimensionné en `em` (liens, notes, citations, crédit).
    font-family: var(--font-family)
    font-size: var(--font-size)
    font-weight: var(--font-weight)
    gap: var(--page-gap)
    max-width: var(--page-width)
    text-shadow: 1px 2px 6px rgb(0 0 0 / var(--text-shadow-alpha))
    margin-bottom: 15vh

    .clock
      align-items: flex-end
      display: flex
      font-size: calc(1em * var(--clock-size, 1))
      gap: 3em
      justify-content: center

      .clock-wrapper
        align-items: center
        display: flex
        flex-direction: column

      .clock-time
        font-size: 7vmin
        font-weight: 200
        letter-spacing: .02em

      .clock-region
        font-size: 1.4vmin
        letter-spacing: .1em
        margin-top: .5em
        opacity: .8
        text-transform: uppercase

    .clock-date
      font-size: 2vmin
      font-weight: 300
      opacity: .95

    .greeting
      font-size: 3.5vmin
      font-weight: 300

    .weather
      display: flex
      flex-direction: column
      align-items: center
      gap: .5em

      .weather-line
        max-width: 44ch
        text-align: center
        font-size: 1.8vmin
        font-weight: 300
        margin: 0

      .weather-icon
        display: flex
        align-items: center
        gap: .5em
        font-size: 2.4vmin

        // Le lien « plus d'infos » (display.ts handleMoreInfo) reprend la couleur de l'icône.
        .weather-more
          color: inherit
          display: inline-flex

  .settings-toggle
    position: absolute
    right: 2em
    bottom: 1.5em
    background: none
    border: none
    color: white
    cursor: pointer
    font-size: 2.2vmin
    opacity: .9
    text-shadow: $sn-text-shadow

    &:hover
      opacity: 1
</style>
