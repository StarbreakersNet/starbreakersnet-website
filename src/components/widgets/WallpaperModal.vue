<script lang="ts" setup>
import { computed, reactive, ref, useTemplateRef, watch } from "vue";
import HButton from "@/components/c/hButton.vue";
import HFlex from "@/components/c/hFlex.vue";
import HForm from "@/components/c/hForm.vue";
import HFormItem from "@/components/c/hFormItem.vue";
import HGrid from "@/components/c/hGrid.vue";
import HGridItem from "@/components/c/hGridItem.vue";
import HInput from "@/components/c/hInput.vue";
import HInputGroup from "@/components/c/hInputGroup.vue";
import HModal from "@/components/c/hModal.vue";
import HRadioButton from "@/components/c/hRadioButton.vue";
import HRadioGroup from "@/components/c/hRadioGroup.vue";
import HSelect from "@/components/c/hSelect.vue";
import HTabPane from "@/components/c/hTabPane.vue";
import HTabs from "@/components/c/hTabs.vue";
import HText from "@/components/c/hText.vue";
import { checkUnsplashKey, fetchRandomPhoto, withReferral } from "@/utils/unsplash";
import { saveWallpaperFile } from "@/utils/wallpaperFile";
import {
  guessMediaKind,
  normalizeUnsplashKey,
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
import type {
  MediaKind,
  RotationFrequency,
  UnsplashWallpaper,
  WallpaperSource,
} from "@/types/Wallpaper";

const show = defineModel("show", {
  type: Boolean,
  required: true,
});

const store = useWidgetsStore();
const user = useUserStore();
const message = useMessage();

// Vignettes des dégradés et des vidéos : deux par ligne sur mobile, jusqu'à quatre
const PREVIEW_COLUMNS = "2 420:3 560:4";

const FREQUENCY_OPTIONS = ROTATION_FREQUENCIES.map(({ value, label }) => ({ value, label }));

const KIND_OPTIONS = [
  { value: "image", label: "Image" },
  { value: "video", label: "Vidéo" },
];

// Onglet ouvert pour chaque source de fond d'écran
const TAB_BY_SOURCE: Record<WallpaperSource, string> = {
  preset: "presets",
  unsplash: "rotation",
  videos: "rotation",
  url: "custom",
  file: "custom",
};

const wallpaper = computed(() => store.wallpaper);

const tab = ref("presets");

// Onglet « Photos et vidéos » : photos Unsplash ou vidéos de la sélection, mêmes options
const rotationKind = ref<"photos" | "videos">("photos");

// À l'ouverture, onglet et options du fond d'écran actuel
function onOpen(visible: boolean) {
  const source = wallpaper.value.source;

  if (visible) {
    tab.value = TAB_BY_SOURCE[source];
  }

  if (visible && source === "videos") {
    rotationKind.value = "videos";
  }

  if (visible && source === "unsplash") {
    rotationKind.value = "photos";
  }
}

// --- Dégradés

function presetPreview(id: string) {
  const preset = WALLPAPER_PRESETS.find(item => item.id === id)!;
  const { dark, light } = preset.gradient;

  return user.settings.theme === "light" ? (light ?? dark) : dark;
}

function isPresetSelected(id: string) {
  return wallpaper.value.source === "preset" && wallpaper.value.preset === id;
}

function choosePreset(id: string) {
  store.setWallpaper({ source: "preset", preset: id });
}

// --- Photos Unsplash

const unsplash = computed(() => (wallpaper.value.source === "unsplash" ? wallpaper.value : null));

const unsplashForm = reactive({
  selection: "topic" as "topic" | "collection",
  topic: UNSPLASH_TOPICS[0]!.value,
  collection: "",
  frequency: "day" as RotationFrequency,
});

const collectionError = ref("");
const fetching = ref(false);

const photoCredit = computed(() => unsplash.value?.photo ?? null);

function readUnsplash(current: UnsplashWallpaper | null) {
  if (current) {
    unsplashForm.topic = current.topic;
    unsplashForm.frequency = current.frequency;
  }

  if (current?.collection) {
    unsplashForm.selection = "collection";
    unsplashForm.collection = current.collection;
  }
}

function useUnsplash() {
  store.setWallpaper({
    source: "unsplash",
    topic: unsplashForm.topic,
    collection: "",
    frequency: unsplashForm.frequency,
    photo: null,
  });
}

function updateUnsplash(
  patch: Partial<Pick<UnsplashWallpaper, "topic" | "collection" | "frequency">>
) {
  const current = unsplash.value;

  if (current) {
    const newSource = patch.topic !== undefined || patch.collection !== undefined;
    const photo = newSource ? null : current.photo;

    store.setWallpaper({ ...current, ...patch, photo });
  }
}

function updateTopic(topic: string) {
  unsplashForm.topic = topic;
  updateUnsplash({ topic });
}

function updatePhotoFrequency(frequency: RotationFrequency) {
  unsplashForm.frequency = frequency;
  updateUnsplash({ frequency });
}

function applyCollection() {
  const id = parseUnsplashCollection(unsplashForm.collection);

  if (id) {
    collectionError.value = "";
    unsplashForm.collection = id;
    updateUnsplash({ collection: id });
  } else {
    collectionError.value = "Adresse ou identifiant de collection invalide";
  }
}

function chooseSelection(value: "topic" | "collection") {
  unsplashForm.selection = value;

  if (value === "topic" && unsplash.value?.collection) {
    updateUnsplash({ collection: "" });
  }
}

async function nextPhoto() {
  const current = unsplash.value;

  if (current) {
    fetching.value = true;

    try {
      const photo = await fetchRandomPhoto(current, store.unsplashKey);

      store.setWallpaper({ ...current, photo });
    } catch {
      message.error("Impossible de récupérer une photo Unsplash pour le moment");
    } finally {
      fetching.value = false;
    }
  }
}

// --- Clé d'accès Unsplash de l'utilisateur

const hasKey = computed(() => Boolean(store.unsplashKey));

const keyForm = reactive({
  key: store.unsplashKey,
});

const keyError = ref("");
const checkingKey = ref(false);

async function saveKey() {
  const key = normalizeUnsplashKey(keyForm.key);

  keyError.value = key ? "" : "Clé d'accès invalide";

  if (key) {
    checkingKey.value = true;
    const status = await checkUnsplashKey(key);
    checkingKey.value = false;

    if (status === "invalid") {
      keyError.value = "Clé refusée par Unsplash";
    } else {
      store.setUnsplashKey(key);
      keyForm.key = key;
      nextPhoto();
    }

    if (status === "unavailable") {
      message.warning("Unsplash ne répond pas : clé enregistrée sans vérification");
    }
  }
}

function removeKey() {
  store.setUnsplashKey("");
  keyForm.key = "";
  keyError.value = "";
  chooseSelection("topic");
}

// --- Vidéos de la sélection

const videos = computed(() => (wallpaper.value.source === "videos" ? wallpaper.value : null));

const videoForm = reactive({
  frequency: "day" as RotationFrequency,
});

const currentVideo = computed(() => {
  const id = videos.value?.video?.id;

  return WALLPAPER_VIDEOS.find(video => video.id === id);
});

function isVideoSelected(id: string) {
  return videos.value?.video?.id === id;
}

function chooseVideo(id: string) {
  store.setWallpaper({
    source: "videos",
    frequency: videoForm.frequency,
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
  videoForm.frequency = frequency;

  if (videos.value) {
    store.setWallpaper({ ...videos.value, frequency });
  }
}

// --- Personnalisé : adresse ou fichier

const customForm = reactive({
  url: wallpaper.value.source === "url" ? wallpaper.value.url : "",
  kind: (wallpaper.value.source === "url" ? wallpaper.value.kind : "image") as MediaKind,
});

const urlError = ref("");
const saving = ref(false);
const fileInput = useTemplateRef<HTMLInputElement>("fileInput");

const fileName = computed(() => (wallpaper.value.source === "file" ? wallpaper.value.name : ""));

function updateUrl(url: string) {
  customForm.url = url;
  urlError.value = "";

  if (url.trim()) {
    customForm.kind = guessMediaKind(url);
  }
}

function applyUrl() {
  const url = normalizeUrl(customForm.url);

  if (url) {
    store.setWallpaper({ source: "url", kind: customForm.kind, url });
  } else {
    urlError.value = "Adresse invalide (http ou https uniquement)";
  }
}

function fileKind(file: File): MediaKind | null {
  let kind: MediaKind | null = null;

  if (file.type.startsWith("image/")) {
    kind = "image";
  }

  if (file.type.startsWith("video/")) {
    kind = "video";
  }

  return kind;
}

async function saveFile(file: File, kind: MediaKind) {
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

function onFileChosen(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  const kind = file ? fileKind(file) : null;

  input.value = "";

  if (file && !kind) {
    message.error("Choisissez une image ou une vidéo");
  }

  if (file && kind && file.size > WALLPAPER_FILE_MAX_SIZE) {
    message.error("Fichier trop lourd (100 Mo au maximum)");
  }

  if (file && kind && file.size <= WALLPAPER_FILE_MAX_SIZE) {
    saveFile(file, kind);
  }
}

watch(show, onOpen);

watch(unsplash, readUnsplash, { immediate: true });

watch(
  videos,
  current => {
    if (current) {
      videoForm.frequency = current.frequency;
    }
  },
  { immediate: true }
);
</script>

<template>
  <h-modal
    v-model:show="show"
    class="wallpaper-modal apple-menu"
    preset="card"
    title="Fond d'écran">
    <h-tabs v-model:value="tab" animated type="segment">
      <h-tab-pane name="presets" tab="Dégradés">
        <h-grid :cols="PREVIEW_COLUMNS" :x-gap="12" :y-gap="12" responsive="self" role="list">
          <h-grid-item v-for="preset in WALLPAPER_PRESETS" :key="preset.id" role="listitem">
            <h-button
              :aria-pressed="isPresetSelected(preset.id)"
              :class="{ selected: isPresetSelected(preset.id) }"
              class="preset"
              native-focus-behavior
              text
              @click="choosePreset(preset.id)">
              <span :style="{ background: presetPreview(preset.id) }" class="preview" />
              <span class="label">{{ preset.label }}</span>
            </h-button>
          </h-grid-item>
        </h-grid>
      </h-tab-pane>
      <h-tab-pane name="rotation" tab="Photos et vidéos">
        <h-radio-group v-model:value="rotationKind" class="kind">
          <h-radio-button value="photos">Photos Unsplash</h-radio-button>
          <h-radio-button value="videos">Vidéos</h-radio-button>
        </h-radio-group>
        <template v-if="rotationKind === 'photos'">
          <h-form :model="unsplashForm" label-placement="top">
            <h-form-item v-if="hasKey" label="Photos">
              <h-radio-group :value="unsplashForm.selection" @update:value="chooseSelection">
                <h-radio-button value="topic">D'un thème</h-radio-button>
                <h-radio-button value="collection">D'une collection</h-radio-button>
              </h-radio-group>
            </h-form-item>
            <h-form-item v-if="!hasKey || unsplashForm.selection === 'topic'" label="Thème">
              <h-select
                :options="UNSPLASH_TOPICS"
                :value="unsplashForm.topic"
                @update:value="updateTopic" />
            </h-form-item>
            <h-form-item
              v-else
              :feedback="collectionError"
              :validation-status="collectionError ? 'error' : undefined"
              label="Collection">
              <h-input-group>
                <h-input
                  v-model:value="unsplashForm.collection"
                  placeholder="https://unsplash.com/collections/…"
                  @keydown.enter.prevent="applyCollection" />
                <h-button
                  :disabled="!unsplash || !unsplashForm.collection.trim()"
                  type="primary"
                  @click="applyCollection">
                  Appliquer
                </h-button>
              </h-input-group>
            </h-form-item>
            <h-form-item label="Nouvelle photo">
              <h-select
                :options="FREQUENCY_OPTIONS"
                :value="unsplashForm.frequency"
                @update:value="updatePhotoFrequency" />
            </h-form-item>
            <h-form-item
              :feedback="keyError"
              :validation-status="keyError ? 'error' : undefined"
              label="Clé d'accès Unsplash (facultative)">
              <h-input-group>
                <h-input
                  v-model:value="keyForm.key"
                  :disabled="hasKey"
                  placeholder="Access Key de votre application Unsplash"
                  show-password-on="click"
                  type="password"
                  @keydown.enter.prevent="saveKey" />
                <h-button v-if="hasKey" @click="removeKey">Retirer</h-button>
                <h-button
                  v-else
                  :disabled="!keyForm.key.trim()"
                  :loading="checkingKey"
                  type="primary"
                  @click="saveKey">
                  Enregistrer
                </h-button>
              </h-input-group>
            </h-form-item>
          </h-form>
          <h-text class="key-help" depth="3" tag="p">
            Sans clé, les photos viennent d'une sélection Unsplash du site. Avec votre clé, gratuite
            sur
            <a href="https://unsplash.com/developers" rel="noopener" target="_blank">
              unsplash.com/developers
            </a>
            (« Access Key », jamais la « Secret Key »), vous pouvez aussi choisir une collection.
            Elle est enregistrée avec votre Buroh.
          </h-text>
          <h-flex justify="space-between">
            <h-text v-if="photoCredit" depth="3">
              Photo :
              <a
                :href="withReferral(photoCredit.authorUrl ?? photoCredit.photoUrl)"
                rel="noopener"
                target="_blank">
                {{ photoCredit.author }}
              </a>
            </h-text>
            <span v-else />
            <h-button v-if="!unsplash" type="primary" @click="useUnsplash">
              Utiliser Unsplash
            </h-button>
            <h-button v-else :loading="fetching" @click="nextPhoto">
              <template #icon>
                <font-awesome-icon icon="rotate" />
              </template>
              Autre photo
            </h-button>
          </h-flex>
        </template>
        <template v-else>
          <h-grid :cols="PREVIEW_COLUMNS" :x-gap="12" :y-gap="12" responsive="self" role="list">
            <h-grid-item v-for="video in WALLPAPER_VIDEOS" :key="video.id" role="listitem">
              <h-button
                :aria-pressed="isVideoSelected(video.id)"
                :class="{ selected: isVideoSelected(video.id) }"
                class="preset"
                native-focus-behavior
                text
                @click="chooseVideo(video.id)">
                <span class="preview">
                  <video :src="`${video.src}#t=8`" muted playsinline preload="metadata" />
                  <font-awesome-icon class="play" icon="play" />
                </span>
                <span class="label">{{ video.label }}</span>
              </h-button>
            </h-grid-item>
          </h-grid>
          <h-form :model="videoForm" class="rotation-form" label-placement="top">
            <h-form-item label="Nouvelle vidéo">
              <h-select
                :options="FREQUENCY_OPTIONS"
                :value="videoForm.frequency"
                @update:value="updateVideoFrequency" />
            </h-form-item>
          </h-form>
          <h-flex justify="space-between">
            <h-text v-if="currentVideo" depth="3">Vidéo : {{ currentVideo.credit }}</h-text>
            <span v-else />
            <h-button v-if="!videos" type="primary" @click="useVideos">
              Utiliser les vidéos
            </h-button>
            <h-button v-else :disabled="WALLPAPER_VIDEOS.length < 2" @click="nextVideo">
              <template #icon>
                <font-awesome-icon icon="rotate" />
              </template>
              Autre vidéo
            </h-button>
          </h-flex>
        </template>
      </h-tab-pane>
      <h-tab-pane name="custom" tab="Personnalisé">
        <h-form :model="customForm" label-placement="top" @submit="applyUrl">
          <h-form-item
            :feedback="urlError"
            :validation-status="urlError ? 'error' : undefined"
            label="Image ou vidéo depuis une adresse">
            <h-input-group>
              <h-input
                :value="customForm.url"
                placeholder="https://exemple.fr/fond.jpg"
                @update:value="updateUrl" />
              <h-select
                v-model:value="customForm.kind"
                :options="KIND_OPTIONS"
                class="kind-select" />
              <h-button :disabled="!customForm.url.trim()" type="primary" @click="applyUrl">
                Appliquer
              </h-button>
            </h-input-group>
          </h-form-item>
          <h-form-item label="Depuis votre ordinateur">
            <h-flex>
              <h-button :loading="saving" @click="fileInput?.click()">
                <template #icon>
                  <font-awesome-icon icon="upload" />
                </template>
                Choisir une image ou une vidéo
              </h-button>
              <h-text v-if="fileName" depth="3">{{ fileName }}</h-text>
            </h-flex>
            <input
              ref="fileInput"
              accept="image/*,video/*"
              class="file-input"
              type="file"
              @change="onFileChosen" />
          </h-form-item>
        </h-form>
        <h-text depth="3">
          Un fichier de l'ordinateur reste dans ce navigateur (100 Mo au maximum) : sur un autre
          appareil, Buroh affiche le fond par défaut. Les vidéos sont lues en boucle, sans son.
        </h-text>
      </h-tab-pane>
    </h-tabs>
  </h-modal>
</template>

<style lang="scss" scoped>
// Vignette : bouton texte de Naive (sans fond), aperçu au-dessus du nom
.preset {
  display: flex;
  width: 100%;
  height: auto;
  white-space: normal;

  :deep(.n-button__content) {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 6px;
    width: 100%;
  }

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

  // Nom toujours de la couleur du texte : la vignette choisie se repère à son contour
  .label {
    font-size: 0.85rem;
    text-align: center;
    color: var(--n-text-color);
  }

  &:hover .preview {
    outline-color: rgb(10 132 255 / 0.4);
  }

  &.selected .preview,
  &:focus-visible .preview {
    outline-color: rgb(10 132 255);
  }
}

.key-help {
  margin: 0 0 16px;
}

.kind {
  margin-bottom: 16px;
}

.rotation-form {
  margin-top: 16px;
}

.kind-select {
  flex: none;
  width: 7.5rem;
}

.file-input {
  display: none;
}
</style>

<style lang="scss">
.wallpaper-modal {
  width: min(640px, calc(100vw - 32px));
}
</style>
