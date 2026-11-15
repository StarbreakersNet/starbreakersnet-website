<script lang="ts" setup>
import { useSizeTransition, type SizeTransitionMode } from "@/composables/useSizeTransition";

defineOptions({ inheritAttrs: false });

const { mode = "height", raw = false } = defineProps<{
  /** Dimension animée à l'entrée et à la sortie */
  mode?: SizeTransitionMode;
  /** Sans animation de la taille : seule la transition CSS de `name` s'applique */
  raw?: boolean;
}>();

const {
  handleBeforeEnter,
  handleEnter,
  handleAfterEnter,
  handleBeforeLeave,
  handleLeave,
  handleAfterLeave,
} = useSizeTransition(
  () => mode,
  () => raw
);
</script>

<template>
  <transition
    v-bind="$attrs"
    @before-enter="handleBeforeEnter"
    @enter="handleEnter"
    @after-enter="handleAfterEnter"
    @before-leave="handleBeforeLeave"
    @leave="handleLeave"
    @after-leave="handleAfterLeave">
    <slot></slot>
  </transition>
</template>
