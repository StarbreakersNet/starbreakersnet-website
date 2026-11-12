<script lang="ts" setup>
import { reactive } from "vue";
import HFlex from "@/components/c/hFlex.vue";
import HGrid from "@/components/c/hGrid.vue";
import HGridItem from "@/components/c/hGridItem.vue";
import { WIDGET_DEFINITIONS, WIDGET_SIZES, WIDGET_TYPES } from "@/models/widgets";
import type { WidgetSize, WidgetType } from "@/types/Widget";

// Galerie du mode édition, comme celle des widgets de macOS : un type, une taille, Ajouter.
// Boutons en verre (glass.scss) plutôt que ceux de Naive UI, pour rester dans le style Liquid Glass.

const emit = defineEmits<{
  (e: "add", type: WidgetType, size: WidgetSize): void;
}>();

// Une carte par colonne sur mobile, jusqu'à trois sur un grand écran
const COLUMNS = "1 500:2 760:3";

// Taille choisie pour chaque type, la taille par défaut au départ
const defaultSizes = WIDGET_TYPES.map(type => [type, WIDGET_DEFINITIONS[type].defaultSize]);

const selectedSizes = reactive(Object.fromEntries(defaultSizes) as Record<WidgetType, WidgetSize>);

function shapeStyle(size: WidgetSize) {
  const { w, h } = WIDGET_SIZES[size];

  return { width: `${w * 5}px`, height: `${h * 5}px` };
}
</script>

<template>
  <section aria-label="Ajouter un widget" class="gallery liquid-glass liquid-glass--overlay">
    <h2 class="title">Ajouter un widget</h2>
    <h-grid :cols="COLUMNS" :x-gap="10" :y-gap="10" responsive="self" role="list">
      <h-grid-item v-for="type in WIDGET_TYPES" :key="type" role="listitem">
        <h-flex :size="10" class="item" vertical>
          <h-flex :size="12" :wrap="false">
            <div class="icon">
              <font-awesome-icon :icon="WIDGET_DEFINITIONS[type].icon" />
            </div>
            <div class="text">
              <span class="label">{{ WIDGET_DEFINITIONS[type].label }}</span>
              <span class="description">{{ WIDGET_DEFINITIONS[type].description }}</span>
            </div>
          </h-flex>
          <h-flex justify="space-between">
            <h-flex :size="6" aria-label="Taille" role="radiogroup">
              <button
                v-for="size in WIDGET_DEFINITIONS[type].sizes"
                :key="size"
                :aria-checked="selectedSizes[type] === size"
                :class="{ selected: selectedSizes[type] === size }"
                :title="WIDGET_SIZES[size].label"
                class="size"
                role="radio"
                type="button"
                @click="selectedSizes[type] = size">
                <span :style="shapeStyle(size)" class="shape" />
              </button>
            </h-flex>
            <button
              class="glass-button"
              type="button"
              @click="emit('add', type, selectedSizes[type])">
              <font-awesome-icon icon="plus" />
              Ajouter
            </button>
          </h-flex>
        </h-flex>
      </h-grid-item>
    </h-grid>
  </section>
</template>

<style lang="scss" scoped>
.gallery {
  --glass-radius: 22px;
  padding: 14px 16px 16px;
}

.title {
  margin-bottom: 10px;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--glass-text-soft);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.item {
  height: 100%;
  padding: 12px;
  border-radius: 16px;
  background: var(--glass-control);
}

.icon {
  flex: none;
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 11px;
  color: white;
  background: linear-gradient(135deg, rgb(255 69 58), rgb(175 30 90));
  font-size: 1.1rem;
}

.text {
  display: flex;
  flex-direction: column;
  line-height: 1.25;

  .label {
    font-weight: 600;
    color: var(--glass-text);
  }

  .description {
    font-size: 0.82rem;
    color: var(--glass-text-soft);
  }
}

.size {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border: 1px solid transparent;
  border-radius: 9px;
  background: none;
  cursor: pointer;

  .shape {
    border-radius: 3px;
    background: var(--glass-text-soft);
  }

  &.selected {
    border-color: var(--glass-separator);
    background: var(--glass-control-hover);

    .shape {
      background: var(--glass-text);
    }
  }
}
</style>
