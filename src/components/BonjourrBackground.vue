<script lang="ts" setup>
// Le fond de la page : image ou vidéo de collection, URL maison, ou couleur
// unie, avec ses filtres et son crédit. Sources : features/backgrounds/index.ts
// (`initBackgrounds` l.66-111, `applyBackground` couleur l.630-633,
// `removeBackgrounds` l.770-774, `applyFilters` l.776-789), backgrounds/urls.ts
// (rotation l.21-51), backgrounds/credits.ts l.40-121, src/index.html
// l.468-471 (`#background-wrapper` > `#background-media`, `#background-color`)
// et l.676-677 (`#credit-container` > `#credit`).
// Écart assumé : le fork garde la ligne de crédit « Photo par Emblavoss » du
// modèle affichage_bonjourr.png quand l’API ne fournit pas d’auteur.

import { computed, onMounted, ref, watch } from "vue";
import {
  buildBackgroundUrls,
  creditFor,
  filtersFor,
  parseUrlList,
  resolveBackground,
  type Background,
  type BackgroundImage,
  type BackgroundUrlMetadata,
  type LocalBackgrounds,
} from "@/bonjourr/backgrounds";
import { backgroundRefreshTick } from "@/bonjourr/events";
import { readLocalStore, writeLocalStore } from "@/bonjourr/local";
import { useBonjourrStore } from "@/stores/bonjourr";

/** Crédit du modèle fournie, quand le média n’a pas d’auteur connu. */
const DEFAULT_CREDIT = "Photo par Emblavoss";

const settings = useBonjourrStore();
const media = ref<Background | undefined>(undefined);
const solidColor = ref<string | undefined>(undefined);

const credit = computed(() => creditFor(media.value) || DEFAULT_CREDIT);
const isVideo = computed(() => media.value?.format === "video");
/** Le fondu d’origine (index.ts l.786 : `--fade-in` de 0 à 1200 ms). */
const isFading = computed(() => settings.config.backgrounds.fadein > 0);

function readLocal(): LocalBackgrounds {
  const store = readLocalStore();

  return {
    backgroundUrls: (store.backgroundUrls as Record<string, BackgroundUrlMetadata> | undefined) ?? {},
    backgroundCollections:
      (store.backgroundCollections as Record<string, Background[]> | undefined) ?? {},
    backgroundLastChange: store.backgroundLastChange as string | undefined,
  };
}

function writeLocal(local: LocalBackgrounds): void {
  writeLocalStore({
    backgroundUrls: local.backgroundUrls,
    backgroundCollections: local.backgroundCollections,
    backgroundLastChange: local.backgroundLastChange,
  });
}

/**
 * La liste d’URL des réglages devient le magasin local (urls.ts l.188-200) ;
 * une liste identique ne repart pas de zéro, sinon rien ne tournerait.
 */
function seedUrls(local: LocalBackgrounds): LocalBackgrounds {
  const urls = parseUrlList(settings.config.backgrounds.urls);
  const stored = Object.keys(local.backgroundUrls);
  const unchanged =
    stored.length === urls.length && urls.every((url) => stored.includes(url));

  if (!unchanged) {
    local.backgroundUrls = buildBackgroundUrls(urls, "OK");
  }

  return local;
}

async function applyBackground(needNew?: boolean): Promise<void> {
  const backgrounds = settings.config.backgrounds;
  const local = backgrounds.type === "urls" ? seedUrls(readLocal()) : readLocal();
  const resolved = await resolveBackground(backgrounds, local, { needNew });

  writeLocal(resolved.local);

  const isColor = typeof resolved.background === "string";
  media.value = isColor ? undefined : resolved.background;
  solidColor.value = isColor ? resolved.background : undefined;

  const root = document.documentElement;
  if (solidColor.value) {
    root.style.setProperty("--solid-background", solidColor.value);
  } else {
    root.style.removeProperty("--solid-background");
  }

  // « Verrouillé » : l’image figée repart dans les réglages (l.425-433).
  if (resolved.paused && backgrounds.type === "images") {
    const paused = resolved.paused as BackgroundImage;

    if (settings.config.backgrounds.pausedImage?.urls.full !== paused.urls.full) {
      settings.patch({ backgrounds: { pausedImage: paused } });
    }
  }
}

/** Variables de filtre, posées même quand le fond échoue (l.776-789). */
function applyFilters(): void {
  const { vars, blurred } = filtersFor(settings.config.backgrounds);

  for (const [name, value] of Object.entries(vars)) {
    document.documentElement.style.setProperty(name, value);
  }

  document.body.classList.toggle("blurred", blurred);
}

onMounted(() => {
  applyFilters();
  void applyBackground();
});

watch(
  () => [
    settings.config.backgrounds.blur,
    settings.config.backgrounds.bright,
    settings.config.backgrounds.fadein,
  ],
  applyFilters,
);

// `pausedImage` est hors signature : c’est le composant qui l’écrit, pas l’utilisateur.
watch(
  () =>
    JSON.stringify([
      settings.config.backgrounds.type,
      settings.config.backgrounds.frequency,
      settings.config.backgrounds.color,
      settings.config.backgrounds.urls,
      settings.config.backgrounds.images,
      settings.config.backgrounds.videos,
      settings.config.backgrounds.queries,
    ]),
  () => {
    void applyBackground();
  },
);

// Le « Arrière-plan suivant » du panneau, équivalent de `{ refresh: true }`.
watch(backgroundRefreshTick, () => {
  void applyBackground(true);
});
</script>

<template>
  <div
    id="background-wrapper"
    class="bonjourr-background"
    :class="{ 'fade-in': isFading }"
    :data-type="settings.config.backgrounds.type"
    aria-hidden="true">
    <div id="background-media">
      <video
        v-if="isVideo && media"
        class="bonjourr-background-image bonjourr-background-video"
        :src="media.urls.full"
        :muted="settings.config.backgrounds.mute"
        autoplay
        loop
        playsinline />
      <img v-else-if="media" class="bonjourr-background-image" :src="media.urls.full" alt="" />
    </div>
    <div v-if="solidColor" id="background-color"></div>
  </div>
  <div id="credit-container" class="photo-credit">
    <span id="credit">{{ credit }}</span>
  </div>
</template>

<style lang="sass">
// Non scopé : la racine du composant est un fragment, et ces éléments
// s’insèrent dans la vue hôte (src/index.html l.468 du projet d’origine).
.bonjourr-background
  position: absolute
  top: 0
  right: 0
  bottom: 0
  left: 0
  z-index: -1
  overflow: hidden
  background: linear-gradient(180deg, #8a7fc0 0%, #6a5fa0 55%, #3a3360 100%)
  transition: opacity var(--fade-in, 600ms)

  #background-media
    position: absolute
    inset: 0

    img,
    video
      width: 101%
      height: 101%
      object-fit: cover
      transform: scale(1.02)
      filter: blur(var(--blur, 0)) brightness(var(--brightness, 0.8))

  #background-color
    position: absolute
    inset: 0
    background: var(--solid-background, #185A63)

.photo-credit
  position: absolute
  left: 2em
  bottom: 1.5em
  font-size: .9em
  opacity: .85
</style>
