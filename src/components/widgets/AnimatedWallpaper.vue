<script lang="ts" setup>
import { computed } from "vue";
import type { WallpaperMotion } from "@/models/wallpapers";

// Animation d'un fond maison, dessinée en CSS et SVG au-dessus de son dégradé, à la taille de son
// conteneur (plein écran dans Buroh, vignette dans la fenêtre Fond d'écran). Seules la position et
// l'opacité sont animées, pour rester léger ; avec « Réduire les animations », l'image reste fixe.

const props = defineProps<{
  motion: WallpaperMotion;
  light: boolean;
}>();

// Tirage pseudo-aléatoire à graine fixe : les mêmes étoiles à chaque affichage
function random(seed: number) {
  let state = seed;

  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;

    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

// --- Aurore : grandes taches de couleur qui dérivent lentement

const AURORA_COLORS = {
  dark: [
    "rgb(40 220 150 / 0.75)",
    "rgb(0 170 255 / 0.65)",
    "rgb(150 70 255 / 0.7)",
    "rgb(255 60 130 / 0.5)",
  ],
  light: [
    "rgb(120 230 190 / 0.7)",
    "rgb(130 200 255 / 0.7)",
    "rgb(200 170 255 / 0.7)",
    "rgb(255 180 200 / 0.6)",
  ],
};

const auroraColors = computed(() => (props.light ? AURORA_COLORS.light : AURORA_COLORS.dark));

// --- Nuit étoilée : étoiles fixes, dont une partie scintille

const STAR_FIELD = { width: 1600, height: 1000 };

const stars = (() => {
  const next = random(2025);

  return Array.from({ length: 220 }, () => {
    const twinkle = next() < 0.35;

    return {
      x: Math.round(next() * STAR_FIELD.width),
      y: Math.round(next() * STAR_FIELD.height),
      r: Number((0.5 + next() ** 3 * 1.6).toFixed(2)),
      opacity: Number((0.35 + next() * 0.65).toFixed(2)),
      twinkle,
      style: twinkle
        ? {
            animationDuration: `${(3 + next() * 4).toFixed(1)}s`,
            animationDelay: `-${(next() * 6).toFixed(1)}s`,
          }
        : undefined,
    };
  });
})();

const starColor = computed(() => (props.light ? "rgb(70 80 150)" : "rgb(255 255 255)"));

// --- Vagues : couches de vagues qui défilent, chacune sur deux périodes pour boucler sans saut

const WAVE_PERIOD = 1440;
const WAVE_HEIGHT = 320;

function wavePath(base: number, amplitude: number, frequency: number, phase: number) {
  const points: string[] = [];

  for (let x = 0; x <= WAVE_PERIOD * 2; x += 24) {
    const angle = (x / WAVE_PERIOD) * frequency * Math.PI * 2 + phase;
    points.push(`${x},${(base + Math.sin(angle) * amplitude).toFixed(1)}`);
  }

  return `M0,${WAVE_HEIGHT} L${points.join(" L")} L${WAVE_PERIOD * 2},${WAVE_HEIGHT} Z`;
}

const WAVE_LAYERS = [
  {
    path: wavePath(150, 28, 2, 0),
    duration: "38s",
    dark: "rgb(0 122 255 / 0.25)",
    light: "rgb(120 190 255 / 0.35)",
  },
  {
    path: wavePath(190, 22, 3, 1.2),
    duration: "27s",
    dark: "rgb(0 199 190 / 0.25)",
    light: "rgb(140 225 230 / 0.4)",
  },
  {
    path: wavePath(230, 18, 2, 2.4),
    duration: "19s",
    dark: "rgb(88 86 214 / 0.35)",
    light: "rgb(170 175 255 / 0.4)",
  },
  {
    path: wavePath(265, 12, 4, 0.6),
    duration: "14s",
    dark: "rgb(4 30 70 / 0.6)",
    light: "rgb(255 255 255 / 0.55)",
  },
];
</script>

<template>
  <div :class="[motion, { light }]" aria-hidden="true" class="animated-wallpaper">
    <template v-if="motion === 'aurora'">
      <span
        v-for="(color, index) in auroraColors"
        :key="index"
        :class="`blob-${index + 1}`"
        :style="{ background: `radial-gradient(closest-side, ${color}, transparent)` }"
        class="blob" />
    </template>

    <template v-else-if="motion === 'stars'">
      <svg
        :fill="starColor"
        :viewBox="`0 0 ${STAR_FIELD.width} ${STAR_FIELD.height}`"
        class="star-field"
        preserveAspectRatio="xMidYMid slice">
        <circle
          v-for="(star, index) in stars"
          :key="index"
          :class="{ twinkle: star.twinkle }"
          :cx="star.x"
          :cy="star.y"
          :opacity="star.opacity"
          :r="star.r"
          :style="star.style" />
      </svg>
      <span class="shooting-star shooting-1" />
      <span class="shooting-star shooting-2" />
    </template>

    <template v-else>
      <div
        v-for="(layer, index) in WAVE_LAYERS"
        :key="index"
        :style="{ animationDuration: layer.duration }"
        class="wave">
        <svg :viewBox="`0 0 ${WAVE_PERIOD * 2} ${WAVE_HEIGHT}`" preserveAspectRatio="none">
          <path :d="layer.path" :fill="light ? layer.light : layer.dark" />
        </svg>
      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.animated-wallpaper {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

// --- Aurore

.blob {
  position: absolute;
  width: 90%;
  aspect-ratio: 1;
  border-radius: 50%;
  will-change: transform;
  animation: drift 32s ease-in-out infinite alternate;
}

.blob-1 {
  top: -35%;
  left: -20%;
}

.blob-2 {
  top: -20%;
  right: -30%;
  animation-duration: 41s;
  animation-delay: -12s;
  animation-direction: alternate-reverse;
}

.blob-3 {
  bottom: -50%;
  left: 10%;
  animation-duration: 37s;
  animation-delay: -20s;
}

.blob-4 {
  bottom: -40%;
  right: -25%;
  width: 70%;
  animation-duration: 29s;
  animation-delay: -6s;
  animation-direction: alternate-reverse;
}

@keyframes drift {
  0% {
    transform: translate(0, 0) scale(1);
  }

  33% {
    transform: translate(18%, 12%) scale(1.15);
  }

  66% {
    transform: translate(-10%, 20%) scale(0.9);
  }

  100% {
    transform: translate(12%, -8%) scale(1.05);
  }
}

// --- Nuit étoilée

.star-field {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.twinkle {
  animation: twinkle 5s ease-in-out infinite;
}

@keyframes twinkle {
  0%,
  100% {
    opacity: 0.15;
  }

  50% {
    opacity: 1;
  }
}

// Étoile filante : traînée qui traverse en diagonale, puis longue pause invisible
.shooting-star {
  position: absolute;
  width: 14%;
  height: 2px;
  border-radius: 1px;
  background: linear-gradient(90deg, transparent, rgb(255 255 255 / 0.9));
  opacity: 0;
  transform-origin: left center;
  will-change: transform, opacity;
  animation: shooting 13s ease-out infinite;
}

.shooting-1 {
  top: 12%;
  left: 62%;
}

.shooting-2 {
  top: 30%;
  left: 88%;
  animation-duration: 19s;
  animation-delay: -7s;
}

@keyframes shooting {
  0% {
    opacity: 0;
    transform: rotate(150deg) translateX(0);
  }

  1% {
    opacity: 1;
  }

  6% {
    opacity: 0;
    transform: rotate(150deg) translateX(260%);
  }

  100% {
    opacity: 0;
    transform: rotate(150deg) translateX(260%);
  }
}

.light .shooting-star {
  background: linear-gradient(90deg, transparent, rgb(70 80 150 / 0.8));
}

// --- Vagues

.wave {
  position: absolute;
  left: 0;
  bottom: 0;
  width: 200%;
  height: 45%;
  will-change: transform;
  animation: flow 20s linear infinite;

  svg {
    display: block;
    width: 100%;
    height: 100%;
  }
}

@keyframes flow {
  from {
    transform: translateX(0);
  }

  to {
    transform: translateX(-50%);
  }
}

// Image fixe : chaque élément reste à sa position de départ
@media (prefers-reduced-motion: reduce) {
  .blob,
  .twinkle,
  .wave {
    animation: none;
  }

  .shooting-star {
    display: none;
  }
}
</style>
