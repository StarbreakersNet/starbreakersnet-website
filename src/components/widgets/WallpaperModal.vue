<script lang="ts" setup>
import { computed, ref, watch } from "vue";
import { fetchRandomPhoto, hasUnsplashKey, withReferral } from "@/lib/unsplash";
import { saveWallpaperFile } from "@/lib/wallpaperFile";
import {
  guessMediaKind,
  parseUnsplashCollection,
  pickVideo,
  ROTATION_FREQUENCIES,
  UNSPLASH_TOPICS,
  WALLPAPER_FILE_MAX_SIZE,
  WALLPAPER_PRESETS,
  WALLPAPER_VIDEOS,
} from "@/models/wallpapers";
import { normalizeUrl } from "@/models/widgets";
import { useMessage } from "@/composables/useMessage";
import { useUserStore } from "@/stores/user";
import { useWidgetsStore } from "@/stores/widgets";
import type { MediaKind, RotationFrequency } from "@/types/Wallpaper";

const show = defineModel<boolean>("show", { required: true });

const store = useWidgetsStore();
const user = useUserStore();
const message = useMessage();

const wallpaper = computed(() => store.wallpaper);

const tab = ref("presets");
// Onglet « Photos et vidéos » : photos Unsplash ou vidéos de la sélection, mêmes options
const rotationKind = ref<"photos" | "videos">("photos");

watch(show, visible => {
  if (!visible) return;
  const source = wallpaper.value.source;
  tab.value =
    source === "preset"
      ? "presets"
      : source === "unsplash" || source === "videos"
        ? "rotation"
        : "custom";
  if (source === "videos") rotationKind.value = "videos";
  if (source === "unsplash") rotationKind.value = "photos";
});

// --- Préréglages

function presetPreview(id: string) {
  const preset = WALLPAPER_PRESETS.find(item => item.id === id)!;
  return user.settings.theme === "light"
    ? (preset.gradient.light ?? preset.gradient.dark)
    : preset.gradient.dark;
}

const isPresetSelected = (id: string) =>
  wallpaper.value.source === "preset" && wallpaper.value.preset === id;

// --- Unsplash

const unsplash = computed(() => (wallpaper.value.source === "unsplash" ? wallpaper.value : null));
const topic = ref(UNSPLASH_TOPICS[0]!.value);
const frequency = ref<RotationFrequency>("day");
const fetching = ref(false);
// Photos d'un thème proposé, ou d'une collection Unsplash (adresse ou identifiant)
const selection = ref<"topic" | "collection">("topic");
const collectionInput = ref("");
const collectionError = ref("");

watch(
  unsplash,
  current => {
    if (current) {
      topic.value = current.topic;
      frequency.value = current.frequency;
      if (current.collection) {
        selection.value = "collection";
        collectionInput.value = current.collection;
      }
    }
  },
  { immediate: true }
);

function useUnsplash() {
  store.setWallpaper({
    source: "unsplash",
    topic: topic.value,
    collection: "",
    frequency: frequency.value,
    photo: null,
  });
}

function updateUnsplash(patch: {
  topic?: string;
  collection?: string;
  frequency?: RotationFrequency;
}) {
  const current = unsplash.value;
  if (!current) return;
  // Autre thème ou autre collection : nouvelle photo (récupérée par BurohWallpaper)
  const newSource = patch.topic !== undefined || patch.collection !== undefined;
  store.setWallpaper({ ...current, ...patch, photo: newSource ? null : current.photo });
}

function applyCollection() {
  const id = parseUnsplashCollection(collectionInput.value);
  if (!id) {
    collectionError.value = "Adresse ou identifiant de collection invalide";
    return;
  }
  collectionError.value = "";
  collectionInput.value = id;
  updateUnsplash({ collection: id });
}

function chooseSelection(value: "topic" | "collection") {
  selection.value = value;
  // Retour aux thèmes : la collection n'est plus utilisée
  if (value === "topic" && unsplash.value?.collection) {
    updateUnsplash({ collection: "" });
  }
}

// Nouvelle photo tout de suite, en gardant l'actuelle affichée pendant la requête
async function nextPhoto() {
  const current = unsplash.value;
  if (!current) return;

  fetching.value = true;
  try {
    const photo = await fetchRandomPhoto(current);
    store.setWallpaper({ ...current, photo });
  } catch {
    message.error("Impossible de récupérer une photo Unsplash pour le moment");
  } finally {
    fetching.value = false;
  }
}

// --- Vidéos de la sélection

const videos = computed(() => (wallpaper.value.source === "videos" ? wallpaper.value : null));
const videoFrequency = ref<RotationFrequency>("day");

watch(
  videos,
  current => {
    if (current) videoFrequency.value = current.frequency;
  },
  { immediate: true }
);

const isVideoSelected = (id: string) => videos.value?.video?.id === id;
const currentVideo = computed(() =>
  WALLPAPER_VIDEOS.find(video => video.id === videos.value?.video?.id)
);

function chooseVideo(id: string) {
  store.setWallpaper({
    source: "videos",
    frequency: videoFrequency.value,
    video: { id, pickedAt: new Date().toISOString() },
  });
}

function useVideos() {
  chooseVideo(pickVideo().id);
}

function nextVideo() {
  chooseVideo(pickVideo(videos.value?.video?.id).id);
}

function updateVideoFrequency(frequency: RotationFrequency) {
  if (videos.value) store.setWallpaper({ ...videos.value, frequency });
}

// --- Personnalisé : adresse ou fichier

const url = ref(wallpaper.value.source === "url" ? wallpaper.value.url : "");
const urlKind = ref<MediaKind>(wallpaper.value.source === "url" ? wallpaper.value.kind : "image");
const urlError = ref("");

watch(url, value => {
  urlError.value = "";
  if (value.trim()) urlKind.value = guessMediaKind(value);
});

function applyUrl() {
  const normalized = normalizeUrl(url.value);
  if (!normalized) {
    urlError.value = "Adresse invalide (http ou https uniquement)";
    return;
  }
  store.setWallpaper({ source: "url", kind: urlKind.value, url: normalized });
}

const fileInput = ref<HTMLInputElement | null>(null);
const saving = ref(false);

async function onFileChosen(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (!file) return;

  const kind: MediaKind | null = file.type.startsWith("video/")
    ? "video"
    : file.type.startsWith("image/")
      ? "image"
      : null;
  if (!kind) {
    message.error("Choisissez une image ou une vidéo");
    return;
  }
  if (file.size > WALLPAPER_FILE_MAX_SIZE) {
    message.error("Fichier trop lourd (100 Mo au maximum)");
    return;
  }

  saving.value = true;
  try {
    await saveWallpaperFile(file);
    store.setWallpaper({
      source: "file",
      kind,
      name: file.name,
      addedAt: new Date().toISOString(),
    });
  } catch {
    message.error("Impossible d'enregistrer ce fichier dans le navigateur");
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <n-modal
    v-model:show="show"
    class="apple-menu"
    preset="card"
    style="width: min(640px, calc(100vw - 32px))"
    title="Fond d'écran">
    <n-tabs v-model:value="tab" animated type="segment">
      <n-tab-pane name="presets" tab="Dégradés">
        <ul class="presets">
          <li v-for="preset in WALLPAPER_PRESETS" :key="preset.id">
            <button
              :aria-pressed="isPresetSelected(preset.id)"
              :class="{ selected: isPresetSelected(preset.id) }"
              class="preset"
              type="button"
              @click="store.setWallpaper({ source: 'preset', preset: preset.id })">
              <span :style="{ background: presetPreview(preset.id) }" class="preview" />
              <span class="label">{{ preset.label }}</span>
            </button>
          </li>
        </ul>
      </n-tab-pane>

      <n-tab-pane name="rotation" tab="Photos et vidéos">
        <n-radio-group v-model:value="rotationKind" class="kind">
          <n-radio-button value="photos">Photos Unsplash</n-radio-button>
          <n-radio-button value="videos">Vidéos</n-radio-button>
        </n-radio-group>

        <template v-if="rotationKind === 'photos'">
          <n-form label-placement="top">
            <template v-if="hasUnsplashKey">
              <n-form-item label="Photos">
                <n-radio-group :value="selection" @update:value="chooseSelection">
                  <n-radio-button value="topic">D'un thème</n-radio-button>
                  <n-radio-button value="collection">D'une collection</n-radio-button>
                </n-radio-group>
              </n-form-item>
              <n-form-item v-if="selection === 'topic'" label="Thème">
                <n-select
                  v-model:value="topic"
                  :options="UNSPLASH_TOPICS"
                  @update:value="(value: string) => updateUnsplash({ topic: value })" />
              </n-form-item>
              <n-form-item
                v-else
                :feedback="collectionError"
                :validation-status="collectionError ? 'error' : undefined"
                label="Collection">
                <n-input-group>
                  <n-input
                    v-model:value="collectionInput"
                    placeholder="https://unsplash.com/collections/…"
                    @keydown.enter.prevent="applyCollection" />
                  <n-button
                    :disabled="!unsplash || !collectionInput.trim()"
                    type="primary"
                    @click="applyCollection">
                    Appliquer
                  </n-button>
                </n-input-group>
              </n-form-item>
            </template>
            <n-alert v-else :bordered="false" class="note" type="info">
              Photos au hasard parmi celles d'Unsplash proposées par Lorem Picsum. Choisir un thème
              ou une collection demande une clé d'API Unsplash (voir le README).
            </n-alert>
            <n-form-item label="Nouvelle photo">
              <n-select
                v-model:value="frequency"
                :options="ROTATION_FREQUENCIES.map(({ value, label }) => ({ value, label }))"
                @update:value="
                  (value: RotationFrequency) => updateUnsplash({ frequency: value })
                " />
            </n-form-item>
          </n-form>
          <n-flex align="center" justify="space-between">
            <n-text v-if="unsplash?.photo" depth="3">
              Photo :
              <a
                :href="withReferral(unsplash.photo.authorUrl ?? unsplash.photo.photoUrl)"
                rel="noopener"
                target="_blank">
                {{ unsplash.photo.author }}
              </a>
            </n-text>
            <span v-else />
            <n-button v-if="!unsplash" type="primary" @click="useUnsplash">
              Utiliser Unsplash
            </n-button>
            <n-button v-else :loading="fetching" @click="nextPhoto">
              <template #icon><font-awesome-icon icon="rotate" /></template>
              Autre photo
            </n-button>
          </n-flex>
        </template>

        <template v-else>
          <ul class="presets">
            <li v-for="video in WALLPAPER_VIDEOS" :key="video.id">
              <button
                :aria-pressed="isVideoSelected(video.id)"
                :class="{ selected: isVideoSelected(video.id) }"
                class="preset"
                type="button"
                @click="chooseVideo(video.id)">
                <span class="preview">
                  <video :src="`${video.src}#t=8`" muted playsinline preload="metadata" />
                  <font-awesome-icon class="play" icon="play" />
                </span>
                <span class="label">{{ video.label }}</span>
              </button>
            </li>
          </ul>
          <n-form class="rotation-form" label-placement="top">
            <n-form-item label="Nouvelle vidéo">
              <n-select
                v-model:value="videoFrequency"
                :options="ROTATION_FREQUENCIES.map(({ value, label }) => ({ value, label }))"
                @update:value="updateVideoFrequency" />
            </n-form-item>
          </n-form>
          <n-flex align="center" justify="space-between">
            <n-text v-if="currentVideo" depth="3">Vidéo : {{ currentVideo.credit }}</n-text>
            <span v-else />
            <n-button v-if="!videos" type="primary" @click="useVideos">
              Utiliser les vidéos
            </n-button>
            <n-button v-else :disabled="WALLPAPER_VIDEOS.length < 2" @click="nextVideo">
              <template #icon><font-awesome-icon icon="rotate" /></template>
              Autre vidéo
            </n-button>
          </n-flex>
        </template>
      </n-tab-pane>

      <n-tab-pane name="custom" tab="Personnalisé">
        <n-form label-placement="top" @submit.prevent="applyUrl">
          <n-form-item
            :feedback="urlError"
            :validation-status="urlError ? 'error' : undefined"
            label="Image ou vidéo depuis une adresse">
            <n-input-group>
              <n-input v-model:value="url" placeholder="https://exemple.fr/fond.jpg" />
              <n-select
                v-model:value="urlKind"
                :options="[
                  { value: 'image', label: 'Image' },
                  { value: 'video', label: 'Vidéo' },
                ]"
                style="width: 7.5rem" />
              <n-button :disabled="!url.trim()" type="primary" @click="applyUrl">
                Appliquer
              </n-button>
            </n-input-group>
          </n-form-item>
          <n-form-item label="Depuis votre ordinateur">
            <n-flex align="center">
              <n-button :loading="saving" @click="fileInput?.click()">
                <template #icon><font-awesome-icon icon="upload" /></template>
                Choisir une image ou une vidéo
              </n-button>
              <n-text v-if="wallpaper.source === 'file'" depth="3">{{ wallpaper.name }}</n-text>
            </n-flex>
            <input
              ref="fileInput"
              accept="image/*,video/*"
              class="file-input"
              type="file"
              @change="onFileChosen" />
          </n-form-item>
        </n-form>
        <n-text depth="3">
          Un fichier de l'ordinateur reste dans ce navigateur (100 Mo au maximum) : sur un autre
          appareil, Buroh affiche le fond par défaut. Les vidéos sont lues en boucle, sans son.
        </n-text>
      </n-tab-pane>
    </n-tabs>
  </n-modal>
</template>

<style lang="scss" scoped>
.presets {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
  padding: 4px 0 0;
  list-style: none;
}

.preset {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
  padding: 0;
  border: none;
  background: none;
  color: inherit;
  font: inherit;
  cursor: pointer;

  .preview {
    position: relative;
    display: grid;
    place-items: center;
    aspect-ratio: 16 / 10;
    border-radius: 12px;
    background: rgb(0 0 0);
    outline: 2px solid transparent;
    outline-offset: 2px;
    overflow: hidden;
    transition: outline-color 0.2s ease;

    video {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .play {
      position: relative;
      color: white;
      filter: drop-shadow(0 1px 3px rgb(0 0 0 / 0.6));
    }
  }

  .label {
    font-size: 0.85rem;
    text-align: center;
  }

  &.selected .preview,
  &:focus-visible .preview {
    outline-color: rgb(10 132 255);
  }
}

.note {
  margin-bottom: 16px;
}

.kind {
  margin-bottom: 16px;
}

.rotation-form {
  margin-top: 16px;
}

.file-input {
  display: none;
}
</style>
