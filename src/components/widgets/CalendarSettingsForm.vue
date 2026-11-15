<script lang="ts" setup>
import HForm from "@/components/c/hForm.vue";
import HFormItem from "@/components/c/hFormItem.vue";
import HSwitch from "@/components/c/hSwitch.vue";
import type { CalendarSettings } from "@/types/Widget";

const settings = defineModel<CalendarSettings>("settings", { required: true });

function updateWeekNumbers(weekNumbers: boolean) {
  settings.value = { ...settings.value, weekNumbers };
}
</script>

<template>
  <h-form :model="settings" label-placement="top">
    <h-form-item label="Numéros de semaine">
      <h-switch :value="settings.weekNumbers" @update:value="updateWeekNumbers($event)" />
    </h-form-item>
  </h-form>
</template>
