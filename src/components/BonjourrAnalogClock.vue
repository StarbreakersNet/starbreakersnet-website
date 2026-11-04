<script lang="ts" setup>
// Cadran analogique du fork Bonjourr : l'original dessine l'analogique en CSS
// (Bonjourr/src/styles/features/time.css, data-face/data-hands/data-shape), le fork
// le rend en SVG avec les mêmes réglages (analogstyle) et les mêmes formules
// d'aiguilles (clock.ts analog() l.151-153, portées par analogAngles()).
import { computed } from "vue";
import { analogAngles } from "@/bonjourr/clock";
import type { BonjourrConfig } from "@/bonjourr/config";

const props = defineProps<{
  now: Date;
  seconds: boolean;
  analogstyle: BonjourrConfig["analogstyle"];
  timezone?: string;
}>();

const ROMANS = ["XII", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI"];
const NUMBERS = ["12", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11"];

const angles = computed(() => analogAngles(props.now, props.timezone));

function polar(radius: number, index: number, per: number): { x: number; y: number } {
  const rad = ((index * (360 / per)) * Math.PI) / 180;
  return { x: 50 + radius * Math.sin(rad), y: 50 - radius * Math.cos(rad) };
}

const faceLabels = computed(() => {
  if (props.analogstyle.face === "number") {
    return NUMBERS.map((label, index) => ({ label, ...polar(36, index, 12) }));
  }
  if (props.analogstyle.face === "roman") {
    return ROMANS.map((label, index) => ({ label, ...polar(36, index, 12) }));
  }
  return [];
});

const ticks = computed(() => {
  if (props.analogstyle.face !== "marks") return [];
  return Array.from({ length: 60 }, (_, index) => {
    const major = index % 5 === 0;
    const outer = polar(45, index, 60);
    const inner = polar(major ? 39 : 42, index, 60);
    return { major, x1: inner.x, y1: inner.y, x2: outer.x, y2: outer.y };
  });
});

const frame = computed(() => {
  const shape = props.analogstyle.shape;
  if (shape === "square") {
    return { kind: "rect" as const, x: 7, y: 7, width: 86, height: 86, radius: 3 };
  }
  if (shape === "rectangle") {
    return { kind: "rect" as const, x: 1, y: 17, width: 98, height: 66, radius: 3 };
  }
  return { kind: "circle" as const, cx: 50, cy: 50, r: 46 };
});
</script>

<template>
  <div class="analog-clock" :class="[`hands-${analogstyle.hands}`, `shape-${analogstyle.shape}`]">
    <svg aria-hidden="true" viewBox="0 0 100 100">
      <circle
        v-if="frame.kind === 'circle'"
        :cx="frame.cx"
        :cy="frame.cy"
        :r="frame.r"
        :fill="analogstyle.background"
        :stroke="analogstyle.border"
        stroke-width="1.5" />
      <rect
        v-else
        :fill="analogstyle.background"
        :height="frame.height"
        :rx="frame.radius"
        :stroke="analogstyle.border"
        :width="frame.width"
        :x="frame.x"
        :y="frame.y"
        stroke-width="1.5" />

      <line
        v-for="(tick, index) in ticks"
        :key="`tick-${index}`"
        :stroke-width="tick.major ? 1.2 : 0.6"
        :x1="tick.x1"
        :x2="tick.x2"
        :y1="tick.y1"
        :y2="tick.y2"
        class="analog-tick" />

      <text
        v-for="(label, index) in faceLabels"
        :key="`label-${index}`"
        :x="label.x"
        :y="label.y"
        class="analog-label"
        text-anchor="middle">
        {{ label.label }}
      </text>

      <g class="analog-hand analog-hours" :transform="`rotate(${angles.hours} 50 50)`">
        <polygon v-if="analogstyle.hands === 'classic'" points="50,28 52.2,50 50,56 47.8,50" />
        <rect
          v-else-if="analogstyle.hands === 'swiss'"
          :height="30"
          :y="28"
          width="3"
          x="48.5" />
        <line v-else x1="50" x2="50" y1="56" y2="28" stroke-width="3.2" stroke-linecap="round" />
      </g>

      <g class="analog-hand analog-minutes" :transform="`rotate(${angles.minutes} 50 50)`">
        <polygon v-if="analogstyle.hands === 'classic'" points="50,14 51.6,50 50,56 48.4,50" />
        <rect v-else-if="analogstyle.hands === 'swiss'" :height="44" :y="14" width="2" x="49" />
        <line v-else x1="50" x2="50" y1="58" y2="15" stroke-width="2.2" stroke-linecap="round" />
      </g>

      <g
        v-if="seconds"
        class="analog-hand analog-seconds"
        :transform="`rotate(${angles.seconds} 50 50)`">
        <line x1="50" x2="50" y1="62" y2="12" stroke-width="0.8" />
      </g>

      <circle class="analog-center" cx="50" cy="50" r="1.8" />
    </svg>
  </div>
</template>

<style lang="sass" scoped>
.analog-clock
  color: white
  display: block
  height: var(--analog-size, 12em)
  width: var(--analog-size, 12em)

  svg
    display: block
    height: 100%
    overflow: visible
    width: 100%

  .analog-tick,
  .analog-hand
    fill: currentColor
    stroke: currentColor

  .analog-label
    fill: currentColor
    font-size: 7px
    font-weight: 300
    stroke: none

  .analog-seconds
    opacity: 0.8

  .analog-center
    fill: currentColor
    stroke: none
</style>
