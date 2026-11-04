<script lang="ts" setup>
// Barre de recherche du fork Bonjourr (features/searchbar.ts) : saisie →
// navigation directe si domaine, sinon URL du moteur réglé ; suggestions du
// service d'origine (wss://services.bonjourr.fr/suggestions) si activées.
import { ref } from "vue";
import {
  fetchSuggestions,
  resolveSubmitUrl,
  type Suggestion,
} from "@/bonjourr/search";
import { translate } from "@/bonjourr/i18n";
import { useBonjourrStore } from "@/stores/bonjourr";

const settings = useBonjourrStore();

// i18n FR/EN (case 21).
const t = (key: string) => translate(settings.config.lang, key);
const query = ref("");
const suggestions = ref<Suggestion[]>([]);

async function onInput() {
  const searchbar = settings.config.searchbar;
  if (!searchbar.suggestions || query.value.trim().length < 2) {
    suggestions.value = [];
    return;
  }
  suggestions.value = await fetchSuggestions(
    query.value,
    searchbar.engine,
    settings.config.lang,
  ).catch(() => []);
}

function openResult(text: string) {
  query.value = text;
  suggestions.value = [];
  submit();
}

function submit() {
  const searchbar = settings.config.searchbar;
  const url = resolveSubmitUrl(query.value, searchbar.engine, searchbar.request);
  if (!url) return;
  globalThis.open(url, searchbar.newtab ? "_blank" : "_self");
}

function onSubmit(event: Event) {
  event.preventDefault();
  submit();
}
</script>

<template>
  <div v-if="settings.config.searchbar.on" class="searchbar" :data-engine="settings.config.searchbar.engine">
    <form @submit="onSubmit">
      <input
        v-model="query"
        :aria-label="t('Barre de recherche')"
        :placeholder="settings.config.searchbar.placeholder || t('Rechercher')"
        type="text"
        @input="onInput" />
      <button :aria-label="t('Lancer la recherche')" type="submit">
        <font-awesome-icon :icon="['fas', 'magnifying-glass']" />
      </button>
    </form>
    <ul v-if="suggestions.length" class="searchbar-suggestions">
      <li
        v-for="suggestion in suggestions"
        :key="suggestion.text"
        @click="openResult(suggestion.text)">
        {{ suggestion.text }}
      </li>
    </ul>
  </div>
</template>

<style lang="sass" scoped>
.searchbar
  width: min(32em, 80vw)
  margin-top: 1.2em

  form
    display: flex
    align-items: center
    gap: .5em
    background: rgb(255 255 255 / .18)
    border-radius: 1.4em
    padding: .4em 1em

  input
    flex: 1
    background: none
    border: none
    color: white
    font-size: 1.05em
    outline: none
    text-shadow: 0 1px 6px rgb(0 0 0 / .35)

    &::placeholder
      color: rgb(255 255 255 / .75)

  button
    background: none
    border: none
    color: white
    cursor: pointer

  .searchbar-suggestions
    list-style: none
    margin: .3em 0 0
    padding: .3em 0
    background: rgb(20 20 26 / .75)
    border-radius: .8em

    li
      cursor: pointer
      padding: .35em 1em

      &:hover
        background: rgb(255 255 255 / .12)
</style>
