<script lang="ts" setup>
import { computed } from "vue";
import { DateTime } from "luxon";
import type { CountdownSettings } from "@/types/Widget";

const settings = defineModel<CountdownSettings>("settings", { required: true });

const timestamp = computed({
  get: () => DateTime.fromISO(settings.value.target).toMillis(),
  set: value => {
    if (value) settings.value = { ...settings.value, target: DateTime.fromMillis(value).toISO()! };
  },
});
</script>

<template>
  <n-form label-placement="top">
    <n-form-item label="Évènement">
      <n-input
        :maxlength="40"
        :value="settings.title"
        placeholder="Soirée jeux, anniversaire…"
        @update:value="(title: string) => (settings = { ...settings, title })" />
    </n-form-item>
    <n-form-item label="Date et heure">
      <n-date-picker
        v-model:value="timestamp"
        :actions="['now', 'confirm']"
        format="d MMMM yyyy, HH:mm"
        style="width: 100%"
        type="datetime" />
    </n-form-item>
  </n-form>
</template>
