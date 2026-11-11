<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { GridLayout } from "grid-layout-plus";
import WidgetFrame from "@/components/widgets/WidgetFrame.vue";
import WidgetGallery from "@/components/widgets/WidgetGallery.vue";
import WidgetSettingsModal from "@/components/widgets/WidgetSettingsModal.vue";
import { WIDGET_COMPONENTS } from "@/components/widgets/registry";
import { GRID_COLUMNS, WIDGET_DEFINITIONS, WIDGET_SIZES } from "@/models/widgets";
import { useWidgetsStore } from "@/stores/widgets";
import type { FitState } from "@/composables/useFitContent";
import type { Widget, WidgetSize, WidgetType } from "@/types/Widget";

// Bureau à widgets, à la manière de macOS : grille libre où l'on place et règle ses widgets.
// Sur petit écran, les widgets s'empilent sur deux colonnes, sans glisser-déposer.

const GAP = 16;
const MOBILE_QUERY = "(max-width: 720px)";

const store = useWidgetsStore();

const editing = ref(false);
const configuredId = ref<string | null>(null);

// --- Petit écran

const mobileQuery = window.matchMedia(MOBILE_QUERY);
const isMobile = ref(mobileQuery.matches);
const onMobileChange = (event: MediaQueryListEvent) => (isMobile.value = event.matches);
onMounted(() => mobileQuery.addEventListener("change", onMobileChange));
onBeforeUnmount(() => mobileQuery.removeEventListener("change", onMobileChange));

// Ordre de lecture : de haut en bas, puis de gauche à droite
const stacked = computed(() => [...store.widgets].sort((a, b) => a.y - b.y || a.x - b.x));

// --- Grille : cases carrées, dont la taille suit la largeur de la page

const gridWrapper = ref<HTMLElement | null>(null);
const cellSize = ref(80);
const resizeObserver = new ResizeObserver(([entry]) => {
  const width = entry?.contentRect.width ?? 0;
  if (width > 0) {
    cellSize.value = (width - GAP * (GRID_COLUMNS + 1)) / GRID_COLUMNS;
  }
});
watch(gridWrapper, (element, previous) => {
  if (previous) resizeObserver.unobserve(previous);
  if (element) resizeObserver.observe(element);
});
onBeforeUnmount(() => resizeObserver.disconnect());

interface LayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

function toLayout(widgets: Widget[]): LayoutItem[] {
  return widgets.map(widget => ({
    i: widget.id,
    x: widget.x,
    y: widget.y,
    ...WIDGET_SIZES[widget.size],
  }));
}

// Copie modifiée par la grille pendant le glisser-déposer, reconstruite quand le store change
const layout = ref<LayoutItem[]>(toLayout(store.widgets));
const signature = (items: LayoutItem[]) =>
  items.map(({ i, x, y, w, h }) => `${i}:${x},${y},${w}x${h}`).join("|");

watch(
  () => toLayout(store.widgets),
  next => {
    if (signature(next) !== signature(layout.value)) {
      layout.value = next;
    }
  },
  { deep: true }
);

const widgetsById = computed(() => new Map(store.widgets.map(widget => [widget.id, widget])));

function onLayoutUpdated(items: LayoutItem[]) {
  store.move(items.map(({ i, x, y }) => ({ id: i, x, y })));
}

// --- Édition

function addWidget(type: WidgetType, size: WidgetSize) {
  const widget = store.add(type, size);
  // Un widget sans contenu par défaut s'ouvre directement sur ses réglages
  if (type === "links") {
    configuredId.value = widget.id;
  }
}

function closeSettings() {
  configuredId.value = null;
  store.stopGrowing();
}

function toggleEditing() {
  editing.value = !editing.value;
  if (!editing.value) {
    configuredId.value = null;
  }
}
</script>

<template>
  <main :class="{ editing }" class="desktop">
    <div aria-hidden="true" class="wallpaper" />

    <div v-if="isMobile" class="stack">
      <div
        v-for="widget in stacked"
        :key="widget.id"
        :class="`size-${widget.size}`"
        class="stack-item">
        <widget-frame
          :editing="editing"
          :label="WIDGET_DEFINITIONS[widget.type].label"
          @configure="configuredId = widget.id"
          @remove="store.remove(widget.id)">
          <component
            :is="WIDGET_COMPONENTS[widget.type].view"
            :settings="widget.settings"
            :size="widget.size"
            @fit="(state: FitState) => store.growIfCramped(widget.id, state)" />
        </widget-frame>
      </div>
    </div>

    <div v-else ref="gridWrapper" class="grid">
      <grid-layout
        v-model:layout="layout"
        :col-num="GRID_COLUMNS"
        :is-draggable="editing"
        :is-resizable="false"
        :margin="[GAP, GAP]"
        :prevent-collision="true"
        :row-height="cellSize"
        :vertical-compact="false"
        @layout-updated="onLayoutUpdated">
        <template #item="{ item }">
          <widget-frame
            v-if="widgetsById.get(String(item.i))"
            :editing="editing"
            :label="WIDGET_DEFINITIONS[widgetsById.get(String(item.i))!.type].label"
            @configure="configuredId = String(item.i)"
            @remove="store.remove(String(item.i))">
            <component
              :is="WIDGET_COMPONENTS[widgetsById.get(String(item.i))!.type].view"
              :settings="widgetsById.get(String(item.i))!.settings"
              :size="widgetsById.get(String(item.i))!.size"
              @fit="(state: FitState) => store.growIfCramped(String(item.i), state)" />
          </widget-frame>
        </template>
      </grid-layout>
    </div>

    <div class="dock">
      <transition name="slide-up">
        <widget-gallery v-if="editing" @add="addWidget" />
      </transition>
      <div class="toolbar liquid-glass liquid-glass--overlay">
        <n-popconfirm
          v-if="editing"
          negative-text="Annuler"
          positive-text="Réinitialiser"
          @positive-click="store.reset()">
          <template #trigger>
            <button class="glass-button" type="button">
              <font-awesome-icon icon="rotate-left" />
              Réinitialiser
            </button>
          </template>
          Remplacer vos widgets par ceux d'origine ?
        </n-popconfirm>
        <button
          :class="{ primary: editing }"
          class="glass-button"
          type="button"
          @click="toggleEditing">
          <font-awesome-icon :icon="editing ? 'check' : 'pen'" />
          {{ editing ? "Terminé" : "Modifier les widgets" }}
        </button>
      </div>
    </div>

    <widget-settings-modal :widget-id="configuredId" @close="closeSettings" />
  </main>
</template>

<style lang="scss" scoped>
.desktop {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  max-width: 1320px;
  flex: 1;
  margin: 0 auto;
}

// Fond d'écran : dégradés aux couleurs du site, derrière le verre des widgets
.wallpaper {
  position: fixed;
  inset: 0;
  z-index: -1;
  background:
    radial-gradient(60% 50% at 15% 20%, rgb(190 30 45 / 0.85), transparent 70%),
    radial-gradient(50% 45% at 85% 25%, rgb(120 40 160 / 0.75), transparent 70%),
    radial-gradient(55% 50% at 70% 85%, rgb(255 120 60 / 0.55), transparent 70%),
    radial-gradient(45% 40% at 20% 85%, rgb(60 20 120 / 0.8), transparent 70%), rgb(41 0 5);

  :root[data-theme="light"] & {
    background:
      radial-gradient(60% 50% at 15% 20%, rgb(255 160 170 / 0.9), transparent 70%),
      radial-gradient(50% 45% at 85% 25%, rgb(200 170 255 / 0.85), transparent 70%),
      radial-gradient(55% 50% at 70% 85%, rgb(255 205 150 / 0.85), transparent 70%),
      radial-gradient(45% 40% at 20% 85%, rgb(170 190 255 / 0.8), transparent 70%), rgb(250 238 240);
  }
}

.grid {
  flex: 1;
  // La grille ajoute un espace autour des widgets : on le reprend sur les marges de la page (1em)
  margin: -16px -1em 0;

  :deep(.vgl-layout) {
    --vgl-placeholder-bg: rgb(255 255 255);
    --vgl-placeholder-opacity: 18%;
  }

  :deep(.vgl-item--placeholder) {
    border-radius: var(--glass-radius);
  }

  :deep(.vgl-item--dragging) {
    transform: scale(1.03);

    .widget {
      box-shadow: 0 24px 48px rgb(0 0 0 / 0.35);
    }
  }
}

.stack {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;

  .stack-item {
    aspect-ratio: 1;

    &.size-medium {
      grid-column: span 2;
      aspect-ratio: 2.1;
    }

    &.size-large {
      grid-column: span 2;
    }
  }
}

.dock {
  position: sticky;
  bottom: 16px;
  z-index: 20;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin-top: auto;
  pointer-events: none;

  > * {
    pointer-events: auto;
  }

  .gallery {
    width: min(100%, 980px);
  }
}

.toolbar {
  --glass-radius: 999px;
  display: flex;
  gap: 8px;
  padding: 6px;

  .glass-button.primary {
    color: white;
    background: rgb(10 132 255);

    &:hover {
      background: rgb(64 156 255);
    }
  }
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition:
    transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1),
    opacity 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(24px);
  opacity: 0;
}
</style>
