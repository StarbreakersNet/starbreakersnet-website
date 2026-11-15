<script setup lang="ts">
import { RouterView, useRoute, useRouter } from "vue-router";
import MainMenu from "@/components/MainMenu.vue";
import { ref, watch } from "vue";
import MaintenanceView from "@/views/MaintenanceView.vue";
import UserMenu from "@/components/UserMenu.vue";
import { useMessage, useNotification } from "naive-ui";
import { registerMessageApi } from "@/composables/useAppMessage";
import { registerNotificationApi } from "@/composables/useAppNotification";
import { useAuthStore } from "@/stores/auth";
import { useUserStore } from "@/stores/user";
import HButton from "@/components/c/hButton.vue";
import HFlex from "@/components/c/hFlex.vue";
import HSpin from "@/components/c/hSpin.vue";

const { maintenanceMode = false } = defineProps<{
  maintenanceMode?: boolean;
}>();

registerMessageApi(useMessage());
registerNotificationApi(useNotification());

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const user = useUserStore();

const isHome = ref(true);
const showHeader = ref(false);
const showFooter = ref(false);

function setUiVisibility(isHome: boolean) {
  showHeader.value = true;
  showFooter.value = isHome;
}

watch(
  () => route.name,
  () => {
    isHome.value = route.name === "home";
    setUiVisibility(isHome.value);
  }
);

// Déconnexion (bouton, session expirée ou autre onglet) depuis une route protégée : retour à l'accueil
watch(
  () => user.infos.connected,
  connected => {
    if (!connected && route.meta.requiresAuth) {
      router.push({ name: "home" });
    }
  }
);

// Lien de réinitialisation du mot de passe : GoTrue peut renvoyer sur l'accueil (SITE_URL) au lieu de
// /reset-password, par exemple si la demande venait d'une adresse non autorisée. On affiche le
// formulaire quelle que soit la page d'arrivée.
watch(
  () => auth.passwordRecovery,
  recovery => {
    if (recovery && route.name !== "reset-password") {
      router.replace({ name: "reset-password" });
    }
  }
);
</script>

<template>
  <transition>
    <div v-if="!auth.isReady" class="app-loader">
      <h-spin size="large" />
    </div>
  </transition>
  <transition mode="out-in" name="scale">
    <maintenance-view v-if="maintenanceMode" />
    <div v-else class="main-container">
      <transition name="shrink">
        <header v-if="showHeader">
          <transition-group name="fade-y">
            <h-button
              v-if="!isHome"
              key="home"
              :bordered="false"
              class="apple-blurred"
              @click="$router.push({ name: 'home' })">
              <h-flex wrap align="center">
                <font-awesome-icon icon="arrow-left" />
                Accueil
              </h-flex>
            </h-button>
          </transition-group>
          <user-menu />
        </header>
      </transition>
      <h-flex wrap align="stretch" class="router-view" justify="center">
        <router-view #default="{ Component }">
          <transition mode="out-in" name="scale">
            <component :is="Component" />
          </transition>
        </router-view>
      </h-flex>
      <transition name="fade-y">
        <footer v-if="showFooter">
          <main-menu />
        </footer>
      </transition>
    </div>
  </transition>
</template>

<style lang="scss" scoped>
@use "@/assets/variables";

.app-loader {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.main-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  padding: variables.$sn-main-padding;
  gap: variables.$sn-main-padding;

  header {
    position: sticky;
    top: variables.$sn-main-padding;
    right: variables.$sn-main-padding;
    bottom: variables.$sn-main-padding;
    left: variables.$sn-main-padding;
    z-index: 100;
    display: flex;
    justify-content: space-between;

    &:has(> *:only-child) {
      justify-content: flex-end;
    }

    > * {
      height: 2.5em;
    }
  }

  .router-view {
    display: flex;
    flex-direction: column;
    flex: 1;
  }

  footer {
    position: absolute;
    right: variables.$sn-main-padding;
    left: variables.$sn-main-padding;
    bottom: variables.$sn-main-padding;
    z-index: 10;
  }
}
</style>
