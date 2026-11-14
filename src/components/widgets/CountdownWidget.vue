<script lang="ts" setup>
import { computed, onBeforeUnmount, type PropType, ref } from "vue";
import { DateTime } from "luxon";
import type { CountdownSettings, WidgetSize } from "@/types/Widget";

const props = defineProps({
  settings: {
    type: Object as PropType<CountdownSettings>,
    required: true,
  },
  size: {
    type: String as PropType<WidgetSize>,
    required: true,
  },
});

const now = ref(DateTime.now());

const target = computed(() => DateTime.fromISO(props.settings.target).setLocale("fr"));

const past = computed(() => target.value <= now.value);

const remaining = computed(() => {
  const difference = target.value.diff(now.value, ["days", "hours", "minutes", "seconds"]);

  return difference.toObject();
});

function plural(value: number, singular: string, several: string) {
  return value > 1 ? several : singular;
}

const units = computed(() => {
  const { days = 0, hours = 0, minutes = 0, seconds = 0 } = remaining.value;

  const list = [
    { value: days, label: plural(days, "jour", "jours") },
    { value: hours, label: plural(hours, "heure", "heures") },
    { value: minutes, label: "min" },
    { value: seconds, label: "s" },
  ];

  return list.map(unit => ({ ...unit, value: Math.max(0, Math.floor(unit.value)) }));
});

function pad(value: number) {
  return String(value).padStart(2, "0");
}

// Petit format : le nombre de jours, ou l'heure exacte le dernier jour
const headline = computed(() => {
  const [days, hours, minutes, seconds] = units.value;

  let result = { value: String(days!.value), label: days!.label };

  if (days!.value === 0) {
    const clock = `${pad(hours!.value)}:${pad(minutes!.value)}:${pad(seconds!.value)}`;

    result = { value: clock, label: "" };
  }

  return result;
});

const date = computed(() => {
  const hasTime = target.value.hour !== 0 || target.value.minute !== 0;
  const format = hasTime ? "d LLLL yyyy, HH:mm" : "d LLLL yyyy";

  return target.value.toFormat(format);
});

const timer = setInterval(() => (now.value = DateTime.now()), 1000);

onBeforeUnmount(() => clearInterval(timer));
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
