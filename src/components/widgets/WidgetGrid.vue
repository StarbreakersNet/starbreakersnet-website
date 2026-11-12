<script lang="ts" setup>
import { nextTick, onBeforeUnmount, onMounted, type PropType, ref, watch } from "vue";
import { GridStack } from "gridstack";
import "gridstack/dist/gridstack.min.css";
import type { GridItem, GridPosition } from "@/types/Widget";

// Grille de Buroh, confiée à gridstack.js : cases carrées, glisser-déposer à la souris et au toucher.
// Au toucher, un widget se saisit par un appui long (300 ms) : un doigt qui glisse tout de suite fait
// défiler la page.
// Vue affiche les widgets ; gridstack les place. Les changements venus du store (ajout, suppression,
// nouvelle taille) lui sont transmis ici, et ses glisser-déposer remontent par l'événement « moved ».

const props = defineProps({
  items: {
    type: Array as PropType<GridItem[]>,
    required: true,
  },
  columns: {
    type: Number,
    required: true,
  },
  // Espace entre deux widgets, en pixels
  gap: {
    type: Number,
    required: true,
  },
  editable: {
    type: Boolean,
    default: false,
  },
  // Widgets réordonnés comme une liste, à la manière de l'écran d'accueil d'un téléphone (mobile),
  // ou laissés où on les pose (ordinateur)
  list: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits<{
  (e: "moved", positions: GridPosition[]): void;
}>();

const root = ref<HTMLElement | null>(null);
const elements = new Map<string, HTMLElement>();

let grid: GridStack | null = null;

// Widgets tels que gridstack les connaît
let known = new Map<string, GridItem>();

function setElement(id: string, element: unknown) {
  if (element instanceof HTMLElement) {
    elements.set(id, element);
  } else {
    elements.delete(id);
  }
}

function samePlace(a: GridItem, b: GridItem) {
  return a.x === b.x && a.y === b.y && a.w === b.w && a.h === b.h;
}

function remember(items: GridItem[]) {
  known = new Map(items.map(item => [item.id, { ...item }]));
}

function createGrid(element: HTMLElement) {
  return GridStack.init(
    {
      column: props.columns,
      // Cases carrées, recalculées avec la largeur de la page
      cellHeight: "auto",
      margin: props.gap / 2,
      mode: props.list ? "list" : "float",
      animate: true,
      disableResize: true,
      staticGrid: !props.editable,
      // Boutons du cadre (supprimer, régler) cliquables sans déplacer le widget
      draggable: { cancel: "button, a, input, textarea, select, .no-drag" },
    },
    element
  );
}

// Fin d'un glisser-déposer : positions de tous les widgets, poussés compris
function onDragStop() {
  const nodes = grid?.engine.nodes ?? [];

  const positions = nodes.map(node => ({
    id: String(node.id),
    x: node.x ?? 0,
    y: node.y ?? 0,
  }));

  for (const { id, x, y } of positions) {
    const item = known.get(id);

    if (item) {
      known.set(id, { ...item, x, y });
    }
  }

  emit("moved", positions);
}

// Changements du store. Avant la mise à jour du DOM : retrait des widgets supprimés, tant que leurs
// éléments existent. Après : ajout des nouveaux et déplacement des autres.
async function sync(items: GridItem[]) {
  const next = new Map(items.map(item => [item.id, item]));

  for (const id of known.keys()) {
    const element = elements.get(id);

    if (grid && element && !next.has(id)) {
      grid.removeWidget(element, false, false);
    }
  }

  await nextTick();

  if (grid) {
    grid.batchUpdate();

    for (const item of items) {
      const element = elements.get(item.id);
      const previous = known.get(item.id);

      if (element && !previous) {
        grid.makeWidget(element, { ...item });
      }

      if (element && previous && !samePlace(previous, item)) {
        grid.update(element, { x: item.x, y: item.y, w: item.w, h: item.h });
      }
    }

    grid.batchUpdate(false);
    remember(items);
  }
}

watch(
  () => props.editable,
  editable => grid?.setStatic(!editable)
);

watch(() => props.items, sync, { deep: true });

onMounted(() => {
  grid = root.value ? createGrid(root.value) : null;

  if (grid) {
    remember(props.items);
    grid.on("dragstop", onDragStop);
  }
});

onBeforeUnmount(() => {
  grid?.destroy(false);
  grid = null;
});
</script>

<template>
  <div ref="root" class="grid-stack">
    <div
      v-for="item in props.items"
      :key="item.id"
      :ref="element => setElement(item.id, element)"
      :gs-h="item.h"
      :gs-id="item.id"
      :gs-w="item.w"
      :gs-x="item.x"
      :gs-y="item.y"
      class="grid-stack-item">
      <div class="grid-stack-item-content">
        <slot :id="item.id" name="item" />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.grid-stack {
  // Ombre et boutons du cadre visibles : le contenu des widgets gère lui-même ce qui dépasse
  :deep(.grid-stack-item-content) {
    overflow: visible;
  }

  :deep(.grid-stack-placeholder > .placeholder-content) {
    background: rgb(255 255 255 / 0.18);
    border-radius: var(--glass-radius);
  }

  // Widget saisi : ombre plus portée. Pas de transform : il décalerait la miniature floue du fond
  // (background-attachment: fixed).
  :deep(.ui-draggable-dragging .widget) {
    box-shadow: 0 24px 48px rgb(0 0 0 / 0.35);
  }
}
</style>
