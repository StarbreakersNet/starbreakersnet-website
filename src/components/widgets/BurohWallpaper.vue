<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { createBackdrop } from "@/lib/backdrop";
import { fetchRandomPhoto, withReferral } from "@/lib/unsplash";
import { loadWallpaperFile } from "@/lib/wallpaperFile";
import { isStale, pickVideo, presetById, videoById, WALLPAPER_PRESETS } from "@/models/wallpapers";
import { useMessage } from "@/composables/useMessage";
import { useUserStore } from "@/stores/user";
import { useWidgetsStore } from "@/stores/widgets";
import type { MediaKind, WallpaperAppearance } from "@/types/Wallpaper";

// Fond d'écran de Buroh, en plein écran derrière les widgets. Le dégradé par défaut reste dessous
// pendant le chargement d'une photo ou d'une vidéo, et en cas d'échec.

const emit = defineEmits<{
  appearance: [appearance: WallpaperAppearance];
}>();

const store = useWidgetsStore();
const user = useUserStore();
const message = useMessage();

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const wallpaper = computed(() => store.wallpaper);

// --- Dégradé (préréglage choisi, ou celui par défaut sous les médias)

const gradient = computed(() => {
  const current = wallpaper.value;
  const preset = current.source === "preset" ? presetById(current.preset) : WALLPAPER_PRESETS[0]!;
  const { dark, light } = preset.gradient;
  return user.settings.theme === "light" ? (light ?? dark) : dark;
});

// --- Média affiché par-dessus

const fileUrl = ref<string | null>(null);
const loaded = ref(false);
const failed = ref(false);

const media = computed<{ kind: MediaKind; src: string } | null>(() => {
  const current = wallpaper.value;
  switch (current.source) {
    case "videos": {
      const video = videoById(current.video?.id);
      return video ? { kind: "video", src: video.src } : null;
    }
    case "unsplash":
      return current.photo ? { kind: "image", src: current.photo.url } : null;
    case "url":
      return { kind: current.kind, src: current.url };
    case "file":
      return fileUrl.value ? { kind: current.kind, src: fileUrl.value } : null;
  }
  return null;
});

const credit = computed(() => {
  const current = wallpaper.value;
  return current.source === "unsplash" && current.photo ? current.photo : null;
});

const videoCredit = computed(() => {
  const current = wallpaper.value;
  return current.source === "videos" ? (videoById(current.video?.id)?.credit ?? null) : null;
});

// Fichier de l'ordinateur, relu depuis le navigateur à chaque nouveau fichier choisi
watch(
  () => (wallpaper.value.source === "file" ? wallpaper.value.addedAt : null),
  async addedAt => {
    if (fileUrl.value) URL.revokeObjectURL(fileUrl.value);
    fileUrl.value = null;
    if (addedAt === null) return;

    const file = await loadWallpaperFile();
    if (file) {
      fileUrl.value = URL.createObjectURL(file);
    } else {
      // Fichier absent de ce navigateur (autre appareil) : dégradé par défaut
      emit("appearance", { kind: "gradient", backdrop: null });
    }
  },
  { immediate: true }
);
onBeforeUnmount(() => {
  if (fileUrl.value) URL.revokeObjectURL(fileUrl.value);
});

watch(
  () => media.value?.src,
  () => {
    loaded.value = false;
    failed.value = false;
    emit("appearance", { kind: "gradient", backdrop: null });
  }
);

async function onLoaded() {
  loaded.value = true;
  const current = media.value;
  if (!current) return;

  const backdrop = current.kind === "image" ? await createBackdrop(current.src) : null;
  // Média changé entre-temps
  if (media.value?.src !== current.src) return;
  emit("appearance", { kind: current.kind, backdrop });
}

function onError() {
  failed.value = true;
  emit("appearance", { kind: "gradient", backdrop: null });
  message.error("Impossible d'afficher ce fond d'écran : retour au dégradé");
}

// Vidéo avec « Réduire les animations » : première image, sans lecture
function onVideoMetadata(event: Event) {
  if (reducedMotion) {
    (event.target as HTMLVideoElement).currentTime = 0.1;
  }
}

// --- Photo Unsplash ou vidéo de la sélection, renouvelée selon le rythme choisi

async function refresh() {
  const current = wallpaper.value;

  if (current.source === "videos" && isStale(current.video?.pickedAt, current.frequency)) {
    const video = pickVideo(current.video?.id);
    store.setWallpaper({ ...current, video: { id: video.id, pickedAt: new Date().toISOString() } });
    return;
  }

  if (current.source !== "unsplash" || !isStale(current.photo?.fetchedAt, current.frequency))
    return;

  try {
    const photo = await fetchRandomPhoto(current);
    // Fond changé pendant la requête
    if (store.wallpaper !== current) return;
    store.setWallpaper({ ...current, photo });
  } catch {
    if (!current.photo) {
      message.error("Impossible de récupérer une photo Unsplash pour le moment");
    }
  }
}

onMounted(refresh);
watch(
  () => {
    const current = wallpaper.value;
    if (current.source === "unsplash") {
      return `${current.topic}|${current.collection}|${current.photo?.id ?? ""}`;
    }
    return current.source === "videos" ? `videos|${current.video?.id ?? ""}` : null;
  },
  key => key && refresh()
);
</script>

<template>
  <div aria-hidden="true" class="wallpaper" :style="{ background: gradient }">
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
