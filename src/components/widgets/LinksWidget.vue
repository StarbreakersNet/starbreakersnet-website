<script lang="ts" setup>
import { computed, type PropType, reactive, ref } from "vue";
import HFlex from "@/components/c/hFlex.vue";
import HGrid from "@/components/c/hGrid.vue";
import HGridItem from "@/components/c/hGridItem.vue";
import { type FitState, useFitContent } from "@/composables/useFitContent";
import type { LinksSettings } from "@/types/Widget";

const props = defineProps({
  settings: {
    type: Object as PropType<LinksSettings>,
    required: true,
  },
});

const emit = defineEmits<{
  (e: "fit", state: FitState): void;
}>();

// Colonnes selon la largeur du widget : petit, moyen et grand
const COLUMNS = "2 160:3 260:4 340:5";

// Icônes servies par DuckDuckGo (seul le nom de domaine lui est transmis), lettre à défaut
const failedIcons = reactive(new Set<string>());

// Teinte stable par site, pour la lettre affichée sans icône
function hueOf(host: string) {
  const sum = [...host].reduce((total, char) => total + char.charCodeAt(0), 0);

  return sum % 360;
}

const links = computed(() =>
  props.settings.links.map(link => {
    const host = new URL(link.url).hostname;
    const title = link.title || host.replace(/^www\./, "");

    return {
      ...link,
      title,
      icon: `https://icons.duckduckgo.com/ip3/${host}.ico`,
      initial: title.charAt(0).toUpperCase(),
      hue: hueOf(host),
    };
  })
);

const target = computed(() => (props.settings.newTab ? "_blank" : undefined));

const rel = computed(() => (props.settings.newTab ? "noopener noreferrer" : undefined));

// Pas d'ascenseur : icônes réduites pour que tous les liens tiennent (voir useFitContent)
const root = ref<HTMLElement | null>(null);

const { overflowing } = useFitContent(root, [links], {
  onFit: state => emit("fit", state),
});
</script>

<template>
  <div ref="root" :class="{ clipped: overflowing }" class="links">
    <h-flex v-if="links.length === 0" class="empty" justify="center">
      Aucun lien pour l'instant. Ajoutez-en dans les réglages du widget.
    </h-flex>
    <h-grid v-else :cols="COLUMNS" :x-gap="6" :y-gap="8" responsive="self" role="list">
      <h-grid-item v-for="link in links" :key="link.id" role="listitem">
        <a :href="link.url" :rel="rel" :target="target" :title="link.url" class="link">
          <span class="icon">
            <img
              v-if="!failedIcons.has(link.id)"
              :src="link.icon"
              alt=""
              loading="lazy"
              referrerpolicy="no-referrer"
              @error="failedIcons.add(link.id)" />
            <span v-else :style="{ background: `hsl(${link.hue} 55% 45%)` }" class="initial">
              {{ link.initial }}
            </span>
          </span>
          <span class="title">{{ link.title }}</span>
        </a>
      </h-grid-item>
    </h-grid>
  </div>
</template>

<style lang="scss" scoped>
// Tailles en em, proportionnelles à --fit
.links {
  width: 100%;
  height: 100%;
  padding: 14px;
  overflow: hidden;
  font-size: calc(var(--fit, 1) * 15px);

  &.clipped {
    mask-image: linear-gradient(to bottom, #000 80%, transparent);
  }
}

.empty {
  height: 100%;
  padding: 0 0.5rem;
  text-align: center;
  font-size: 0.9rem;
  color: var(--glass-text-soft);
}

.link {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4em;
  padding: 0.4em 0.15em;
  border-radius: 0.9em;
  transition: background 0.2s ease;

  &:hover {
    background: var(--glass-control);
  }

  &:focus-visible {
    outline: 2px solid rgb(10 132 255);
  }
}

.icon {
  display: grid;
  place-items: center;
  width: 3em;
  height: 3em;
  border-radius: 0.8em;
  background: rgb(255 255 255 / 0.9);
  box-shadow: 0 2px 8px rgb(0 0 0 / 0.15);
  overflow: hidden;

  img {
    width: 1.85em;
    height: 1.85em;
    object-fit: contain;
  }

  .initial {
    display: grid;
    place-items: center;
    width: 100%;
    height: 100%;
    color: white;
    font-size: 1.2em;
    font-weight: 700;
  }
}

.title {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.8em;
  color: var(--glass-text);
}
</style>
