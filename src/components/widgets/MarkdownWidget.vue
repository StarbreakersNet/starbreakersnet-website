<script lang="ts" setup>
import { type PropType, ref } from "vue";
import { vMarkdown } from "@/directives/vMarkdown";
import { type FitState, useFitContent } from "@/composables/useFitContent";
import type { MarkdownSettings } from "@/types/Widget";

const props = defineProps({
  settings: {
    type: Object as PropType<MarkdownSettings>,
    required: true,
  },
});

const emit = defineEmits<{
  (e: "fit", state: FitState): void;
}>();

// Pas d'ascenseur : texte réduit pour tenir (voir useFitContent)
const root = ref<HTMLElement | null>(null);

const { overflowing } = useFitContent(root, [() => props.settings.content], {
  onFit: state => emit("fit", state),
});
</script>

<template>
  <div
    ref="root"
    v-markdown="props.settings.content"
    :class="{ clipped: overflowing }"
    class="markdown" />
</template>

<style lang="scss" scoped>
@use "@/assets/markdown" as *;

.markdown {
  width: 100%;
  height: 100%;
  padding: 16px 18px;
  overflow: hidden;
  line-height: 1.45;
  font-size: calc(var(--fit, 1) * 0.95rem);
  color: var(--glass-text);
  overflow-wrap: anywhere;

  // Trop long même réduit : la fin s'estompe au lieu d'afficher un ascenseur
  &.clipped {
    mask-image: linear-gradient(to bottom, #000 80%, transparent);
  }

  @include markdown-content;

  :deep(> :last-child) {
    margin-bottom: 0;
  }
}
</style>
