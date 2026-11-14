<script lang="ts" setup>
import { type PropType } from "vue";
import HForm from "@/components/c/hForm.vue";
import HFormItem from "@/components/c/hFormItem.vue";
import HSwitch from "@/components/c/hSwitch.vue";
import type { CalendarSettings } from "@/types/Widget";

const settings = defineModel("settings", {
  type: Object as PropType<CalendarSettings>,
  required: true,
});

function updateWeekNumbers(weekNumbers: boolean) {
  settings.value = { ...settings.value, weekNumbers };
}
</script>

<template>
  <h-form :model="settings" label-placement="top">
    <h-form-item label="Numéros de semaine">
      <h-switch :value="settings.weekNumbers" @update:value="updateWeekNumbers" />
    </h-form-item>
  </h-form>
</template>
