<script lang="ts" setup>
import type { CalendarSettings } from "@/types/Widget";

const settings = defineModel<CalendarSettings>("settings", { required: true });
</script>

<template>
  <n-form label-placement="top">
    <n-form-item label="Numéros de semaine">
      <n-switch
        :value="settings.weekNumbers"
        @update:value="(weekNumbers: boolean) => (settings = { ...settings, weekNumbers })" />
    </n-form-item>
  </n-form>
</template>
