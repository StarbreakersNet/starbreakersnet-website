<script lang="ts" setup>
import { computed } from "vue";
import { renderMarkdown } from "@/lib/markdown";
import type { MarkdownSettings } from "@/types/Widget";

const props = defineProps<{
  settings: MarkdownSettings;
}>();

const html = computed(() => renderMarkdown(props.settings.content));
</script>

<template>
  <!-- eslint-disable-next-line vue/no-v-html -- HTML nettoyé par DOMPurify -->
  <div class="markdown" v-html="html" />
</template>

<style lang="scss" scoped>
.markdown {
  width: 100%;
  height: 100%;
  padding: 16px 18px;
  overflow-y: auto;
  scrollbar-width: thin;
  line-height: 1.45;
  font-size: 0.95rem;
  color: var(--glass-text);
  overflow-wrap: anywhere;

  :deep(h1),
  :deep(h2),
  :deep(h3) {
    margin: 0 0 0.4em;
    font-weight: 700;
    line-height: 1.2;
    color: var(--glass-text);
  }

  :deep(h1) {
    font-size: 1.4rem;
  }

  :deep(h2) {
    font-size: 1.15rem;
  }

  :deep(h3) {
    font-size: 1rem;
  }

  :deep(p),
  :deep(ul),
  :deep(ol),
  :deep(blockquote),
  :deep(pre) {
    margin: 0 0 0.6em;
  }

  :deep(ul),
  :deep(ol) {
    padding-left: 1.3em;
  }

  :deep(ul) {
    list-style: disc;
  }

  :deep(ol) {
    list-style: decimal;
  }

  :deep(strong) {
    font-weight: 700;
  }

  :deep(em) {
    font-style: italic;
  }

  :deep(a) {
    color: rgb(10 132 255);
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  :deep(code) {
    padding: 0.1em 0.35em;
    border-radius: 6px;
    background: var(--glass-control);
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 0.88em;
  }

  :deep(pre) {
    padding: 0.6em 0.8em;
    border-radius: 10px;
    background: var(--glass-control);
    overflow-x: auto;

    code {
      padding: 0;
      background: none;
    }
  }

  :deep(blockquote) {
    padding-left: 0.8em;
    border-left: 3px solid var(--glass-separator);
    color: var(--glass-text-soft);
  }

  :deep(hr) {
    margin: 0.8em 0;
    border: none;
    border-top: 1px solid var(--glass-separator);
  }

  :deep(> :last-child) {
    margin-bottom: 0;
  }
}
</style>
