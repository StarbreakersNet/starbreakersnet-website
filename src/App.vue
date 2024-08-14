<script setup>
import { RouterView } from "vue-router";
import MainMenu from "@/components/MainMenu.vue";
import { ref, watch } from "vue";
import { getNaiveOverrideTheme, getNaiveTheme, preferedOsTheme } from "@/AppUtils.ts";
import { useUserStore } from "@/stores/user";
import MaintenanceView from "@/views/MaintenanceView.vue";
import { vKonami } from "vue-konami";

const user = useUserStore();

const theme = ref(getNaiveTheme("dark"));
const themeOverride = ref(getNaiveOverrideTheme("dark"));
const maintenanceMode = ref(import.meta.env.MODE !== 'development');
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
}

function setAppTheme(newTheme) {
  theme.value = getNaiveTheme(newTheme);
  themeOverride.value = getNaiveOverrideTheme(newTheme);
}

watch(
  () => user.settings.theme,
  value => {
    setAppTheme(value);
    user.settings.osTheme = preferedOsTheme();
  },
  { immediate: true },
);
</script>

<template>
  <n-config-provider :theme="theme" :theme-overrides="themeOverride" inline-theme-disabled v-konami="maintenanceConfig">
    <transition name="scale" mode="out-in">
      <MaintenanceView v-if="maintenanceMode" />
      <div v-else>
        <header>
          <div class="menu-wrapper">
            <main-menu />
          </div>
          <main>
            <n-flex align="center" justify="center" class="container">
              <RouterView class="router-view" />
            </n-flex>
          </main>
        </header>
      </div>
    </transition>
  </n-config-provider>
</template>

<style lang="sass" scoped>
header
  position: relative
  height: 100vh
  display: flex
  flex-direction: column
  align-items: stretch
  padding: 1em

  main
    display: flex
    flex-direction: column
    justify-content: center
    align-items: center
    height: 100%
    width: 100%

.router-view
  display: flex
  flex-direction: column
  flex: 1

.menu-wrapper
  position: absolute
  left: 1em
  bottom: 1em
  right: 1em
  border-radius: 10px
  z-index: 10
</style>
