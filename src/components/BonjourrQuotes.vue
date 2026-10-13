<script lang="ts" setup>
// Fork natif TypeScript de Bonjourr : citations de la page.
// Structure reprise de Bonjourr/src/index.html l.670-672 (`#quotes_container`,
// `#quote`, `#author`), enchaînement d'initialisation de features/quotes.ts
// l.43-75, rafraîchissement de l.99-101, `hidden` de l.72 et `always-on` de
// l.271-273, sauts de ligne littéraux de l.283-284.
import { computed, onMounted, ref, watch } from "vue";
import {
  controlCacheList,
  csvUserInputToQuotes,
  loadQuotesCache,
  loadUserQuoteSelection,
  needsChange,
  saveQuotesCache,
  saveUserQuoteSelection,
  tryFetchQuotes,
  type Quote,
} from "@/bonjourr/quotes";
import { useBonjourrStore } from "@/stores/bonjourr";

const settings = useBonjourrStore();
const quote = ref<Quote | undefined>(undefined);

// Horodatage déjà appliqué : sans ce garde-fou le composant avancerait deux fois
// quand le panneau écrit lui-même `quotes.last` (quotes.ts l.100).
let applied = 0;

const content = computed(() => (quote.value?.content ?? "").replace(/\\n/g, "\n"));
const author = computed(() => quote.value?.author ?? "");

/**
 * `stamp` correspond à `{ refresh: true }` de l'original (l.99-101) : la citation
 * change sur-le-champ et l'horodatage demandé est celui écrit dans les réglages.
 */
async function show(stamp?: number) {
  const { lang, quotes } = settings.config;
  let list: Quote[];
  let current: Quote | undefined;

  if (quotes.type === "user") {
    list = csvUserInputToQuotes(quotes.userlist);
    current = list[loadUserQuoteSelection()];
  } else {
    list = loadQuotesCache();
    current = list[0];

    if (list.length === 0) {
      list = await tryFetchQuotes(lang, quotes.type, quotes.url);
      current = list[0];
      saveQuotesCache(list);
    }
  }

  if (stamp !== undefined || needsChange(quotes.frequency, quotes.last ?? 0)) {
    const next = stamp ?? Date.now();
    applied = next;

    const advanced = controlCacheList(list, quotes.type);
    current = advanced.quote;

    if (advanced.selection === undefined) {
      saveQuotesCache(advanced.cache);
    } else {
      saveUserQuoteSelection(advanced.selection);
    }

    if (advanced.refetch) {
      saveQuotesCache(await tryFetchQuotes(lang, quotes.type, quotes.url));
    }

    settings.patch({ quotes: { last: next } });
  }

  quote.value = current;
}

onMounted(() => show());

// Le panneau « Prochaine citation » date la citation : c'est le signal de passer
// à la suivante, quelle que soit la fréquence choisie.
watch(
  () => settings.config.quotes.last,
  (value) => {
    const stamp = value ?? 0;
    if (stamp === applied) {
      return;
    }
    applied = stamp;
    void show(stamp);
  },
);

// Changer de collection, d'URL ou de liste recharge l'affichage (l.120-151).
watch(
  () => [settings.config.quotes.type, settings.config.quotes.url, settings.config.quotes.userlist],
  () => void show(),
);
</script>

<template>
  <div id="quotes_container" :class="{ hidden: !settings.config.quotes.on }">
    <p id="quote">{{ content }}</p>
    <p id="author" :class="{ 'always-on': settings.config.quotes.author }">{{ author }}</p>
  </div>
</template>

<style lang="sass" scoped>
@import @/assets/variables.sass

// Reproduit l'essentiel de styles/features/quotes.css : citation centrée, auteur
// discret tant qu'on ne survole pas, visible en permanence s'il est demandé.
#quotes_container
  bottom: 10vh
  left: 0
  padding: 0 1em
  pointer-events: none
  position: absolute
  text-align: center
  width: 100%

  &.hidden
    display: none

  #quote
    font-size: 1.2em
    margin: 0
    white-space: pre-line

  #author
    font-size: 0.9em
    margin-top: 0.5em
    opacity: 0
    transition: opacity 0.2s

    &.always-on
      opacity: 1

  &:hover #author
    opacity: 1
</style>
