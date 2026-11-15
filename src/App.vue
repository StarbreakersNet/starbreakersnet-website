<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from "vue";
import { getNaiveOverrideTheme, getNaiveTheme } from "@/utils/naiveTheme";
import { vKonami } from "vue-konami";
import AppLayout from "@/AppLayout.vue";
import { dateFrFR, frFR } from "naive-ui";
import { useUserStore } from "@/stores/user";
import type { ThemeType } from "@/types/User";

const user = useUserStore();

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

function setAppTheme(newTheme: ThemeType) {
  theme.value = getNaiveTheme(newTheme);
  themeOverride.value = getNaiveOverrideTheme(newTheme);
}

watch(
  () => user.settings.theme,
  value => {
    setAppTheme(value);
    // Utilisé par base.scss pour les couleurs hors composants Naive UI (fond de page…)
    document.documentElement.dataset.theme = value;
  },
  { immediate: true }
);

onMounted(async () => {
  await nextTick();
});
</script>

<template>
  <n-config-provider
    v-konami="maintenanceConfig"
    :date-locale="dateFrFR"
    :locale="frFR"
    :theme="theme"
    :theme-overrides="themeOverride"
    inline-theme-disabled>
    <n-message-provider placement="bottom">
      <n-notification-provider container-class="h-notification" placement="bottom-right">
        <n-modal-provider>
          <app-layout :maintenance-mode />
        </n-modal-provider>
      </n-notification-provider>
    </n-message-provider>
  </n-config-provider>
</template>
