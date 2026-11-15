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
  <transition-group
    v-bind="$attrs"
    @before-enter="handleBeforeEnter($event)"
    @enter="handleEnter($event)"
    @after-enter="handleAfterEnter($event)"
    @before-leave="handleBeforeLeave($event)"
    @leave="handleLeave($event)"
    @after-leave="handleAfterLeave($event)">
    <slot></slot>
  </transition-group>
</template>
