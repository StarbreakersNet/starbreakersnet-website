<script lang="ts" setup>
import { computed, ref } from "vue";
import { renderMarkdown } from "@/lib/markdown";
import { type FitState, useFitContent } from "@/composables/useFitContent";
import type { MarkdownSettings } from "@/types/Widget";

const props = defineProps<{
  settings: MarkdownSettings;
}>();

const emit = defineEmits<{
  fit: [state: FitState];
}>();

const html = computed(() => renderMarkdown(props.settings.content));

// Pas d'ascenseur : texte réduit pour tenir (voir useFitContent)
const root = ref<HTMLElement | null>(null);
const { overflowing } = useFitContent(root, [html], {
  onFit: state => emit("fit", state),
});
</script>

<template>
  <!-- eslint-disable-next-line vue/no-v-html -- HTML nettoyé par DOMPurify (lib/markdown.ts) -->
  <div ref="root" :class="{ clipped: overflowing }" class="markdown" v-html="html" />
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
