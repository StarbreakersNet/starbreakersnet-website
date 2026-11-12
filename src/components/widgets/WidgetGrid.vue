<script lang="ts" setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { GridStack } from "gridstack";
import "gridstack/dist/gridstack.min.css";

// Grille de Buroh, confiée à gridstack.js : cases carrées, glisser-déposer à la souris et au toucher.
// Au toucher, un widget se saisit par un appui long (300 ms) : un doigt qui glisse tout de suite fait
// défiler la page.
// Vue affiche les widgets ; gridstack les place. Les changements venus du store (ajout, suppression,
// nouvelle taille) lui sont transmis ici, et ses glisser-déposer remontent par l'événement « moved ».

export interface GridItem {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

const props = defineProps<{
  items: GridItem[];
  columns: number;
  // Espace entre deux widgets, en pixels
  gap: number;
  editable: boolean;
  // Widgets réordonnés comme une liste, à la manière de l'écran d'accueil d'un téléphone (mobile),
  // ou laissés où on les pose (ordinateur)
  list?: boolean;
}>();

const emit = defineEmits<{
  moved: [positions: { id: string; x: number; y: number }[]];
}>();

defineSlots<{
  item(props: { id: string }): unknown;
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

const same = (a: GridItem, b: GridItem) => a.x === b.x && a.y === b.y && a.w === b.w && a.h === b.h;

onMounted(() => {
  if (!root.value) return;

  const instance = GridStack.init(
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
    root.value
  );
  if (!instance) return;
  grid = instance;
  known = new Map(props.items.map(item => [item.id, { ...item }]));

  instance.on("dragstop", () => {
    const positions = instance.engine.nodes.map(node => ({
      id: String(node.id),
      x: node.x ?? 0,
      y: node.y ?? 0,
    }));
    positions.forEach(({ id, x, y }) => {
      const item = known.get(id);
      if (item) known.set(id, { ...item, x, y });
    });
    emit("moved", positions);
  });
});

onBeforeUnmount(() => {
  // Vue retire lui-même les éléments
  grid?.destroy(false);
  grid = null;
});

watch(
  () => props.editable,
  editable => grid?.setStatic(!editable)
);

// Changements du store. Avant la mise à jour du DOM : retrait des widgets supprimés, tant que leurs
// éléments existent. Après : ajout des nouveaux et déplacement des autres.
watch(
  () => props.items,
  async items => {
    if (!grid) return;
    const next = new Map(items.map(item => [item.id, item]));

    for (const id of known.keys()) {
      const element = elements.get(id);
      if (!next.has(id) && element) {
        grid.removeWidget(element, false, false);
      }
    }

    await nextTick();
    if (!grid) return;

    grid.batchUpdate();
    for (const item of items) {
      const element = elements.get(item.id);
      const previous = known.get(item.id);
      if (!element) continue;

      if (!previous) {
        grid.makeWidget(element, { ...item });
      } else if (!same(previous, item)) {
        grid.update(element, { x: item.x, y: item.y, w: item.w, h: item.h });
      }
    }
    grid.batchUpdate(false);
    known = new Map(items.map(item => [item.id, { ...item }]));
  },
  { deep: true }
);
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
