<script lang="ts" setup>
import { computed, type PropType } from "vue";
import HForm from "@/components/c/hForm.vue";
import HFormItem from "@/components/c/hFormItem.vue";
import HInput from "@/components/c/hInput.vue";
import HRadioButton from "@/components/c/hRadioButton.vue";
import HRadioGroup from "@/components/c/hRadioGroup.vue";
import HSelect from "@/components/c/hSelect.vue";
import HSwitch from "@/components/c/hSwitch.vue";
import { localTimezone, timezoneCity } from "@/models/widgets";
import type { ClockSettings } from "@/types/Widget";

const settings = defineModel("settings", {
  type: Object as PropType<ClockSettings>,
  required: true,
});

// Valeur de la liste pour « Heure de l'appareil », enregistrée comme fuseau null
const DEVICE_TIMEZONE = "device";

// Intl.supportedValuesOf (ES2022) absent des types du projet, ciblés ES2020
const intl = Intl as unknown as { supportedValuesOf?: (key: string) => string[] };
const timezones = intl.supportedValuesOf?.("timeZone") ?? [];

const timezoneOptions = [
  { label: "Heure de l'appareil", value: DEVICE_TIMEZONE },
  ...timezones.map(zone => ({ label: zone.replace(/_/g, " "), value: zone })),
];

const labelPlaceholder = computed(() => {
  const timezone = settings.value.timezone ?? localTimezone();

  return timezoneCity(timezone);
});

function update(patch: Partial<ClockSettings>) {
  settings.value = { ...settings.value, ...patch };
}

function updateTimezone(value: string) {
  const timezone = value === DEVICE_TIMEZONE ? null : value;

  update({ timezone });
}
</script>

<template>
  <h-form :model="settings" label-placement="top">
    <h-form-item label="Style">
      <h-radio-group
        :value="settings.style"
        @update:value="(style: ClockSettings['style']) => update({ style })">
        <h-radio-button value="analog">À aiguilles</h-radio-button>
        <h-radio-button value="digital">En chiffres</h-radio-button>
      </h-radio-group>
    </h-form-item>
    <h-form-item label="Secondes">
      <h-switch
        :value="settings.seconds"
        @update:value="(seconds: boolean) => update({ seconds })" />
    </h-form-item>
    <h-form-item label="Fuseau horaire">
      <h-select
        :options="timezoneOptions"
        :value="settings.timezone ?? DEVICE_TIMEZONE"
        filterable
        @update:value="updateTimezone" />
    </h-form-item>
    <h-form-item label="Nom affiché">
      <h-input
        :maxlength="40"
        :placeholder="labelPlaceholder"
        :value="settings.label"
        clearable
        @update:value="(label: string) => update({ label })" />
    </h-form-item>
  </h-form>
</template>
