<script setup>
import { RouterView, useRoute } from "vue-router";
import MainMenu from "@/components/MainMenu.vue";
import { onMounted, ref, watch } from "vue";
import MaintenanceView from "@/views/MaintenanceView.vue";
import UserMenu from "@/components/UserMenu.vue";
import { useMessage, useNotification } from "naive-ui";

const route = useRoute();

const props = defineProps({
  maintenanceMode: {
    type: Boolean,
    default: false,
  },
});

const isHome = ref(true);
const showHeader = ref(false);
const showFooter = ref(false);

function setUiVisibility(isHome) {
  showHeader.value = !isHome || isHome;
  showFooter.value = isHome;
}

watch(
  () => route.name,
  () => {
    isHome.value = route.name === "home";
    setUiVisibility(isHome.value);
  }
);

onMounted(async () => {
  window.$message = useMessage();
  window.$notification = useNotification();
});
</script>

<template>
  <transition mode="out-in" name="scale">
    <MaintenanceView v-if="props.maintenanceMode" />
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
          <transition mode="out-in" name="scale">
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
</template>

<style lang="scss" scoped>
@use "@/assets/variables";

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
