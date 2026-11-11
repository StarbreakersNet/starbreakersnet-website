<script lang="ts" setup>
import { ref } from "vue";
import { createId, LINKS_MAX, normalizeUrl } from "@/models/widgets";
import type { LinkItem, LinksSettings } from "@/types/Widget";

const settings = defineModel<LinksSettings>("settings", { required: true });

const newTitle = ref("");
const newUrl = ref("");
const urlError = ref("");

function hostname(url: string) {
  return new URL(url).hostname;
}

function setLinks(links: LinkItem[]) {
  settings.value = { ...settings.value, links };
}

function addLink() {
  const url = normalizeUrl(newUrl.value);

  if (!url) {
    urlError.value = "Adresse invalide (http ou https uniquement)";
    return;
  }

  setLinks([...settings.value.links, { id: createId(), title: newTitle.value.trim(), url }]);
  newTitle.value = "";
  newUrl.value = "";
  urlError.value = "";
}

function removeLink(id: string) {
  setLinks(settings.value.links.filter(link => link.id !== id));
}

function moveLink(index: number, direction: -1 | 1) {
  const links = [...settings.value.links];
  const [link] = links.splice(index, 1);
  links.splice(index + direction, 0, link!);
  setLinks(links);
}

function renameLink(id: string, title: string) {
  setLinks(settings.value.links.map(link => (link.id === id ? { ...link, title } : link)));
}
</script>

<template>
  <n-form label-placement="top" @submit.prevent="addLink">
    <n-form-item label="Liens">
      <n-text v-if="settings.links.length === 0" depth="3">Aucun lien pour l'instant.</n-text>
      <ol v-else class="list">
        <li v-for="(link, index) in settings.links" :key="link.id" class="row">
          <n-input
            :maxlength="40"
            :placeholder="hostname(link.url)"
            :value="link.title"
            size="small"
            @update:value="(title: string) => renameLink(link.id, title)" />
          <n-text class="url" depth="3">{{ link.url }}</n-text>
          <n-button-group size="small">
            <n-button
              :disabled="index === 0"
              aria-label="Monter"
              quaternary
              @click="moveLink(index, -1)">
              <font-awesome-icon icon="arrow-up" />
            </n-button>
            <n-button
              :disabled="index === settings.links.length - 1"
              aria-label="Descendre"
              quaternary
              @click="moveLink(index, 1)">
              <font-awesome-icon icon="arrow-down" />
            </n-button>
            <n-button aria-label="Supprimer" quaternary type="error" @click="removeLink(link.id)">
              <font-awesome-icon icon="trash" />
            </n-button>
          </n-button-group>
        </li>
      </ol>
    </n-form-item>

    <n-form-item
      v-if="settings.links.length < LINKS_MAX"
      :feedback="urlError"
      :validation-status="urlError ? 'error' : undefined"
      label="Ajouter un lien">
      <n-input-group>
        <n-input v-model:value="newTitle" :maxlength="40" placeholder="Nom (facultatif)" />
        <n-input
          v-model:value="newUrl"
          placeholder="exemple.fr"
          @keydown.enter.prevent="addLink"
          @update:value="urlError = ''" />
        <n-button :disabled="!newUrl.trim()" type="primary" @click="addLink">Ajouter</n-button>
      </n-input-group>
    </n-form-item>

    <n-form-item label="Ouvrir dans un nouvel onglet">
      <n-switch
        :value="settings.newTab"
        @update:value="(newTab: boolean) => (settings = { ...settings, newTab })" />
    </n-form-item>
  </n-form>
</template>

<style lang="scss" scoped>
.list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  padding: 0;
  list-style: none;
}

.row {
  display: grid;
  grid-template-columns: minmax(0, 10rem) minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
}

.url {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.85em;
}
</style>
