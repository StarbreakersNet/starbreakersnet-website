<script lang="ts" setup>
import { computed, type PropType } from "vue";
import { DateTime } from "luxon";
import HDatePicker from "@/components/c/hDatePicker.vue";
import HForm from "@/components/c/hForm.vue";
import HFormItem from "@/components/c/hFormItem.vue";
import HInput from "@/components/c/hInput.vue";
import type { CountdownSettings } from "@/types/Widget";

const settings = defineModel("settings", {
  type: Object as PropType<CountdownSettings>,
  required: true,
});

// Le sélecteur de date travaille en millisecondes, le widget enregistre une date ISO
const targetMillis = computed(() => DateTime.fromISO(settings.value.target).toMillis());

function updateTitle(title: string) {
  settings.value = { ...settings.value, title };
}

function updateTarget(millis: number | null) {
  const target = millis === null ? null : DateTime.fromMillis(millis).toISO();

  if (target) {
    settings.value = { ...settings.value, target };
  }
}
</script>

<template>
  <h-form :model="settings" label-placement="top">
    <h-form-item label="Évènement">
      <h-input
        :maxlength="40"
        :value="settings.title"
        placeholder="Soirée jeux, anniversaire…"
        @update:value="updateTitle" />
    </h-form-item>
    <h-form-item label="Date et heure">
      <h-date-picker
        :actions="['now', 'confirm']"
        :value="targetMillis"
        class="date-picker"
        format="d MMMM yyyy, HH:mm"
        type="datetime"
        @update:value="updateTarget" />
    </h-form-item>
  </h-form>
</template>

<style lang="scss" scoped>
.date-picker {
  width: 100%;
}
</style>
