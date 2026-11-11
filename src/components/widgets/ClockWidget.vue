<script lang="ts" setup>
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { DateTime } from "luxon";
import { localTimezone, timezoneCity } from "@/models/widgets";
import type { ClockSettings, WidgetSize } from "@/types/Widget";

const props = defineProps<{
  settings: ClockSettings;
  size: WidgetSize;
}>();

// Heure courante, rafraîchie chaque seconde (ou chaque minute sans trotteuse)
const now = ref(DateTime.now());
let timer: ReturnType<typeof setTimeout> | undefined;

function tick() {
  now.value = DateTime.now();
  const step = props.settings.seconds ? 1000 : 60000;
  timer = setTimeout(tick, step - (Date.now() % step));
}

tick();
watch(
  () => props.settings.seconds,
  () => {
    clearTimeout(timer);
    tick();
  }
);
onBeforeUnmount(() => clearTimeout(timer));

const zoned = computed(() => {
  const time = now.value.setLocale("fr");
  return props.settings.timezone ? time.setZone(props.settings.timezone) : time;
});

const label = computed(
  () => props.settings.label.trim() || timezoneCity(props.settings.timezone ?? localTimezone())
);

const time = computed(() => zoned.value.toFormat(props.settings.seconds ? "HH:mm:ss" : "HH:mm"));
const date = computed(() => zoned.value.toFormat("cccc d LLLL"));

// Décalage avec l'heure de l'appareil, affiché pour un autre fuseau : « +6 h », « −9 h 30 »
const offset = computed(() => {
  if (!props.settings.timezone) return "";
  const minutes = zoned.value.offset - now.value.offset;
  if (minutes === 0) return "Même heure";
  const sign = minutes > 0 ? "+" : "−";
  const hours = Math.floor(Math.abs(minutes) / 60);
  const rest = Math.abs(minutes) % 60;
  return `${sign}${hours} h${rest ? ` ${rest}` : ""}`;
});

// Angles des aiguilles, en degrés depuis midi
const angles = computed(() => {
  const { hour, minute, second } = zoned.value;
  return {
    hour: (hour % 12) * 30 + minute * 0.5,
    minute: minute * 6 + (props.settings.seconds ? second * 0.1 : 0),
    second: second * 6,
  };
});

const numerals = Array.from({ length: 12 }, (_, index) => {
  const value = index + 1;
  const angle = (value * 30 * Math.PI) / 180;
  return { value, x: 50 + 36 * Math.sin(angle), y: 50 - 36 * Math.cos(angle) };
});

const ticks = Array.from({ length: 60 }, (_, index) => index * 6);
</script>

<template>
  <div :class="[props.settings.style, props.size]" class="clock">
    <svg
      v-if="props.settings.style === 'analog'"
      :aria-label="`${time}, ${label}`"
      class="face"
      role="img"
      viewBox="0 0 100 100">
      <circle class="dial" cx="50" cy="50" r="48" />
      <line
        v-for="angle in ticks"
        :key="angle"
        :class="{ major: angle % 30 === 0 }"
        :transform="`rotate(${angle} 50 50)`"
        class="tick"
        x1="50"
        x2="50"
        y1="4.5"
        :y2="angle % 30 === 0 ? 8.5 : 6.5" />
      <text
        v-for="numeral in numerals"
        :key="numeral.value"
        :x="numeral.x"
        :y="numeral.y"
        class="numeral"
        dominant-baseline="central"
        text-anchor="middle">
        {{ numeral.value }}
      </text>
      <text v-if="props.size === 'small'" class="city" x="50" y="68" text-anchor="middle">
        {{ label.slice(0, 3).toUpperCase() }}
      </text>
      <g :transform="`rotate(${angles.hour} 50 50)`">
        <line class="hand hour" x1="50" x2="50" y1="52" y2="27" />
      </g>
      <g :transform="`rotate(${angles.minute} 50 50)`">
        <line class="hand minute" x1="50" x2="50" y1="52" y2="12" />
      </g>
      <g v-if="props.settings.seconds" :transform="`rotate(${angles.second} 50 50)`">
        <line class="hand second" x1="50" x2="50" y1="58" y2="9" />
      </g>
      <circle class="pin" cx="50" cy="50" r="1.8" />
      <circle class="pin-center" cx="50" cy="50" r="0.8" />
    </svg>

    <div v-if="props.settings.style === 'digital' || props.size !== 'small'" class="details">
      <span class="label">{{ label }}</span>
      <span class="time">{{ time }}</span>
      <span class="date">{{ date }}</span>
      <span v-if="offset" class="offset">{{ offset }}</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.clock {
  display: flex;
  align-items: center;
  gap: 1rem;
  width: 100%;
  height: 100%;
  padding: 12px;
  container-type: size;

  &.analog.small {
    justify-content: center;
    padding: 10px;
  }

  &.digital {
    padding: 16px 18px;
  }

  &.medium {
    padding: 14px 20px 14px 14px;
  }
}

.face {
  flex: none;
  height: 100%;
  aspect-ratio: 1;

  --face: rgb(255 255 255);
  --ink: rgb(29 29 31);
  --ink-soft: rgb(29 29 31 / 0.35);

  :root[data-theme="dark"] & {
    --face: rgb(28 28 30 / 0.9);
    --ink: rgb(255 255 255);
    --ink-soft: rgb(255 255 255 / 0.35);
  }

  .dial {
    fill: var(--face);
  }

  .tick {
    stroke: var(--ink-soft);
    stroke-width: 0.6;

    &.major {
      stroke: var(--ink);
      stroke-width: 1;
    }
  }

  .numeral {
    fill: var(--ink);
    font-size: 9px;
    font-weight: 600;
  }

  .city {
    fill: var(--ink-soft);
    font-size: 7px;
    font-weight: 700;
    letter-spacing: 0.08em;
  }

  .hand {
    stroke: var(--ink);
    stroke-linecap: round;

    &.hour {
      stroke-width: 3.4;
    }

    &.minute {
      stroke-width: 2.4;
    }

    &.second {
      stroke: rgb(255 149 0);
      stroke-width: 0.9;
    }
  }

  .pin {
    fill: rgb(255 149 0);
  }

  .pin-center {
    fill: var(--face);
  }
}

.details {
  display: flex;
  flex-direction: column;
  min-width: 0;
  line-height: 1.15;

  .label {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--glass-text-soft);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .time {
    margin-top: 0.15em;
    font-size: clamp(1.6rem, 22cqh, 3.2rem);
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.02em;
  }

  .date {
    margin-top: 0.35em;
    font-size: 0.9rem;
    color: var(--glass-text-soft);

    &::first-letter {
      text-transform: uppercase;
    }
  }

  .offset {
    margin-top: 0.2em;
    font-size: 0.8rem;
    color: var(--glass-text-soft);
  }
}

.digital.small .details .time {
  font-size: clamp(1.4rem, 20cqh, 2.4rem);
}
</style>
