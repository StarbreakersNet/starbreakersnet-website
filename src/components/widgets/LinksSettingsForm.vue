<script lang="ts" setup>
import { type PropType, ref } from "vue";
import HButton from "@/components/c/hButton.vue";
import HFlex from "@/components/c/hFlex.vue";
import HForm from "@/components/c/hForm.vue";
import HFormItem from "@/components/c/hFormItem.vue";
import HInput from "@/components/c/hInput.vue";
import HInputGroup from "@/components/c/hInputGroup.vue";
import HSwitch from "@/components/c/hSwitch.vue";
import HText from "@/components/c/hText.vue";
import { createId, LINKS_MAX, normalizeUrl } from "@/models/widgets";
import type { LinkItem, LinksSettings } from "@/types/Widget";

const settings = defineModel("settings", {
  type: Object as PropType<LinksSettings>,
  required: true,
});

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

  if (url) {
    const link = { id: createId(), title: newTitle.value.trim(), url };

    setLinks([...settings.value.links, link]);

    newTitle.value = "";
    newUrl.value = "";
    urlError.value = "";
  } else {
    urlError.value = "Adresse invalide (http ou https uniquement)";
  }
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
  const links = settings.value.links.map(link => (link.id === id ? { ...link, title } : link));

  setLinks(links);
}

function updateNewTab(newTab: boolean) {
  settings.value = { ...settings.value, newTab };
}
</script>

<template>
  <h-form :model="settings" label-placement="top" @submit="addLink">
    <h-form-item label="Liens">
      <h-text v-if="settings.links.length === 0" depth="3">Aucun lien pour l'instant.</h-text>
      <ol v-else class="list">
        <li v-for="(link, index) in settings.links" :key="link.id">
          <h-flex :size="8" :wrap="false">
            <h-input
              :maxlength="40"
              :placeholder="hostname(link.url)"
              :value="link.title"
              class="title"
              size="small"
              @update:value="(title: string) => renameLink(link.id, title)" />
            <h-text class="url" depth="3">{{ link.url }}</h-text>
            <h-flex :size="2">
              <h-button
                :disabled="index === 0"
                aria-label="Monter"
                quaternary
                size="small"
                tooltip="Monter"
                @click="moveLink(index, -1)">
                <font-awesome-icon icon="arrow-up" />
              </h-button>
              <h-button
                :disabled="index === settings.links.length - 1"
                aria-label="Descendre"
                quaternary
                size="small"
                tooltip="Descendre"
                @click="moveLink(index, 1)">
                <font-awesome-icon icon="arrow-down" />
              </h-button>
              <h-button
                aria-label="Supprimer"
                quaternary
                size="small"
                tooltip="Supprimer"
                type="error"
                @click="removeLink(link.id)">
                <font-awesome-icon icon="trash" />
              </h-button>
            </h-flex>
          </h-flex>
        </li>
      </ol>
    </h-form-item>
    <h-form-item
      v-if="settings.links.length < LINKS_MAX"
      :feedback="urlError"
      :validation-status="urlError ? 'error' : undefined"
      label="Ajouter un lien">
      <h-input-group>
        <h-input v-model:value="newTitle" :maxlength="40" placeholder="Nom (facultatif)" />
        <h-input
          v-model:value="newUrl"
          placeholder="exemple.fr"
          @keydown.enter.prevent="addLink"
          @update:value="urlError = ''" />
        <h-button :disabled="!newUrl.trim()" type="primary" @click="addLink">Ajouter</h-button>
      </h-input-group>
    </h-form-item>
    <h-form-item label="Ouvrir dans un nouvel onglet">
      <h-switch :value="settings.newTab" @update:value="updateNewTab" />
    </h-form-item>
  </h-form>
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

.title {
  flex: 0 1 10rem;
}

.url {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.85em;
}
</style>
