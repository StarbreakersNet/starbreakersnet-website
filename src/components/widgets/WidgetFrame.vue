<script lang="ts" setup>
// Cadre commun des widgets : verre Liquid Glass et, en mode édition, boutons Supprimer et Réglages
const props = defineProps<{
  label: string;
  editing: boolean;
}>();

const emit = defineEmits<{
  remove: [];
  configure: [];
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
      <button
        v-if="props.editing"
        :aria-label="`Supprimer le widget ${props.label}`"
        class="remove no-drag"
        type="button"
        @click="emit('remove')">
        <font-awesome-icon icon="minus" />
      </button>
    </transition>

    <transition name="pop">
      <button
        v-if="props.editing"
        :aria-label="`Régler le widget ${props.label}`"
        class="configure no-drag glass-button"
        type="button"
        @click="emit('configure')">
        <font-awesome-icon icon="sliders" />
      </button>
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

.remove {
  position: absolute;
  top: -8px;
  left: -8px;
  z-index: 1;
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 50%;
  color: rgb(29 29 31);
  background: rgb(245 245 247 / 0.9);
  box-shadow: 0 2px 8px rgb(0 0 0 / 0.3);
  font-size: 12px;
  cursor: pointer;

  &:hover {
    background: rgb(255 255 255);
  }
}

.configure {
  position: absolute;
  right: 8px;
  bottom: 8px;
  z-index: 1;
  width: 2rem;
  height: 2rem;
  padding: 0;
  background: var(--glass-bg-strong);
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
