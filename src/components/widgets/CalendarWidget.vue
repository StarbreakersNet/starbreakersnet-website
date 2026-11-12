<script lang="ts" setup>
import { computed, onBeforeUnmount, type PropType, ref } from "vue";
import { DateTime } from "luxon";
import type { CalendarSettings, WidgetSize } from "@/types/Widget";

const props = defineProps({
  settings: {
    type: Object as PropType<CalendarSettings>,
    required: true,
  },
  size: {
    type: String as PropType<WidgetSize>,
    required: true,
  },
});

const WEEKDAYS = ["L", "M", "M", "J", "V", "S", "D"];

interface CalendarDay {
  key: string;
  // Numéro du jour, null hors du mois affiché
  day: number | null;
  isToday: boolean;
  weekend: boolean;
}

interface CalendarWeek {
  number: number;
  days: CalendarDay[];
}

function startOfToday() {
  return DateTime.now().setLocale("fr").startOf("day");
}

const today = ref(startOfToday());

// Date du jour vérifiée chaque minute, pour passer au lendemain à minuit
function refreshToday() {
  const now = startOfToday();

  if (!now.equals(today.value)) {
    today.value = now;
  }
}

function buildWeek(monday: DateTime, month: number): CalendarWeek {
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = monday.plus({ days: index });
    const inMonth = date.month === month;

    return {
      key: date.toISODate()!,
      day: inMonth ? date.day : null,
      isToday: date.equals(today.value),
      weekend: index >= 5,
    };
  });

  return { number: monday.weekNumber, days };
}

// Semaines du mois, du lundi au dimanche ; jours hors du mois laissés vides
const weeks = computed(() => {
  const first = today.value.startOf("month");
  const firstMonday = first.minus({ days: first.weekday - 1 });
  const last = first.endOf("month");

  const result: CalendarWeek[] = [];

  for (let monday = firstMonday; monday <= last; monday = monday.plus({ weeks: 1 })) {
    result.push(buildWeek(monday, first.month));
  }

  return result;
});

const monthName = computed(() => today.value.toFormat("LLLL"));

const monthAndYear = computed(() => today.value.toFormat("LLLL yyyy"));

const weekdayName = computed(() => today.value.toFormat("cccc"));

const timer = setInterval(refreshToday, 60000);

onBeforeUnmount(() => clearInterval(timer));
</script>

<template>
  <div :class="[props.size, { 'week-numbers': props.settings.weekNumbers }]" class="calendar">
    <section v-if="props.size === 'medium'" class="today">
      <span class="weekday">{{ weekdayName }}</span>
      <span class="day-number">{{ today.day }}</span>
      <span class="month-year">{{ monthAndYear }}</span>
    </section>
    <section class="month">
      <header class="month-name">{{ monthName }}</header>
      <table :aria-label="monthAndYear" class="grid">
        <thead>
          <tr>
            <th v-if="props.settings.weekNumbers" class="week" scope="col" />
            <th v-for="(weekday, index) in WEEKDAYS" :key="index" scope="col">{{ weekday }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="week in weeks" :key="week.number">
            <td v-if="props.settings.weekNumbers" class="week">{{ week.number }}</td>
            <td
              v-for="day in week.days"
              :key="day.key"
              :aria-current="day.isToday ? 'date' : undefined"
              :class="{ today: day.isToday, weekend: day.weekend }">
              <span v-if="day.day" class="day">{{ day.day }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>

<style lang="scss" scoped>
// Tailles relatives à la hauteur du widget (cqh) : six semaines tiennent toujours, sans ascenseur
.calendar {
  display: flex;
  gap: 8cqh;
  width: 100%;
  height: 100%;
  padding: 8cqh 9cqh;
  line-height: 1;
}

.today {
  display: flex;
  flex: none;
  flex-direction: column;
  min-width: 0;

  .weekday {
    font-size: 9.5cqh;
    font-weight: 600;
    color: rgb(255 69 58);
    text-transform: capitalize;
  }

  .day-number {
    margin-top: 0.05em;
    font-size: 38cqh;
    font-weight: 300;
    letter-spacing: -0.03em;
  }

  .month-year {
    margin-top: auto;
    font-size: 8cqh;
    color: var(--glass-text-soft);
    text-transform: capitalize;
  }
}

.month {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
}

.month-name {
  margin-bottom: 3cqh;
  font-size: 8.5cqh;
  font-weight: 700;
  color: rgb(255 69 58);
  text-transform: uppercase;
  letter-spacing: 0.04em;

  .medium & {
    display: none;
  }
}

.grid {
  flex: 1;
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  // Six semaines + en-têtes : 6 × 1.6em à 6.4cqh, plus les titres, tiennent dans 100cqh
  font-size: 6.4cqh;
  font-weight: 600;
  text-align: center;

  th {
    padding-bottom: 1.5cqh;
    font-size: 0.9em;
    color: var(--glass-text-soft);
  }

  td {
    padding: 0;
  }

  .weekend {
    color: var(--glass-text-soft);
  }

  .week {
    width: 1.6em;
    font-size: 0.8em;
    font-weight: 500;
    color: var(--glass-text-soft);
  }

  .day {
    display: inline-grid;
    place-items: center;
    width: 1.6em;
    height: 1.6em;
    border-radius: 50%;
  }

  .today .day {
    color: white;
    background: rgb(255 69 58);
  }
}
</style>
