<script lang="ts" setup>
import { computed } from "vue";
import { WIDGET_DEFINITIONS, WIDGET_SIZES } from "@/models/widgets";
import { WIDGET_COMPONENTS } from "@/components/widgets/registry";
import { useWidgetsStore } from "@/stores/widgets";
import type { WidgetSize } from "@/types/Widget";

// Réglages d'un widget, appliqués en direct (comme sur macOS) : pas de bouton Enregistrer
const props = defineProps<{
  widgetId: string | null;
}>();

const emit = defineEmits<{
  close: [];
}>();

const store = useWidgetsStore();

const widget = computed(() => store.widgets.find(item => item.id === props.widgetId) ?? null);
const definition = computed(() => (widget.value ? WIDGET_DEFINITIONS[widget.value.type] : null));
const form = computed(() => (widget.value ? WIDGET_COMPONENTS[widget.value.type].settings : null));

const sizeOptions = computed(() =>
  (definition.value?.sizes ?? []).map(size => ({ value: size, label: WIDGET_SIZES[size].label }))
);

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
</script>

<template>
  <n-modal
    :show="!!widget"
    class="widget-settings apple-menu"
    preset="card"
    style="width: min(560px, calc(100vw - 32px))"
    @update:show="(show: boolean) => !show && emit('close')">
    <template #header>
      <n-flex align="center" size="small">
        <font-awesome-icon v-if="definition" :icon="definition.icon" />
        {{ definition?.label }}
      </n-flex>
    </template>
    <template v-if="widget && form">
      <n-form-item v-if="sizeOptions.length > 1" label="Taille" label-placement="top">
        <n-radio-group :value="widget.size" @update:value="updateSize">
          <n-radio-button v-for="option in sizeOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </n-radio-button>
        </n-radio-group>
      </n-form-item>
      <component :is="form" :settings="widget.settings" @update:settings="updateSettings" />
    </template>
    <template #footer>
      <n-flex justify="end">
        <n-button type="primary" @click="emit('close')">Terminé</n-button>
      </n-flex>
    </template>
  </n-modal>
</template>
