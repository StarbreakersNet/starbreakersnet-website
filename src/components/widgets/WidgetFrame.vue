<script lang="ts" setup>
import HButton from "@/components/c/hButton.vue";

// Cadre commun des widgets : verre Liquid Glass et, en mode édition, boutons Supprimer et Réglages.

const props = defineProps({
  label: {
    type: String,
    required: true,
  },
  editing: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits<{
  (e: "remove"): void;
  (e: "configure"): void;
}>();
</script>

<template>
  <article
    :aria-label="props.label"
    :class="{ editing: props.editing }"
    class="widget liquid-glass">
    <div class="content">
      <slot />
    </div>
    <transition name="pop">
      <h-button
        v-if="props.editing"
        :aria-label="`Supprimer le widget ${props.label}`"
        :bordered="false"
        circle
        class="remove no-drag"
        color="#f5f5f7"
        size="tiny"
        text-color="#1d1d1f"
        @click="emit('remove')">
        <font-awesome-icon icon="minus" />
      </h-button>
    </transition>
    <transition name="pop">
      <h-button
        v-if="props.editing"
        :aria-label="`Régler le widget ${props.label}`"
        circle
        class="configure no-drag"
        glass
        size="small"
        @click="emit('configure')">
        <font-awesome-icon icon="sliders" />
      </h-button>
    </transition>
  </article>
</template>

<style lang="scss" scoped>
.widget {
  width: 100%;
  height: 100%;
  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease;

  // Conteneur de référence des tailles en cqh des widgets (le contenu suit la taille du cadre)
  .content {
    width: 100%;
    height: 100%;
    overflow: hidden;
    border-radius: inherit;
    container-type: size;
  }

  &.editing {
    cursor: grab;

    // Contenu inerte pendant l'édition : un clic déplace le widget au lieu d'ouvrir un lien
    .content {
      pointer-events: none;
      user-select: none;
    }

    &:active {
      cursor: grabbing;
    }
  }
}

// Pastille grise de macOS, la même dans les deux thèmes (couleurs données au bouton)
.remove {
  position: absolute;
  top: -8px;
  left: -8px;
  z-index: 1;
  width: 24px;
  height: 24px;
  box-shadow: 0 2px 8px rgb(0 0 0 / 0.3);
  font-size: 12px;
}

.configure {
  position: absolute;
  right: 8px;
  bottom: 8px;
  z-index: 1;
  background-color: var(--glass-bg-strong);
}

.pop-enter-active,
.pop-leave-active {
  transition:
    transform 0.2s ease,
    opacity 0.2s ease;
}

.pop-enter-from,
.pop-leave-to {
  transform: scale(0.5);
  opacity: 0;
}
</style>
