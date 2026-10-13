<script lang="ts" setup>
// Fork natif TypeScript de Bonjourr : grille des liens rapides et overlay d'édition.
// Structure DOM reprise de Bonjourr/src/index.html (dialogue #contextmenu/#editlink-form
// l.29-82, conteneur #linkblocks + #link-mini l.664-667, groupe l.748-752, lien l.755-764) ;
// classes du conteneur : features/links/index.ts l.124-127 ; barre de groupes :
// features/links/groups.ts l.34-69.
import { computed, reactive, ref, watch } from "vue";
import {
  ICON_FALLBACK,
  addGroup,
  addLink,
  deleteGroup,
  deleteLinks,
  iconFor,
  linksInGroup,
  renameGroup,
  selectGroup,
  titleFromUrl,
  updateLink,
  type LinkElem,
  type LinkIcon,
  type LinksState,
} from "@/bonjourr/links";
import { translate } from "@/bonjourr/i18n";
import { useBonjourrStore } from "@/stores/bonjourr";

const settings = useBonjourrStore();

// i18n FR/EN (case 21).
const t = (key: string) => translate(settings.config.lang, key);

// Tailles de `initRows` (index.ts l.363-376) : largeur + écart, en em.
const STYLE_SIZES = {
  large: { width: 4.8, gap: 2.3 },
  medium: { width: 3.5, gap: 2 },
  small: { width: 2.5, gap: 2 },
  inline: { width: 11, gap: 2 },
  text: { width: 5, gap: 2 },
};

type Editing =
  | { kind: "link-add" }
  | { kind: "link-edit"; id: string }
  | { kind: "group-add" }
  | { kind: "group-rename"; title: string };

const editing = ref<Editing | null>(null);
const draft = reactive({ title: "", url: "", iconType: "auto", iconUrl: "" });

const state = computed<LinksState>(() => ({
  links: settings.config.links,
  linkgroups: settings.config.linkgroups,
}));

const currentGroup = computed(() => settings.config.linkgroups.selected);
const links = computed(() => linksInGroup(settings.config.links, currentGroup.value));
const isLinkMode = computed(() => editing.value?.kind === "link-add" || editing.value?.kind === "link-edit");
const isAdd = computed(() => editing.value?.kind === "link-add");
const canDelete = computed(() => editing.value !== null && editing.value.kind !== "group-add");

// `setRadius` (index.ts l.841-843) et `initRows` (l.363-376) posent les variables sur la
// racine du document : le fork reprend ce choix plutôt que de les mettre sur le conteneur.
watch(
  () => [settings.config.linkstyle, settings.config.linksrow, settings.config.linkiconradius],
  () => {
    const size = STYLE_SIZES[settings.config.linkstyle] ?? STYLE_SIZES.large;
    const width = Math.ceil((size.width + size.gap) * settings.config.linksrow);
    document.documentElement.style.setProperty("--links-width", `${width}em`);
    document.documentElement.style.setProperty("--link-outer-radius", `${settings.config.linkiconradius}em`);
  },
  { immediate: true },
);

function apply(next: LinksState) {
  settings.patch({ links: next.links, linkgroups: next.linkgroups });
}

function applyLinks(next: LinkElem[]) {
  settings.patch({ links: next });
}

// `createTitle` (helpers.ts l.43-57) : le titre affiché retombe sur le nom d'hôte.
function displayTitle(link: LinkElem): string {
  return link.title || titleFromUrl(link.url);
}

// Libellés de la barre de groupes : « default » est traduit (translations.json l.18),
// les autres groupes affichent le titre choisi par l'utilisateur (groups.ts l.43).
function groupLabel(group: string): string {
  return group === "default" ? t("Groupe par défaut") : group;
}

function pick(group: string) {
  apply(selectGroup(state.value, group));
}

function openLinkAdd() {
  draft.title = "";
  draft.url = "";
  draft.iconType = "auto";
  draft.iconUrl = "";
  editing.value = { kind: "link-add" };
}

function openLinkEdit(link: LinkElem) {
  draft.title = link.title;
  draft.url = link.url;
  draft.iconType = link.icon?.type === "url" ? "url" : "auto";
  draft.iconUrl = link.icon?.type === "url" ? (link.icon.value ?? "") : "";
  editing.value = { kind: "link-edit", id: link._id };
}

function openGroupAdd() {
  draft.title = "";
  draft.url = "";
  editing.value = { kind: "group-add" };
}

function openGroupRename(title: string) {
  draft.title = title;
  editing.value = { kind: "group-rename", title };
}

function close() {
  editing.value = null;
}

// `applyLinkChanges` (edit.ts l.418-460) : l'URL est obligatoire, d'où le garde-fou
// qui remplace `required = true` de edit.ts l.249.
function draftIcon(): LinkIcon | undefined {
  if (draft.iconType === "url") {
    return { type: "url", value: draft.iconUrl.trim() };
  }
  if (draft.iconType === "auto") {
    return { type: "auto", value: "" };
  }
  return undefined;
}

function submit() {
  const current = editing.value;
  if (!current) return;

  if (current.kind === "link-add") {
    if (draft.url.trim() === "") return;
    applyLinks(
      addLink(settings.config.links, {
        title: draft.title,
        url: draft.url,
        parent: currentGroup.value,
      }),
    );
    close();
    return;
  }

  if (current.kind === "link-edit") {
    if (draft.url.trim() === "") return;
    applyLinks(
      updateLink(settings.config.links, current.id, {
        title: draft.title,
        url: draft.url,
        icon: draftIcon(),
      }),
    );
    close();
    return;
  }

  if (current.kind === "group-add") {
    if (draft.title.trim() === "") return;
    apply(addGroup(state.value, draft.title.trim()));
    close();
    return;
  }

  if (draft.title.trim() === "") return;
  apply(renameGroup(state.value, current.title, draft.title.trim()));
  close();
}

function remove() {
  const current = editing.value;
  if (!current) return;

  if (current.kind === "link-edit") {
    applyLinks(deleteLinks(settings.config.links, [current.id]));
  } else if (current.kind === "group-rename") {
    apply(deleteGroup(state.value, current.title));
  }

  close();
}

// Repli d'icône : `https://services.bonjourr.fr/favicon/blob/error` (index.ts l.345, l.354).
function onIconError(event: Event) {
  const img = event.target as HTMLImageElement;
  if (img.dataset.fallback === undefined) {
    img.dataset.fallback = "true";
    img.src = ICON_FALLBACK;
  }
}
</script>

<template>
  <div
    id="linkblocks"
    :class="[
      settings.config.linkstyle,
      {
        titles: settings.config.linktitles,
        backgrounds: settings.config.linkbackgrounds,
        hidden: !settings.config.quicklinks,
        'with-groups': settings.config.linkgroups.on,
      },
    ]"
    @contextmenu.prevent="openLinkAdd()">
    <div v-if="settings.config.linkgroups.on" id="link-mini">
      <div>
        <button
          v-for="group in settings.config.linkgroups.groups"
          :key="group"
          :class="{ 'selected-group': group === settings.config.linkgroups.selected }"
          :data-group="group"
          class="link-title"
          type="button"
          @click="pick(group)"
          @contextmenu.stop.prevent="openGroupRename(group)">
          {{ groupLabel(group) }}
        </button>
        <button class="link-title add-group" type="button" @click="openGroupAdd">+</button>
      </div>
    </div>

    <div class="link-group">
      <ul class="link-list">
        <li
          v-for="link in links"
          :id="link._id"
          :key="link._id"
          class="link link-elem"
          @contextmenu.stop.prevent="openLinkEdit(link)">
          <a
            :href="link.url"
            :target="settings.config.linknewtab ? '_blank' : undefined"
            draggable="false"
            rel="noreferrer noopener">
            <div class="link-icon">
              <img :alt="''" :src="iconFor(link)" draggable="false" @error="onIconError" />
            </div>
            <span class="link-elem-title">{{ displayTitle(link) }}</span>
          </a>
        </li>
      </ul>
      <button class="link-title" type="button">{{ currentGroup }}</button>
    </div>

    <dialog v-if="editing" id="contextmenu" open @click.self="close">
      <form id="editlink-form" @submit.prevent="submit">
        <label id="edit-title">
          <span>{{ t("Titre") }}</span>
          <input
            v-model="draft.title"
            autocomplete="off"
            id="e-title"
            maxlength="64"
            name="e-title"
            placeholder="Example"
            type="text" />
        </label>

        <template v-if="isLinkMode">
          <label id="edit-url">
            <span>{{ t("Lien") }}</span>
            <input
              v-model="draft.url"
              autocapitalize="off"
              autocomplete="off"
              autocorrect="off"
              id="e-url"
              maxlength="512"
              name="e-url"
              placeholder="https://example.com"
              type="text" />
          </label>

          <label id="edit-icon">
            <span>{{ t("Icône") }}</span>
            <select id="e-icon-type" name="edit-icon" v-model="draft.iconType">
              <option value="auto">{{ t("Favicon du site web") }}</option>
              <!-- Écart assumé : l'option « Fichier local » (index.html l.61) demande un
                   stockage binaire que le fork n'a pas encore ; « URL » suffit. -->
              <option value="url">URL</option>
            </select>
          </label>

          <label v-if="draft.iconType === 'url'" id="edit-icon-url">
            <span>{{ t("URL") }}</span>
            <input
              v-model="draft.iconUrl"
              autocomplete="off"
              id="e-icon-url"
              maxlength="7600"
              name="e-icon-url"
              placeholder="https://example.com/favicon.ico"
              type="url" />
          </label>
        </template>

        <hr />

        <button
          v-if="canDelete"
          class="btn-red"
          id="edit-delete"
          type="button"
          @click="remove">
          {{ t("Supprimer") }}
        </button>
        <!-- Écart assumé : l'original laisse le navigateur soumettre le formulaire au clic
             (edit.ts l.286) ; le fork branche aussi les boutons directement, le DOM de
             test ne simulant pas la soumission native. « Entrée » passe toujours par
             @submit. -->
        <button v-if="isAdd" id="edit-add" type="button" @click="submit">{{ t("Ajouter un lien") }}</button>
        <button v-else id="edit-apply" type="button" @click="submit">{{ t("Enregistrer") }}</button>
        <button id="edit-cancel" type="button" @click="close">{{ t("Annuler") }}</button>
      </form>
    </dialog>
  </div>
</template>

<style lang="sass" scoped>
@import @/assets/variables.sass

#linkblocks
  display: flex
  flex-direction: column
  gap: 1em
  width: var(--links-width)

  &.hidden
    display: none

  #link-mini
    display: none
    gap: 0.5em
    justify-content: center

    .link-title
      background: none
      border: 0
      color: inherit
      cursor: pointer
      font: inherit
      font-size: 0.8em
      opacity: 0.6
      padding: 0.2em 0.5em
      text-shadow: inherit

      &.selected-group
        opacity: 1

  &.with-groups
    #link-mini
      display: flex

  .link-group
    display: contents

    > .link-title
      display: none

    .link-list
      display: flex
      flex-wrap: wrap
      gap: 2em
      justify-content: center
      list-style: none
      margin: 0
      padding: 0

  // Classe `backgrounds` du conteneur (index.ts l.126).
  &.backgrounds
    .link-icon
      background: rgba(255, 255, 255, 0.1)

  .link-elem
    align-items: center
    display: flex
    flex-direction: column

    a
      align-items: center
      color: inherit
      display: flex
      flex-direction: column
      gap: 0.5em
      text-decoration: none

    // Dimensions « medium » de initRows (index.ts l.363-376).
    .link-icon
      align-items: center
      border-radius: var(--link-outer-radius)
      display: flex
      height: 3.5em
      justify-content: center
      overflow: hidden
      width: 3.5em

      img
        height: 100%
        object-fit: contain
        width: 100%

    .link-elem-title
      display: none
      font-size: 0.9em
      max-width: 100%
      overflow: hidden
      text-overflow: ellipsis
      white-space: nowrap

  // Classe `titles` du conteneur (index.ts l.125).
  &.titles
    .link-elem-title
      display: block

  &.small
    .link-icon
      height: 2.5em
      width: 2.5em

  &.large
    .link-icon
      height: 4.8em
      width: 4.8em

  &.inline,
  &.text
    .link-elem
      a
        flex-direction: row

  #contextmenu
    background: rgba(20, 18, 40, 0.95)
    border: 0
    border-radius: 1em
    color: white
    padding: 1.5em
    text-shadow: none
    width: 20em

    form
      display: flex
      flex-direction: column
      gap: 0.75em

    label
      display: flex
      flex-direction: column
      font-size: 0.85em
      gap: 0.35em

    input,
    select
      background: rgba(255, 255, 255, 0.12)
      border: 0
      border-radius: 0.5em
      color: inherit
      font: inherit
      padding: 0.5em 0.7em

    button
      background: rgba(255, 255, 255, 0.18)
      border: 0
      border-radius: 0.5em
      color: inherit
      cursor: pointer
      font: inherit
      padding: 0.5em 0.7em

      &.btn-red
        background: rgba(220, 70, 70, 0.8)
</style>
