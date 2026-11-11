<script lang="ts" setup>
import { computed } from "vue";
import { localTimezone, timezoneCity } from "@/models/widgets";
import type { ClockSettings } from "@/types/Widget";

const settings = defineModel<ClockSettings>("settings", { required: true });

const LOCAL = "local";

// Intl.supportedValuesOf (ES2022) absent des types du projet, ciblés ES2020
const timezones: string[] =
  (Intl as unknown as { supportedValuesOf?: (key: string) => string[] }).supportedValuesOf?.(
    "timeZone"
  ) ?? [];

const timezoneOptions = [
  { label: "Heure de l'appareil", value: LOCAL },
  ...timezones.map(zone => ({ label: zone.replace(/_/g, " "), value: zone })),
];

function update(patch: Partial<ClockSettings>) {
  settings.value = { ...settings.value, ...patch };
}

const timezone = computed({
  get: () => settings.value.timezone ?? LOCAL,
  set: value => update({ timezone: value === LOCAL ? null : value }),
});

const labelPlaceholder = computed(() => timezoneCity(settings.value.timezone ?? localTimezone()));
</script>

<template>
  <n-form label-placement="top">
    <n-form-item label="Style">
      <n-radio-group
        :value="settings.style"
        @update:value="(style: ClockSettings['style']) => update({ style })">
        <n-radio-button value="analog">À aiguilles</n-radio-button>
        <n-radio-button value="digital">En chiffres</n-radio-button>
      </n-radio-group>
    </n-form-item>
    <n-form-item label="Secondes">
      <n-switch
        :value="settings.seconds"
        @update:value="(seconds: boolean) => update({ seconds })" />
    </n-form-item>
    <n-form-item label="Fuseau horaire">
      <n-select v-model:value="timezone" :options="timezoneOptions" filterable />
    </n-form-item>
    <n-form-item label="Nom affiché">
      <n-input
        :maxlength="40"
        :placeholder="labelPlaceholder"
        :value="settings.label"
        clearable
        @update:value="(label: string) => update({ label })" />
    </n-form-item>
  </n-form>
</template>
