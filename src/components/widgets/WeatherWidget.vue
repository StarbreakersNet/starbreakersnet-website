<script lang="ts" setup>
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { DateTime } from "luxon";
import { describeWeather, fetchForecast, type Forecast } from "@/lib/weather";
import type { WeatherSettings, WidgetSize } from "@/types/Widget";

const props = defineProps<{
  settings: WeatherSettings;
  size: WidgetSize;
}>();

const REFRESH_INTERVAL = 15 * 60 * 1000;

const forecast = ref<Forecast | null>(null);
const failed = ref(false);

async function load() {
  try {
    forecast.value = await fetchForecast(props.settings);
    failed.value = false;
  } catch {
    failed.value = true;
  }
}

watch(
  () => [props.settings.location.latitude, props.settings.location.longitude, props.settings.unit],
  () => {
    forecast.value = null;
    load();
  },
  { immediate: true }
);
const timer = setInterval(load, REFRESH_INTERVAL);
onBeforeUnmount(() => clearInterval(timer));

const round = (value: number) => `${Math.round(value)}°`;

const current = computed(() => {
  if (!forecast.value) return null;
  const today = forecast.value.days[0];
  return {
    temperature: round(forecast.value.temperature),
    ...describeWeather(forecast.value.code, forecast.value.isDay),
    max: today ? round(today.max) : "",
    min: today ? round(today.min) : "",
  };
});

// Jours suivants (5), pour la taille moyenne
const days = computed(() =>
  (forecast.value?.days ?? []).slice(1, 6).map(day => ({
    ...day,
    label: DateTime.fromISO(day.date).setLocale("fr").toFormat("ccc").replace(".", ""),
    icon: describeWeather(day.code).icon,
    max: round(day.max),
    min: round(day.min),
  }))
);
</script>

<template>
  <div :class="props.size" class="weather">
    <section class="now">
      <header class="place">
        <span class="name">{{ props.settings.location.name }}</span>
        <font-awesome-icon class="arrow" icon="location-arrow" />
      </header>
      <template v-if="current">
        <span class="temperature">{{ current.temperature }}</span>
        <footer class="condition">
          <font-awesome-icon :class="current.icon" :icon="current.icon" class="icon" />
          <span class="label">{{ current.label }}</span>
          <span class="range">H : {{ current.max }} B : {{ current.min }}</span>
        </footer>
      </template>
      <p v-else class="status">{{ failed ? "Météo indisponible" : "Chargement…" }}</p>
    </section>

    <ol v-if="props.size === 'medium' && days.length" class="days">
      <li v-for="day in days" :key="day.date" class="day">
        <span class="day-label">{{ day.label }}</span>
        <font-awesome-icon :class="day.icon" :icon="day.icon" class="icon" />
        <span class="day-max">{{ day.max }}</span>
        <span class="day-min">{{ day.min }}</span>
      </li>
    </ol>
  </div>
</template>

<style lang="scss" scoped>
// Tailles relatives à la hauteur du widget (cqh) : le contenu tient toujours, sans ascenseur
.weather {
  display: flex;
  gap: 6cqh;
  width: 100%;
  height: 100%;
  padding: 9cqh 10cqh;
  line-height: 1.15;
}

.now {
  display: flex;
  flex: none;
  flex-direction: column;
  min-width: 0;

  .small & {
    flex: 1;
  }
}

.place {
  display: flex;
  align-items: center;
  gap: 0.35em;
  font-size: 9.5cqh;
  font-weight: 600;

  .name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .arrow {
    flex: none;
    font-size: 0.65em;
  }
}

.temperature {
  font-size: 30cqh;
  font-weight: 300;
  letter-spacing: -0.03em;
  line-height: 1;
}

.condition {
  display: flex;
  flex-direction: column;
  margin-top: auto;
  font-size: 8cqh;
  font-weight: 600;

  .icon {
    margin-bottom: 0.25em;
    font-size: 1.4em;
  }

  .label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .range {
    color: var(--glass-text-soft);
    font-weight: 500;
  }
}

.status {
  margin-top: auto;
  font-size: 8cqh;
  color: var(--glass-text-soft);
}

.days {
  display: flex;
  flex: 1;
  justify-content: space-between;
  min-width: 0;
  padding: 0 0 0 6cqh;
  border-left: 1px solid var(--glass-separator);
  list-style: none;
}

.day {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  font-size: 8.5cqh;
  font-weight: 600;

  .day-label {
    color: var(--glass-text-soft);
    text-transform: capitalize;
  }

  .icon {
    font-size: 1.5em;
  }

  .day-min {
    color: var(--glass-text-soft);
    font-weight: 500;
  }
}

// Couleurs des icônes, comme dans l'app Météo
.icon {
  &.sun,
  &.cloud-sun {
    color: rgb(255 204 0);
  }

  &.moon,
  &.cloud-moon {
    color: rgb(255 236 170);
  }

  &.cloud-rain,
  &.cloud-showers-heavy {
    color: rgb(100 180 255);
  }

  &.cloud-bolt {
    color: rgb(255 214 10);
  }
}
</style>
