<script lang="ts" setup>
import { reactive } from "vue";
import { WIDGET_DEFINITIONS, WIDGET_SIZES, WIDGET_TYPES } from "@/models/widgets";
import type { WidgetSize, WidgetType } from "@/types/Widget";

// Galerie du mode édition, comme celle des widgets de macOS : un type, une taille, Ajouter
const emit = defineEmits<{
  add: [type: WidgetType, size: WidgetSize];
}>();

const selectedSizes = reactive(
  Object.fromEntries(
    WIDGET_TYPES.map(type => [type, WIDGET_DEFINITIONS[type].defaultSize])
  ) as Record<WidgetType, WidgetSize>
);
</script>

<template>
  <section aria-label="Ajouter un widget" class="gallery liquid-glass liquid-glass--overlay">
    <h2 class="title">Ajouter un widget</h2>
    <ul class="items">
      <li v-for="type in WIDGET_TYPES" :key="type" class="item">
        <div class="icon">
          <font-awesome-icon :icon="WIDGET_DEFINITIONS[type].icon" />
        </div>
        <div class="text">
          <span class="label">{{ WIDGET_DEFINITIONS[type].label }}</span>
          <span class="description">{{ WIDGET_DEFINITIONS[type].description }}</span>
        </div>
        <div aria-label="Taille" class="sizes" role="radiogroup">
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
            <span
              :style="{
                width: `${WIDGET_SIZES[size].w * 5}px`,
                height: `${WIDGET_SIZES[size].h * 5}px`,
              }"
              class="shape" />
          </button>
        </div>
        <button
          class="glass-button add"
          type="button"
          @click="emit('add', type, selectedSizes[type])">
          <font-awesome-icon icon="plus" />
          Ajouter
        </button>
      </li>
    </ul>
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

.items {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 10px;
  padding: 0;
  list-style: none;
}

.item {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  grid-template-areas:
    "icon text text"
    "sizes sizes add";
  align-items: center;
  gap: 10px 12px;
  padding: 12px;
  border-radius: 16px;
  background: var(--glass-control);
}

.icon {
  grid-area: icon;
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
  grid-area: text;
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

.sizes {
  grid-area: sizes;
  display: flex;
  gap: 6px;
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

.add {
  grid-area: add;
  justify-self: end;
}
</style>
