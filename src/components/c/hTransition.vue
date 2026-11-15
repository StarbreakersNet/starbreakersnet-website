<script lang="ts" setup>
import { computed, nextTick } from "vue";

type ModeType = "width" | "height";

const { mode = "height", raw = false } = defineProps<{
  mode?: ModeType;
  raw?: boolean;
}>();

const elementSizes = new Map<string, number>();
const maxDimension = computed(() => `max-${mode}`);
let transitionId = 0;

function generateTransitionId() {
  return `transition-${++transitionId}-${Date.now()}`;
}

function getElementId(el: HTMLElement) {
  if (!el.dataset.transitionId) {
    el.dataset.transitionId = generateTransitionId();
  }
  return el.dataset.transitionId;
}

function getNaturalSize(el: HTMLElement) {
  return mode === "width" ? el.scrollWidth : el.scrollHeight;
}

async function beforeEnter(el: Element) {
  const element = el as HTMLElement;

  if (mode != null && !raw) {
    await nextTick();
    const naturalSize = getNaturalSize(element);

    element.style.setProperty(maxDimension.value, "none");
    element.style.visibility = "hidden";

    elementSizes.set(getElementId(element), naturalSize);

    element.style.setProperty(maxDimension.value, "0");
    element.style.visibility = "visible";
  }
}

async function enter(el: Element) {
  const element = el as HTMLElement;

  if (mode != null && !raw) {
    await nextTick();
    const naturalSize = elementSizes.get(getElementId(element));

    if (naturalSize) {
      void element.offsetHeight; // Forcer un reflow

      element.style.setProperty(maxDimension.value, naturalSize + "px");
      element.style.overflow = "hidden";
    }
  }
}

async function afterEnter(el: Element) {
  const element = el as HTMLElement;

  if (mode != null && !raw) {
    await nextTick();

    element.style.setProperty(maxDimension.value, "");
    element.style.overflow = "";

    elementSizes.delete(getElementId(element));

    delete element.dataset.transitionId;
  }
}

async function beforeLeave(el: Element) {
  const element = el as HTMLElement;

  if (mode != null && !raw) {
    await nextTick();
    const naturalSize = getNaturalSize(element);

    elementSizes.set(getElementId(element), naturalSize);

    element.style.setProperty(maxDimension.value, naturalSize + "px");
    element.style.overflow = "hidden";
  }
}

async function leave(el: Element) {
  const element = el as HTMLElement;

  if (mode != null && !raw) {
    await nextTick();

    void element.offsetHeight; // Forcer un reflow

    element.style.setProperty(maxDimension.value, "0");
  }
}

async function afterLeave(el: Element) {
  const element = el as HTMLElement;

  if (mode != null && !raw) {
    await nextTick();

    element.style.setProperty(maxDimension.value, "");
    element.style.overflow = "";

    elementSizes.delete(getElementId(element));

    delete element.dataset.transitionId;
  }
}
</script>

<template>
  <transition
    v-bind="$attrs"
    @enter="enter"
    @leave="leave"
    @before-enter="beforeEnter"
    @after-enter="afterEnter"
    @before-leave="beforeLeave"
    @after-leave="afterLeave">
    <slot></slot>
  </transition>
</template>
