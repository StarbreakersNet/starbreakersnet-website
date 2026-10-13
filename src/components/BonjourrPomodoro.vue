<script lang="ts" setup>
// Fork natif TypeScript de Bonjourr : minuteur Pomodoro de la page.
// Marqueurs repris de Bonjourr/src/index.html l.587-660 (`#pomodoro_container`,
// `#pmdr_modes`, radios `#pmdr-pomodoro|break|longbreak`, `#pmdr_timer`,
// `#pmdr_start|pause|reset`, `#focus-toggle`/`#pmdr-focus`) et l.263-268
// (`#pomodoro-info`, `#poms-today|week|month`) ; enchaînements de
// features/pomodoro.ts : initialisation l.247-259, départ l.262-319, pause
// l.321-337, fin l.343-360, modes l.190-199, concentration l.403-468.
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import {
  TIME_BEFORE_RESET,
  alarmPlan,
  countSessions,
  formatTime,
  isDefaultStopped,
  isRunning,
  playAlarmSound,
  pushSession,
  remainingAfterPause,
  secondsLeft,
  startFromButton,
  tabTitleFor,
} from "@/bonjourr/pomodoro";
import { translate } from "@/bonjourr/i18n";
import { useBonjourrStore } from "@/stores/bonjourr";

const MODES = [
  { value: "pomodoro", label: "Pomodoro" },
  { value: "break", label: "Pause" },
  { value: "longbreak", label: "Longue pause" },
] as const;

const RING_RADIUS = 54;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const settings = useBonjourrStore();

// i18n FR/EN (case 21).
const t = (key: string) => translate(settings.config.lang, key);
const seconds = ref(settings.config.pomodoro.timeFor[settings.config.pomodoro.mode]);
const started = ref(false);

let countdown: ReturnType<typeof setInterval> | undefined;
let resetTimeout: ReturnType<typeof setTimeout> | undefined;
let titleTimeout: ReturnType<typeof setTimeout> | undefined;
let baseTitle = "";

const display = computed(() => formatTime(seconds.value));
const sessions = computed(() => countSessions(settings.config.pomodoro.history));
const focus = computed(() => settings.config.pomodoro.focus);

const containerClasses = computed(() => [
  {
    hidden: !settings.config.pomodoro.on,
    started: started.value,
    onFocus: focus.value,
    outOfFocus: !focus.value,
  },
]);

// L’anneau se vide à mesure que la montre tourne.
const progress = computed(() => {
  const total = settings.config.pomodoro.timeFor[settings.config.pomodoro.mode];
  return total === 0 ? 0 : Math.min(1, Math.max(0, 1 - seconds.value / total));
});

function insertTime(value: number, timerIsStarted = true) {
  seconds.value = value;
  document.title = tabTitleFor(formatTime(value), timerIsStarted, baseTitle, "Temps écoulé !");
}

function stopCountdown() {
  clearInterval(countdown);
  started.value = false;
}

function startCountdown(end: number) {
  insertTime(secondsLeft(end, Date.now()));
  countdown = setInterval(() => tick(end), 100);
  started.value = true;
}

function clearTimeouts() {
  clearTimeout(resetTimeout);
  clearTimeout(titleTimeout);
}

/** Le temps est écoulé : son, séance inscrite, puis remise à l’heure (l.343-360, l.471-495). */
function finish() {
  stopCountdown();
  clearTimeouts();

  const pomodoro = settings.config.pomodoro;
  const plan = alarmPlan(pomodoro.sound, pomodoro.volume);

  if (plan.ring) {
    playAlarmSound(plan.volume, pomodoro.alarm);
  }

  if (pomodoro.mode === "pomodoro") {
    settings.patch({
      pomodoro: { history: pushSession(pomodoro.history, Date.now(), pomodoro.timeFor.pomodoro) },
    });
  }

  // Le titre d’onglet et la montre reviennent à leur état par défaut dix secondes après (l.351-354, l.391-393).
  resetTimeout = setTimeout(() => switchMode(settings.config.pomodoro.mode), TIME_BEFORE_RESET);
  titleTimeout = setTimeout(() => {
    document.title = baseTitle;
  }, TIME_BEFORE_RESET);
}

function tick(end: number) {
  const left = secondsLeft(end, Date.now());
  insertTime(left);

  if (left === 0) {
    finish();
  }
}

/** Affiche la durée d’un mode sans rien écrire (l.194, l.257). */
function showMode(mode: string) {
  clearTimeouts();
  stopCountdown();
  const time = settings.config.pomodoro.timeFor[mode as keyof typeof settings.config.pomodoro.timeFor];
  insertTime(time ?? 0, false);
}

/** `switchMode` (l.190-199) : le changement de mode remet la montre à zéro. */
function switchMode(mode: string) {
  showMode(mode);
  settings.patch({ pomodoro: { mode: mode as typeof settings.config.pomodoro.mode, end: 0, pause: 0 } });
}

function start() {
  const next = startFromButton(settings.config.pomodoro, Date.now());
  settings.patch({ pomodoro: next });
  startCountdown(next.end);
}

function pause() {
  stopCountdown();
  settings.patch({ pomodoro: { pause: Date.now() } });
}

function reset() {
  switchMode(settings.config.pomodoro.mode);
}

function patchFocus(value: boolean) {
  settings.patch({ pomodoro: { focus: value } });
}

watch(
  focus,
  (value) => {
    document.body.classList.toggle("pomodoro-focus", value);
  },
  { immediate: true },
);

// Le panneau change la durée d’un mode : `updatePomodoro` rappelle `resetTimer()`
// quitte à arrêter une montre en marche (l.604-606, l.339-341).
watch(
  () => settings.config.pomodoro.timeFor,
  () => reset(),
  { deep: true },
);

onMounted(() => {
  baseTitle = document.title;
  const pomodoro = settings.config.pomodoro;
  const now = Date.now();

  // `initTimer` (l.247-259).
  if (isRunning(pomodoro, now)) {
    if (pomodoro.pause !== 0) {
      insertTime(secondsLeft(now + remainingAfterPause(pomodoro), now), false);
    } else {
      startCountdown(pomodoro.end);
    }

    return;
  }

  if (isDefaultStopped(pomodoro, now) && pomodoro.mode) {
    showMode(pomodoro.mode);
  }
});

onBeforeUnmount(() => {
  clearInterval(countdown);
  clearTimeouts();
  document.body.classList.remove("pomodoro-focus");
  document.title = baseTitle;
});
</script>

<template>
  <div id="pomodoro_container" :class="containerClasses">
    <fieldset id="pmdr_modes" class="glass">
      <div
        v-for="mode in MODES"
        :key="mode.value"
        class="pomodoro_mode"
        :class="{ active: settings.config.pomodoro.mode === mode.value }"
        tabindex="0">
        <input
          :checked="settings.config.pomodoro.mode === mode.value"
          :id="`pmdr-${mode.value}`"
          :value="mode.value"
          name="pomodoro_modes"
          type="radio"
          @change="switchMode(mode.value)" />
        <label :for="`pmdr-${mode.value}`">{{ t(mode.label) }}</label>
      </div>
    </fieldset>

    <div class="pmdr-ring-wrap">
      <svg aria-hidden="true" class="pmdr-ring" viewBox="0 0 120 120">
        <circle class="track" cx="60" cy="60" :r="RING_RADIUS" />
        <circle
          class="bar"
          cx="60"
          cy="60"
          :r="RING_RADIUS"
          :stroke-dasharray="`${RING_CIRCUMFERENCE}`"
          :stroke-dashoffset="`${RING_CIRCUMFERENCE * (1 - progress)}`" />
      </svg>
      <span id="pmdr_timer">{{ display }}</span>
    </div>

    <div id="bottomControls">
      <button id="pmdr_start" class="glass" :title="t('Démarrer')" type="button" @click="start">
        <span aria-hidden="true">▶</span>
      </button>
      <button id="pmdr_pause" class="glass" :title="t('Pause')" type="button" @click="pause">
        <span aria-hidden="true">❚❚</span>
      </button>
      <button id="pmdr_reset" class="glass" :title="t('Réinitialiser')" type="button" @click="reset">
        <span aria-hidden="true">↺</span>
      </button>
      <label id="focus-toggle" tabindex="0">
        <input
          id="pmdr-focus"
          name="pmdr-focus"
          type="checkbox"
          :checked="focus"
          @change="patchFocus(($event.target as HTMLInputElement).checked)" />
        <span class="slider"></span>
        <span>{{ t("Concentration") }}</span>
      </label>
    </div>

    <div id="pomodoro-info">
      <hr />
      <div>
        <span>{{ t("Séances aujourd'hui") }} </span>: <span id="poms-today">{{ sessions.today }}</span>
      </div>
      <div>
        <span>{{ t("Cette semaine") }} </span>: <span id="poms-week">{{ sessions.week }}</span>
      </div>
      <div>
        <span>{{ t("Ce mois-ci") }} </span>: <span id="poms-month">{{ sessions.month }}</span>
      </div>
    </div>
  </div>
</template>

<style lang="sass">
// Reproduit styles/features/pomodoro.css l.15-27 : en mode concentration, le
// reste de la page s’efface. Non scopé parce que la règle vise `.bonjourr-content`,
// hors de ce composant.
body.pomodoro-focus
  .bonjourr-content > *:not(#pomodoro_container)
    opacity: 0
    pointer-events: none
    transition: opacity 0.3s
</style>

<style lang="sass" scoped>
@import @/assets/variables.sass

#pomodoro_container
  align-items: center
  display: flex
  flex-direction: column
  gap: 0.75rem
  padding: 1rem

  &.hidden
    display: none

  #pmdr_modes
    background: rgba(0, 0, 0, 0.2)
    border: 1px solid rgba(255, 255, 255, 0.15)
    border-radius: 999px
    display: flex
    margin: 0
    padding: 0.2rem

    .pomodoro_mode
      align-items: center
      border-radius: 999px
      cursor: pointer
      display: flex
      gap: 0.3rem
      padding: 0.3rem 0.8rem

      input
        accent-color: #7ed8b2

      &.active
        background: rgba(255, 255, 255, 0.18)

  .pmdr-ring-wrap
    height: 10rem
    position: relative
    width: 10rem

    .pmdr-ring
      height: 100%
      transform: rotate(-90deg)
      width: 100%

      .track
        fill: none
        stroke: rgba(255, 255, 255, 0.15)
        stroke-width: 6

      .bar
        fill: none
        stroke: #7ed8b2
        stroke-linecap: round
        stroke-width: 6
        transition: stroke-dashoffset 0.2s linear

    #pmdr_timer
      font-size: 2rem
      left: 0
      position: absolute
      text-align: center
      top: 50%
      transform: translateY(-50%)
      width: 100%

  #bottomControls
    align-items: center
    display: flex
    gap: 0.5rem

    button
      background: rgba(255, 255, 255, 0.18)
      border: none
      border-radius: 50%
      color: inherit
      cursor: pointer
      font: inherit
      height: 2.5rem
      width: 2.5rem

    // L’original n’affiche que l’un des deux (pomodoro.css l.57-65).
    #pmdr_pause
      display: none

  &.started #bottomControls
    #pmdr_pause
      display: block

    #pmdr_start
      display: none

  #focus-toggle
    align-items: center
    cursor: pointer
    display: flex
    gap: 0.4rem

    input
      display: none

    .slider
      background: rgba(255, 255, 255, 0.2)
      border-radius: 999px
      height: 1.1rem
      position: relative
      width: 2rem

      &:after
        background: #fff
        border-radius: 50%
        content: ""
        height: 0.9rem
        left: 0.1rem
        position: absolute
        top: 0.1rem
        transition: transform 0.2s
        width: 0.9rem

    input:checked + .slider:after
      transform: translateX(0.9rem)

  #pomodoro-info
    font-size: 0.8rem
    opacity: 0.8

    hr
      border: none
      border-top: 1px solid rgba(255, 255, 255, 0.15)
      margin-bottom: 0.4rem
</style>
