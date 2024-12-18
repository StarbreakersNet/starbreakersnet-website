<script setup>
import { RouterView, useRoute } from "vue-router";
import MainMenu from "@/components/MainMenu.vue";
import { onBeforeMount, ref, watch } from "vue";
import { getNaiveOverrideTheme, getNaiveTheme, preferedOsTheme } from "@/composables/appUtils";
import { useUserStore } from "@/stores/user";
import MaintenanceView from "@/views/MaintenanceView.vue";
import { vKonami } from "vue-konami";
import UserMenu from "@/components/UserMenu.vue";

const route = useRoute();
const userStore = useUserStore();

const isHome = ref(true);
const showHeader = ref(false);
const showFooter = ref(false);
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

function setAppTheme(newTheme) {
  theme.value = getNaiveTheme(newTheme);
  themeOverride.value = getNaiveOverrideTheme(newTheme);
}

function setUiVisibility(isHome) {
  showHeader.value = !isHome || isHome;
  showFooter.value = isHome;
}

watch(
  () => userStore.settings.theme,
  value => {
    setAppTheme(value);
    userStore.settings.osTheme = preferedOsTheme();
  },
  { immediate: true }
);

watch(
  () => route.name,
  () => {
    isHome.value = route.name === "home";
    setUiVisibility(isHome.value);
  }
);

onBeforeMount(async () => {
  await userStore.refreshSession();
  // TODO: Ajouter un loader fullscreen pour attendre de savoir si l'utilisateur à un token ou non
});
</script>

<template>
  <n-config-provider
    v-konami="maintenanceConfig"
    :theme="theme"
    :theme-overrides="themeOverride"
    inline-theme-disabled>
    <transition mode="out-in" name="scale">
      <MaintenanceView v-if="maintenanceMode" />
      <div v-else class="main-container">
        <transition name="shrink">
          <header v-if="showHeader">
            <transition-group name="fade-y">
              <n-button
                v-if="!isHome"
                key="home"
                :bordered="false"
                class="apple-blurred"
                @click="$router.push({ name: 'home' })">
                <n-flex align="center">
                  <font-awesome-icon icon="arrow-left" />
                  Accueil
                </n-flex>
              </n-button>
            </transition-group>
            <user-menu />
          </header>
        </transition>
        <n-flex class="router-view" justify="center">
          <router-view #default="{ Component }">
            <transition name="scale" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </n-flex>
        <transition name="fade-y">
          <footer v-if="showFooter">
            <main-menu />
          </footer>
        </transition>
      </div>
    </transition>
  </n-config-provider>
</template>

<style lang="sass" scoped>
@use "@/assets/variables"

.main-container
  min-height: 100vh
  display: flex
  flex-direction: column
  align-items: stretch
  padding: variables.$sn-main-padding
  gap: variables.$sn-main-padding

  header
    position: sticky
    top: variables.$sn-main-padding
    right: variables.$sn-main-padding
    bottom: variables.$sn-main-padding
    left: variables.$sn-main-padding
    z-index: 100
    display: flex
    justify-content: space-between

    &:has(> *:only-child)
      justify-content: flex-end

    > *
      height: 2.5em

  .router-view
    display: flex
    flex-direction: column
    flex: 1

  footer
    position: absolute
    right: variables.$sn-main-padding
    left: variables.$sn-main-padding
    bottom: variables.$sn-main-padding
    z-index: 10
</style>
