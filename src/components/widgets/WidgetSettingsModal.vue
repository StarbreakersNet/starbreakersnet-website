<script lang="ts" setup>
import { computed, type PropType } from "vue";
import HButton from "@/components/c/hButton.vue";
import HFlex from "@/components/c/hFlex.vue";
import HFormItem from "@/components/c/hFormItem.vue";
import HModal from "@/components/c/hModal.vue";
import HRadioButton from "@/components/c/hRadioButton.vue";
import HRadioGroup from "@/components/c/hRadioGroup.vue";
import { WIDGET_DEFINITIONS, WIDGET_SIZES } from "@/models/widgets";
import { WIDGET_COMPONENTS } from "@/components/widgets/registry";
import { useWidgetsStore } from "@/stores/widgets";
import type { WidgetSize } from "@/types/Widget";

// Réglages d'un widget, appliqués en direct (comme sur macOS) : pas de bouton Enregistrer
const props = defineProps({
  widgetId: {
    type: String as PropType<string | null>,
    default: null,
  },
});

const emit = defineEmits<{
  (e: "close"): void;
}>();

const store = useWidgetsStore();

const widget = computed(() => {
  const found = store.widgets.find(item => item.id === props.widgetId);

  return found ?? null;
});

const definition = computed(() => (widget.value ? WIDGET_DEFINITIONS[widget.value.type] : null));

const form = computed(() => (widget.value ? WIDGET_COMPONENTS[widget.value.type].settings : null));

const sizeOptions = computed(() => {
  const sizes = definition.value?.sizes ?? [];

  return sizes.map(size => ({ value: size, label: WIDGET_SIZES[size].label }));
});

function updateSettings(settings: unknown) {
  if (widget.value) {
    store.updateSettings(widget.value.id, settings as typeof widget.value.settings);
  }
}

function updateSize(size: WidgetSize) {
  if (widget.value) {
    // Taille choisie à la main : plus d'agrandissement automatique
    store.stopGrowing();
    store.resize(widget.value.id, size);
  }
}

function onUpdateShow(show: boolean) {
  if (!show) {
    emit("close");
  }
}
</script>

<template>
  <h-modal
    :show="!!widget"
    class="widget-settings apple-menu"
    preset="card"
    @update:show="onUpdateShow">
    <template #header>
      <h-flex size="small">
        <font-awesome-icon v-if="definition" :icon="definition.icon" />
        {{ definition?.label }}
      </h-flex>
    </template>
    <template v-if="widget && form" #default>
      <h-form-item v-if="sizeOptions.length > 1" label="Taille" label-placement="top">
        <h-radio-group :value="widget.size" @update:value="updateSize">
          <h-radio-button v-for="option in sizeOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </h-radio-button>
        </h-radio-group>
      </h-form-item>
      <component :is="form" :settings="widget.settings" @update:settings="updateSettings" />
    </template>
    <template #footer>
      <h-flex justify="end">
        <h-button type="primary" @click="emit('close')">Terminé</h-button>
      </h-flex>
    </template>
  </h-modal>
</template>

<style lang="scss">
.widget-settings {
  width: min(560px, calc(100vw - 32px));
}
</style>
