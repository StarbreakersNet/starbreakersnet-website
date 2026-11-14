<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import AnimatedWallpaper from "@/components/widgets/AnimatedWallpaper.vue";
import { createBackdrop } from "@/utils/backdrop";
import { fetchRandomPhoto, withReferral } from "@/utils/unsplash";
import { loadWallpaperFile } from "@/utils/wallpaperFile";
import { isStale, pickVideo, presetById, videoById, WALLPAPER_PRESETS } from "@/models/wallpapers";
import { useMessage } from "@/composables/useMessage";
import { useUserStore } from "@/stores/user";
import { useWidgetsStore } from "@/stores/widgets";
import type {
  MediaKind,
  UnsplashWallpaper,
  VideosWallpaper,
  WallpaperAppearance,
} from "@/types/Wallpaper";

// Fond d'écran de Buroh, en plein écran derrière les widgets. Le dégradé par défaut reste dessous
// pendant le chargement d'une photo ou d'une vidéo, et en cas d'échec.

const emit = defineEmits<{
  (e: "appearance", appearance: WallpaperAppearance): void;
}>();

const store = useWidgetsStore();
const user = useUserStore();
const message = useMessage();

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const GRADIENT_APPEARANCE: WallpaperAppearance = { kind: "gradient", backdrop: null };

const wallpaper = computed(() => store.wallpaper);

// --- Dégradé (préréglage choisi, ou celui par défaut sous les médias)

const gradient = computed(() => {
  const current = wallpaper.value;
  const preset = current.source === "preset" ? presetById(current.preset) : WALLPAPER_PRESETS[0]!;
  const { dark, light } = preset.gradient;

  return user.settings.theme === "light" ? (light ?? dark) : dark;
});

const motion = computed(() => {
  const current = wallpaper.value;

  return current.source === "preset" ? (presetById(current.preset).motion ?? null) : null;
});

// --- Média affiché par-dessus

const fileUrl = ref<string | null>(null);
const loaded = ref(false);
const failed = ref(false);

const media = computed<{ kind: MediaKind; src: string } | null>(() => {
  const current = wallpaper.value;
  let result: { kind: MediaKind; src: string } | null = null;

  if (current.source === "videos") {
    const video = videoById(current.video?.id);

    result = video ? { kind: "video", src: video.src } : null;
  }

  if (current.source === "unsplash" && current.photo) {
    result = { kind: "image", src: current.photo.url };
  }

  if (current.source === "url") {
    result = { kind: current.kind, src: current.url };
  }

  if (current.source === "file" && fileUrl.value) {
    result = { kind: current.kind, src: fileUrl.value };
  }

  return result;
});

const credit = computed(() => {
  const current = wallpaper.value;

  return current.source === "unsplash" ? current.photo : null;
});

const videoCredit = computed(() => {
  const current = wallpaper.value;

  return current.source === "videos" ? (videoById(current.video?.id)?.credit ?? null) : null;
});

// Fichier de l'ordinateur, relu depuis le navigateur à chaque nouveau fichier choisi
async function readFile(addedAt: string | null) {
  if (fileUrl.value) {
    URL.revokeObjectURL(fileUrl.value);
  }

  fileUrl.value = null;

  if (addedAt !== null) {
    const file = await loadWallpaperFile();

    if (file) {
      fileUrl.value = URL.createObjectURL(file);
    } else {
      // Fichier absent de ce navigateur (autre appareil) : dégradé par défaut
      emit("appearance", GRADIENT_APPEARANCE);
    }
  }
}

function onMediaChange() {
  loaded.value = false;
  failed.value = false;
  emit("appearance", GRADIENT_APPEARANCE);
}

async function onLoaded() {
  const current = media.value;

  loaded.value = true;

  if (current) {
    const backdrop = current.kind === "image" ? await createBackdrop(current.src) : null;

    // Média inchangé pendant le calcul de la miniature
    if (media.value?.src === current.src) {
      emit("appearance", { kind: current.kind, backdrop });
    }
  }
}

function onError() {
  failed.value = true;
  emit("appearance", GRADIENT_APPEARANCE);
  message.error("Impossible d'afficher ce fond d'écran : retour au dégradé");
}

// Vidéo avec « Réduire les animations » : première image, sans lecture
function onVideoMetadata(event: Event) {
  if (reducedMotion) {
    (event.target as HTMLVideoElement).currentTime = 0.1;
  }
}

// --- Photo Unsplash ou vidéo de la sélection, renouvelée selon le rythme choisi

function refreshVideo(current: VideosWallpaper) {
  if (isStale(current.video?.pickedAt, current.frequency)) {
    const video = pickVideo(current.video?.id);

    store.setWallpaper({
      ...current,
      video: { id: video.id, pickedAt: new Date().toISOString() },
    });
  }
}

// Sans clé, ou si Unsplash ne répond pas : la photo actuelle reste, sinon le dégradé par défaut
async function refreshPhoto(current: UnsplashWallpaper) {
  if (store.unsplashKey && isStale(current.photo?.fetchedAt, current.frequency)) {
    try {
      const photo = await fetchRandomPhoto(current, store.unsplashKey);

      // Fond inchangé pendant la requête
      if (store.wallpaper === current) {
        store.setWallpaper({ ...current, photo });
      }
    } catch {
      if (!current.photo) {
        message.error("Impossible de récupérer une photo Unsplash pour le moment");
      }
    }
  }
}

function refresh() {
  const current = wallpaper.value;

  if (current.source === "videos") {
    refreshVideo(current);
  }

  if (current.source === "unsplash") {
    refreshPhoto(current);
  }
}

// Clé qui change avec le thème, la collection ou le média choisi
const rotationKey = computed(() => {
  const current = wallpaper.value;
  let key: string | null = null;

  if (current.source === "unsplash") {
    key = `${current.topic}|${current.collection}|${current.photo?.id ?? ""}`;
  }

  if (current.source === "videos") {
    key = `videos|${current.video?.id ?? ""}`;
  }

  return key;
});

watch(() => (wallpaper.value.source === "file" ? wallpaper.value.addedAt : null), readFile, {
  immediate: true,
});

watch(() => media.value?.src, onMediaChange);

watch(rotationKey, key => {
  if (key) {
    refresh();
  }
});

watch(() => store.unsplashKey, refresh);

onMounted(refresh);

onBeforeUnmount(() => {
  if (fileUrl.value) {
    URL.revokeObjectURL(fileUrl.value);
  }
});
</script>

<template>
  <div aria-hidden="true" class="wallpaper" :style="{ background: gradient }">
    <animated-wallpaper v-if="motion" :light="user.settings.theme === 'light'" :motion="motion" />
    <template v-if="media && !failed">
      <img
        v-if="media.kind === 'image'"
        :key="media.src"
        :class="{ loaded }"
        :src="media.src"
        alt=""
        class="media"
        decoding="async"
        @error="onError"
        @load="onLoaded" />
      <video
        v-else
        :key="media.src"
        :autoplay="!reducedMotion"
        :class="{ loaded }"
        :src="media.src"
        class="media"
        disablepictureinpicture
        loop
        muted
        playsinline
        preload="auto"
        @error="onError"
        @loadeddata="onLoaded"
        @loadedmetadata="onVideoMetadata" />
    </template>
  </div>
  <p v-if="credit" class="credit">
    Photo :
    <a :href="withReferral(credit.authorUrl ?? credit.photoUrl)" rel="noopener" target="_blank">
      {{ credit.author }}
    </a>
    sur
    <a :href="withReferral(credit.photoUrl)" rel="noopener" target="_blank">Unsplash</a>
  </p>
  <p v-else-if="videoCredit" class="credit">Vidéo : {{ videoCredit }}</p>
</template>

<style lang="scss" scoped>
.wallpaper {
  position: fixed;
  inset: 0;
  z-index: -1;
  overflow: hidden;
  transition: background 0.5s ease;
}

.media {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transition: opacity 0.6s ease;

  &.loaded {
    opacity: 1;
  }
}

.credit {
  position: fixed;
  left: 16px;
  bottom: 12px;
  z-index: 1;
  font-size: 0.75rem;
  color: rgb(255 255 255 / 0.8);
  text-shadow: 0 1px 3px rgb(0 0 0 / 0.6);

  a {
    text-decoration: underline;
    text-underline-offset: 2px;
  }
}
</style>
