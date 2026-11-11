<script lang="ts" setup>
import { computed, onBeforeUnmount, ref } from "vue";
import { DateTime } from "luxon";
import type { CountdownSettings, WidgetSize } from "@/types/Widget";

const props = defineProps<{
  settings: CountdownSettings;
  size: WidgetSize;
}>();

const now = ref(DateTime.now());
const timer = setInterval(() => (now.value = DateTime.now()), 1000);
onBeforeUnmount(() => clearInterval(timer));

const target = computed(() => DateTime.fromISO(props.settings.target).setLocale("fr"));
const past = computed(() => target.value <= now.value);

const remaining = computed(() =>
  target.value.diff(now.value, ["days", "hours", "minutes", "seconds"]).toObject()
);

const units = computed(() => {
  const { days = 0, hours = 0, minutes = 0, seconds = 0 } = remaining.value;
  return [
    { value: days, label: days > 1 ? "jours" : "jour" },
    { value: hours, label: hours > 1 ? "heures" : "heure" },
    { value: minutes, label: "min" },
    { value: Math.floor(seconds), label: "s" },
  ].map(unit => ({ ...unit, value: Math.max(0, Math.floor(unit.value)) }));
});

// Petit format : le nombre de jours, ou l'heure exacte le dernier jour
const headline = computed(() => {
  const [days, hours, minutes, seconds] = units.value;
  if (days!.value > 0) return { value: String(days!.value), label: days!.label };
  const pad = (value: number) => String(value).padStart(2, "0");
  return { value: `${pad(hours!.value)}:${pad(minutes!.value)}:${pad(seconds!.value)}`, label: "" };
});

const date = computed(() =>
  target.value.toFormat(
    target.value.hour || target.value.minute ? "d LLLL yyyy, HH:mm" : "d LLLL yyyy"
  )
);
</script>

<template>
  <div :class="props.size" class="countdown">
    <header class="title">{{ props.settings.title || "Évènement" }}</header>

    <p v-if="past" class="done">
      <font-awesome-icon class="done-icon" icon="check" />
      C'est arrivé !
    </p>
    <p v-else-if="props.size === 'small'" :class="{ 'last-day': !headline.label }" class="headline">
      <span class="value">{{ headline.value }}</span>
      <span class="unit">{{ headline.label }}</span>
    </p>
    <ol v-else class="units">
      <li v-for="unit in units" :key="unit.label" class="unit-block">
        <span class="value">{{ unit.value }}</span>
        <span class="unit">{{ unit.label }}</span>
      </li>
    </ol>

    <footer class="date">{{ date }}</footer>
  </div>
</template>

<style lang="scss" scoped>
// Tailles relatives à la hauteur du widget (cqh) : le contenu tient toujours, sans ascenseur
.countdown {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  padding: 9cqh 10cqh;
  line-height: 1.1;
}

.title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 9.5cqh;
  font-weight: 600;
  color: rgb(255 159 10);
}

.headline {
  display: flex;
  flex-direction: column;
  margin: auto 0;

  .value {
    font-size: 30cqh;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.03em;
  }

  .unit {
    font-size: 10cqh;
    color: var(--glass-text-soft);
  }

  // Dernier jour, au format 00:00:00
  &.last-day .value {
    font-size: 17cqh;
  }
}

.units {
  display: flex;
  gap: 4%;
  margin: auto 0;
  padding: 0;
  list-style: none;
}

.unit-block {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  padding: 5cqh 0;
  border-radius: 6cqh;
  background: var(--glass-control);

  .value {
    font-size: 22cqh;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }

  .unit {
    font-size: 8cqh;
    color: var(--glass-text-soft);
  }
}

.done {
  display: flex;
  flex-direction: column;
  gap: 0.2em;
  margin: auto 0;
  font-size: 13cqh;
  font-weight: 600;

  .done-icon {
    color: rgb(48 209 88);
  }
}

.date {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 8cqh;
  color: var(--glass-text-soft);
}
</style>
