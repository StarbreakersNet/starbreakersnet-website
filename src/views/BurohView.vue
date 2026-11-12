<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import BurohWallpaper from "@/components/widgets/BurohWallpaper.vue";
import WallpaperModal from "@/components/widgets/WallpaperModal.vue";
import WidgetFrame from "@/components/widgets/WidgetFrame.vue";
import WidgetGallery from "@/components/widgets/WidgetGallery.vue";
import WidgetGrid, { type GridItem } from "@/components/widgets/WidgetGrid.vue";
import WidgetSettingsModal from "@/components/widgets/WidgetSettingsModal.vue";
import { WIDGET_COMPONENTS } from "@/components/widgets/registry";
import {
  GRID_COLUMNS,
  MOBILE_COLUMNS,
  mobileLayout,
  WIDGET_DEFINITIONS,
  WIDGET_SIZES,
} from "@/models/widgets";
import { useWidgetsStore } from "@/stores/widgets";
import type { FitState } from "@/composables/useFitContent";
import type { WallpaperAppearance } from "@/types/Wallpaper";
import type { WidgetSize, WidgetType } from "@/types/Widget";

// Buroh, page d'accueil à widgets à la manière du bureau de macOS : grille libre où l'on place
// et règle ses widgets.
// Sur petit écran, grille de 4 colonnes (deux petits widgets par ligne), avec sa propre disposition :
// déplacer un widget sur mobile ne change pas la disposition de l'ordinateur.

const GAP = 16;
const MOBILE_GAP = 14;
const MOBILE_QUERY = "(max-width: 720px)";
// Barre d'outils masquée après ce délai sans activité (souris, clavier, toucher)
const TOOLBAR_IDLE_DELAY = 1500;

const store = useWidgetsStore();

const editing = ref(false);
const configuredId = ref<string | null>(null);

// --- Petit écran

const mobileQuery = window.matchMedia(MOBILE_QUERY);
const isMobile = ref(mobileQuery.matches);
const onMobileChange = (event: MediaQueryListEvent) => (isMobile.value = event.matches);
onMounted(() => mobileQuery.addEventListener("change", onMobileChange));
onBeforeUnmount(() => mobileQuery.removeEventListener("change", onMobileChange));

// --- Grille (voir components/widgets/WidgetGrid.vue)

const gridItems = computed<GridItem[]>(() => {
  const mobile = isMobile.value ? mobileLayout(store.widgets) : null;
  return store.widgets.map(widget => ({
    id: widget.id,
    ...(mobile?.get(widget.id) ?? { x: widget.x, y: widget.y }),
    ...WIDGET_SIZES[widget.size],
  }));
});

const widgetsById = computed(() => new Map(store.widgets.map(widget => [widget.id, widget])));

function onMoved(positions: { id: string; x: number; y: number }[]) {
  store.move(positions, isMobile.value ? "mobile" : "desktop");
}

// --- Édition

// Sur mobile, la galerie couvrirait les widgets à déplacer : elle s'ouvre avec le bouton « + »,
// comme sur iPhone, et se referme après un ajout
const galleryOpen = ref(false);
const showGallery = computed(() => editing.value && (!isMobile.value || galleryOpen.value));

function addWidget(type: WidgetType, size: WidgetSize) {
  galleryOpen.value = false;
  const widget = store.add(type, size);
  // Un widget sans contenu par défaut s'ouvre directement sur ses réglages
  if (type === "links") {
    configuredId.value = widget.id;
  }
}

function closeSettings() {
  configuredId.value = null;
  store.stopGrowing();
}

function toggleEditing() {
  editing.value = !editing.value;
  galleryOpen.value = false;
  if (!editing.value) {
    configuredId.value = null;
  }
}

// --- Fond d'écran

const showWallpaper = ref(false);
const appearance = ref<WallpaperAppearance>({ kind: "gradient", backdrop: null });

// Miniature floue du fond pour le verre des widgets (voir lib/backdrop.ts)
const burohStyle = computed(() =>
  appearance.value.backdrop ? { "--wallpaper-backdrop": `url("${appearance.value.backdrop}")` } : {}
);

// --- Barre d'outils discrète : elle s'efface quand on ne fait rien, et revient au moindre
// mouvement de souris, appui sur une touche ou toucher. Toujours visible en mode édition.

const awake = ref(true);
const toolbarHovered = ref(false);
const toolbarFocused = ref(false);
let idleTimer: ReturnType<typeof setTimeout> | undefined;

function wake() {
  awake.value = true;
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => (awake.value = false), TOOLBAR_IDLE_DELAY);
}

const ACTIVITY_EVENTS = ["pointermove", "pointerdown", "keydown", "wheel"] as const;
onMounted(() => {
  wake();
  ACTIVITY_EVENTS.forEach(event => window.addEventListener(event, wake, { passive: true }));
});
onBeforeUnmount(() => {
  clearTimeout(idleTimer);
  ACTIVITY_EVENTS.forEach(event => window.removeEventListener(event, wake));
});

// --- Menu du clic droit sur le Buroh, comme sur macOS

const menu = ref({ show: false, x: 0, y: 0 });

const menuOptions = computed(() => [
  { key: "edit", label: editing.value ? "Terminer la modification" : "Modifier les widgets" },
  { key: "wallpaper", label: "Changer le fond d'écran…" },
]);

function onContextMenu(event: MouseEvent) {
  // Menu du navigateur conservé sur les liens et les champs de saisie
  if ((event.target as Element).closest("a, input, textarea, [contenteditable]")) return;
  event.preventDefault();
  menu.value = { show: true, x: event.clientX, y: event.clientY };
}

function onMenuSelect(key: string) {
  menu.value.show = false;
  if (key === "edit") toggleEditing();
  if (key === "wallpaper") showWallpaper.value = true;
}

const toolbarVisible = computed(
  () =>
    editing.value ||
    awake.value ||
    toolbarHovered.value ||
    toolbarFocused.value ||
    showWallpaper.value ||
    menu.value.show
);
</script>

<template>
  <main
    :class="{ editing, 'has-backdrop': !!appearance.backdrop }"
    :data-wallpaper="appearance.kind"
    :style="burohStyle"
    class="buroh"
    @contextmenu="onContextMenu">
    <buroh-wallpaper @appearance="appearance = $event" />

    <widget-grid
      :key="isMobile ? 'mobile' : 'desktop'"
      :class="{ mobile: isMobile }"
      :columns="isMobile ? MOBILE_COLUMNS : GRID_COLUMNS"
      :list="isMobile"
      :editable="editing"
      :gap="isMobile ? MOBILE_GAP : GAP"
      :items="gridItems"
      class="grid"
      @moved="onMoved">
      <template #item="{ id }">
        <widget-frame
          v-if="widgetsById.get(id)"
          :editing="editing"
          :label="WIDGET_DEFINITIONS[widgetsById.get(id)!.type].label"
          @configure="configuredId = id"
          @remove="store.remove(id)">
          <component
            :is="WIDGET_COMPONENTS[widgetsById.get(id)!.type].view"
            :settings="widgetsById.get(id)!.settings"
            :size="widgetsById.get(id)!.size"
            @fit="(state: FitState) => store.growIfCramped(id, state)" />
        </widget-frame>
      </template>
    </widget-grid>

    <div class="dock">
      <transition name="slide-up">
        <widget-gallery v-if="showGallery" @add="addWidget" />
      </transition>
      <div
        :class="{ hidden: !toolbarVisible }"
        class="toolbar liquid-glass liquid-glass--overlay"
        @focusin="toolbarFocused = true"
        @focusout="toolbarFocused = false"
        @pointerenter="toolbarHovered = true"
        @pointerleave="toolbarHovered = false">
        <button
          v-if="editing && isMobile"
          :aria-expanded="galleryOpen"
          class="glass-button"
          type="button"
          @click="galleryOpen = !galleryOpen">
          <font-awesome-icon :icon="galleryOpen ? 'xmark' : 'plus'" />
          <span class="label">{{ galleryOpen ? "Fermer la galerie" : "Ajouter un widget" }}</span>
        </button>
        <button class="glass-button" type="button" @click="showWallpaper = true">
          <font-awesome-icon icon="image" />
          <span class="label">Fond d'écran</span>
        </button>
        <n-popconfirm
          v-if="editing"
          negative-text="Annuler"
          positive-text="Réinitialiser"
          @positive-click="store.reset()">
          <template #trigger>
            <button class="glass-button" type="button">
              <font-awesome-icon icon="rotate-left" />
              <span class="label">Réinitialiser</span>
            </button>
          </template>
          Remplacer vos widgets par ceux d'origine ?
        </n-popconfirm>
        <button
          :class="{ primary: editing }"
          class="glass-button"
          type="button"
          @click="toggleEditing">
          <font-awesome-icon :icon="editing ? 'check' : 'pen'" />
          <span class="label">{{ editing ? "Terminé" : "Modifier les widgets" }}</span>
        </button>
      </div>
    </div>

    <widget-settings-modal :widget-id="configuredId" @close="closeSettings" />
    <wallpaper-modal v-model:show="showWallpaper" />
    <n-dropdown
      :options="menuOptions"
      :show="menu.show"
      :x="menu.x"
      :y="menu.y"
      placement="bottom-start"
      trigger="manual"
      @clickoutside="menu.show = false"
      @select="onMenuSelect" />
  </main>
</template>

<style lang="scss" scoped>
.buroh {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  max-width: 1320px;
  flex: 1;
  margin: 0 auto;
}

// Verre sur une photo ou une vidéo : plus couvrant, pour que le texte reste lisible
.buroh[data-wallpaper="image"],
.buroh[data-wallpaper="video"] {
  --glass-bg: rgb(28 22 26 / 0.5);

  :root[data-theme="light"] & {
    --glass-bg: rgb(255 255 255 / 0.62);
  }
}

// Photo : verre dépoli, avec la miniature floue du fond derrière chaque widget, alignée sur le
// fond (fixed). Calculée une fois, sans backdrop-filter.
.buroh.has-backdrop {
  --glass-bg: rgb(28 22 26 / 0.22);

  :root[data-theme="light"] & {
    --glass-bg: rgb(255 255 255 / 0.4);
  }

  :deep(.widget.liquid-glass) {
    background:
      radial-gradient(120% 90% at 0% 0%, var(--glass-sheen), transparent 55%),
      linear-gradient(var(--glass-bg), var(--glass-bg)),
      var(--wallpaper-backdrop) center / cover fixed;
  }
}

.grid {
  flex: 1;
  // Demi-espace de la grille autour des widgets : on le reprend pour les aligner sur la page
  margin: calc(-1 * var(--grid-gap) / 2);
  margin-bottom: 0;
  --grid-gap: 16px;

  &.mobile {
    --grid-gap: 14px;
  }
}

.dock {
  position: sticky;
  bottom: 16px;
  z-index: 20;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin-top: auto;
  pointer-events: none;

  > * {
    pointer-events: auto;
  }

  .gallery {
    width: min(100%, 980px);
  }
}

.toolbar {
  --glass-radius: 999px;
  display: flex;
  gap: 8px;
  padding: 6px;
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;

  &.hidden {
    opacity: 0;
    transform: translateY(12px) scale(0.96);
    pointer-events: none;
  }

  .glass-button {
    white-space: nowrap;
  }

  // Petit écran : icônes seules (libellés gardés pour les lecteurs d'écran), sauf « Terminé »
  @media (max-width: 720px) {
    .glass-button:not(.primary) {
      width: 2.25rem;
      padding: 0;

      .label {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip-path: inset(50%);
        white-space: nowrap;
      }
    }
  }

  .glass-button.primary {
    color: white;
    background: rgb(10 132 255);

    &:hover {
      background: rgb(64 156 255);
    }
  }
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition:
    transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1),
    opacity 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(24px);
  opacity: 0;
}
</style>
