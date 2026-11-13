<script lang="ts" setup>
import { type PropType, ref, watch } from "vue";
import { EditorContent, useEditor } from "@tiptap/vue-3";
import { markdownExtensions } from "@/utils/markdown";
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

// Note affichée par TipTap en lecture seule, avec les mêmes extensions que son éditeur
// (utils/markdown.ts) : même rendu, et pas d'injection de HTML possible.
const editor = useEditor({
  content: props.settings.content,
  contentType: "markdown",
  editable: false,
  extensions: markdownExtensions(),
  // Texte en place dans la page : on peut vérifier qu'il tient
  onCreate: () => fit(),
});

// Pas d'ascenseur : texte réduit pour tenir (voir useFitContent)
const root = ref<HTMLElement | null>(null);

const { overflowing, fit } = useFitContent(root, [() => props.settings.content], {
  onFit: state => emit("fit", state),
});

function showContent(content: string) {
  editor.value?.commands.setContent(content, { contentType: "markdown", emitUpdate: false });
}

watch(() => props.settings.content, showContent);
</script>

<template>
  <div ref="root" :class="{ clipped: overflowing }" class="markdown">
    <editor-content :editor="editor" />
  </div>
</template>

<style lang="scss" scoped>
@use "@/assets/markdown";

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

  @include markdown.content;

  :deep(.ProseMirror > :last-child) {
    margin-bottom: 0;
  }
}
</style>
