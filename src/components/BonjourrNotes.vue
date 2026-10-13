<script lang="ts" setup>
// Fork natif TypeScript de Bonjourr : bloc-notes de la page.
// Conteneur et comportement repris de Bonjourr/src/scripts/features/notes.ts :
// classes d'alignement et `hidden` (l.81-87), variables `--notes-width` et
// `--notes-background` posées sur la racine du document (l.89-100), éditeur
// contenteditable `#pocket-editor` (l.75).
import { computed, ref, watch } from "vue";
import {
  NOTES_FALLBACK_BACKGROUND,
  alignClasses,
  isOpaqueBackground,
  notesDefaultText,
  renderNotesMarkdown,
} from "@/bonjourr/notes";
import { useBonjourrStore } from "@/stores/bonjourr";

const settings = useBonjourrStore();
const editor = ref<HTMLDivElement | null>(null);
const editing = ref(false);

const text = computed(() => {
  // notes.ts l.73 : le gabarit traduit n'est posé qu'en l'absence de texte.
  const value = settings.config.notes.text;
  return value === "" ? notesDefaultText(settings.config.lang || "fr") : value;
});

const rendered = computed(() => renderNotesMarkdown(text.value));

const containerClasses = computed(() => [
  alignClasses(settings.config.notes.align),
  {
    hidden: !settings.config.notes.on,
    opaque: isOpaqueBackground(settings.config.notes.background),
    editing: editing.value,
  },
]);

// `handleWidth` (l.89-93) ne pose la largeur que si elle existe, `handleBackground`
// (l.95-100) pose toujours la sienne, avec le fond par défaut.
watch(
  () => [settings.config.notes.width, settings.config.notes.background],
  () => {
    const { width, background } = settings.config.notes;
    if (width) {
      document.documentElement.style.setProperty("--notes-width", `${width}em`);
    }
    document.documentElement.style.setProperty(
      "--notes-background",
      background ?? NOTES_FALLBACK_BACKGROUND,
    );
  },
  { immediate: true },
);

// Écart assumé : l'original déboucle l'écriture (`eventDebounce`, l.58) ; le fork
// enregistre à chaque frappe, le texte restant de la taille d'une prise de notes.
function onInput() {
  settings.patch({ notes: { text: editor.value?.textContent ?? "" } });
}

function onFocus() {
  editing.value = true;
  if (editor.value) editor.value.textContent = text.value;
}

function onBlur() {
  editing.value = false;
}
</script>

<template>
  <div id="notes_container" :class="containerClasses">
    <div class="notes-rendered" v-html="rendered" @click="editor?.focus()"></div>
    <div
      id="pocket-editor"
      ref="editor"
      class="notes-editor"
      contenteditable="true"
      spellcheck="false"
      @blur="onBlur"
      @focus="onFocus"
      @input="onInput"></div>
  </div>
</template>

<style lang="sass" scoped>
@import @/assets/variables.sass

#notes_container
  --notes-width: 40em
  --notes-background: rgba(255, 255, 255, 0.1)
  background: var(--notes-background)
  border-radius: 1em
  font-size: 0.9em
  max-width: 90vw
  padding: 1em 1.25em
  text-align: left
  width: var(--notes-width)

  &.hidden
    display: none

  &.center-align
    text-align: center

  &.right-align
    text-align: right

  &.opaque
    text-shadow: none

  .notes-rendered
    :deep(h1),
    :deep(h2),
    :deep(h3)
      font-size: 1.1em
      margin: 0.4em 0

    :deep(ul)
      list-style: none
      margin: 0.4em 0
      padding-left: 1.2em

    :deep(a)
      color: inherit
      text-decoration: underline

  // L'éditeur remplace le rendu pendant la frappe, comme l'original qui ne montre
  // que PocketEditor (notes.ts l.75).
  .notes-editor
    display: none
    outline: none
    white-space: pre-wrap

  &.editing
    .notes-rendered
      display: none

    .notes-editor
      display: block
</style>
