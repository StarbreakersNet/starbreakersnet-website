<script lang="ts" setup>
import { computed, reactive, ref } from "vue";
import { type FitState, useFitContent } from "@/composables/useFitContent";
import type { LinksSettings } from "@/types/Widget";

const props = defineProps<{
  settings: LinksSettings;
}>();

const emit = defineEmits<{
  fit: [state: FitState];
}>();

// Icônes servies par DuckDuckGo (seul le nom de domaine lui est transmis), lettre à défaut
const failedIcons = reactive(new Set<string>());

const links = computed(() =>
  props.settings.links.map(link => {
    const host = new URL(link.url).hostname;
    const title = link.title || host.replace(/^www\./, "");
    return {
      ...link,
      title,
      icon: `https://icons.duckduckgo.com/ip3/${host}.ico`,
      initial: title.charAt(0).toUpperCase(),
      hue: [...host].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 360,
    };
  })
);

// Pas d'ascenseur : icônes réduites pour que tous les liens tiennent (voir useFitContent)
const root = ref<HTMLElement | null>(null);
const { overflowing } = useFitContent(root, [links], {
  onFit: state => emit("fit", state),
});
</script>

<template>
  <div ref="root" :class="{ clipped: overflowing }" class="links">
    <p v-if="links.length === 0" class="empty">
      Aucun lien pour l'instant. Ajoutez-en dans les réglages du widget.
    </p>
    <ul v-else class="grid">
      <li v-for="link in links" :key="link.id">
        <a
          :href="link.url"
          :rel="props.settings.newTab ? 'noopener noreferrer' : undefined"
          :target="props.settings.newTab ? '_blank' : undefined"
          :title="link.url"
          class="link">
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
      </li>
    </ul>
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
  display: grid;
  place-items: center;
  height: 100%;
  padding: 0 0.5rem;
  text-align: center;
  font-size: 0.9rem;
  color: var(--glass-text-soft);
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(4.8em, 1fr));
  gap: 0.6em 0.4em;
  padding: 0;
  list-style: none;
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
