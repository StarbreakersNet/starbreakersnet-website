<script lang="ts" setup>
import { defineAsyncComponent, type PropType } from "vue";
import HForm from "@/components/c/hForm.vue";
import HFormItem from "@/components/c/hFormItem.vue";
import { MARKDOWN_MAX_LENGTH } from "@/models/widgets";
import type { MarkdownSettings } from "@/types/Widget";

// Éditeur chargé à la demande : TipTap ne pèse que sur l'ouverture des réglages d'une note
const NoteEditor = defineAsyncComponent(() => import("@/components/widgets/NoteEditor.vue"));

const settings = defineModel("settings", {
  type: Object as PropType<MarkdownSettings>,
  required: true,
});

function updateContent(content: string) {
  settings.value = { ...settings.value, content };
}
</script>

<template>
  <h-form :model="settings" label-placement="top">
    <h-form-item label="Texte">
      <note-editor
        :max-length="MARKDOWN_MAX_LENGTH"
        :model-value="settings.content"
        class="editor"
        @update:model-value="updateContent" />
    </h-form-item>
  </h-form>
</template>

<style lang="scss" scoped>
.editor {
  width: 100%;
}
</style>
