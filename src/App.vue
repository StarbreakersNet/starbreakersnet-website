<script setup>
import { ref } from "vue";
import { getNaiveOverrideTheme, getNaiveTheme } from "@/composables/appUtils";
import { vKonami } from "vue-konami";
import AppLayout from "@/AppLayout.vue";

const theme = ref(getNaiveTheme("dark"));
const themeOverride = ref(getNaiveOverrideTheme("dark"));
const maintenanceMode = ref(false);
const maintenanceConfig = {
  timeout: 500,
  chain: ["h", "a", "c", "k", "e", "r", "m", "a", "n"],
  callback() {
    if (maintenanceMode.value) {
      console.log("Maintenance mode disabled. You are a hacker!");
    } else {
      console.log("Maintenance mode enabled. You are a hacker!");
    }
    maintenanceMode.value = !maintenanceMode.value;
  },
};
</script>

<template>
  <n-config-provider
    v-konami="maintenanceConfig"
    :theme="theme"
    :theme-overrides="themeOverride"
    inline-theme-disabled>
    <n-message-provider>
      <app-layout />
    </n-message-provider>
  </n-config-provider>
</template>

<style lang="sass" scoped></style>
