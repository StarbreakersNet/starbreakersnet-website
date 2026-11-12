<script lang="ts" setup>
import { defineAsyncComponent } from "vue";
import { MARKDOWN_MAX_LENGTH } from "@/models/widgets";
import type { MarkdownSettings } from "@/types/Widget";

// Éditeur chargé à la demande : TipTap ne pèse que sur l'ouverture des réglages d'une note
const NoteEditor = defineAsyncComponent(() => import("@/components/widgets/NoteEditor.vue"));

const settings = defineModel<MarkdownSettings>("settings", { required: true });
</script>

<template>
  <n-form label-placement="top">
    <n-form-item label="Texte">
      <note-editor
        :max-length="MARKDOWN_MAX_LENGTH"
        :model-value="settings.content"
        class="editor"
        @update:model-value="(content: string) => (settings = { ...settings, content })" />
    </n-form-item>
  </n-form>
</template>

<style lang="scss" scoped>
.editor {
  width: 100%;
}
</style>
