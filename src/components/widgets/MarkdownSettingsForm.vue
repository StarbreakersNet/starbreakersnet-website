<script lang="ts" setup>
import { MARKDOWN_MAX_LENGTH } from "@/models/widgets";
import type { MarkdownSettings } from "@/types/Widget";

const settings = defineModel<MarkdownSettings>("settings", { required: true });

const SYNTAX = ["# Titre", "**gras**", "*italique*", "- liste", "[lien](https://…)", "`code`"];
</script>

<template>
  <n-form label-placement="top">
    <n-form-item label="Texte">
      <n-input
        :autosize="{ minRows: 8, maxRows: 18 }"
        :maxlength="MARKDOWN_MAX_LENGTH"
        :value="settings.content"
        placeholder="# Titre&#10;&#10;Du texte en **gras**, une liste :&#10;- premier point&#10;- [un lien](https://exemple.fr)"
        show-count
        type="textarea"
        @update:value="(content: string) => (settings = { ...settings, content })" />
    </n-form-item>
    <n-text class="hint" depth="3">
      Mise en forme Markdown :
      <code v-for="syntax in SYNTAX" :key="syntax">{{ syntax }}</code>
    </n-text>
  </n-form>
</template>

<style lang="scss" scoped>
.hint code {
  margin-left: 0.4em;
}
</style>
