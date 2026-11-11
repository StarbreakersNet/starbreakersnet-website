<script lang="ts" setup>
import { ref, watch } from "vue";
import AppContainer from "@/components/AppContainer.vue";
import { useUserStore } from "@/stores/user";

// Bonjourr auto-hébergé : build installé dans public/apps/bonjourr par `yarn bonjourr:update`
// (scripts/bonjourr/update.mjs). Même origine que le site, stockage cloisonné (storage-shim.js).
const url = `${import.meta.env.BASE_URL}apps/bonjourr/index.html`;
const isIframeLoaded = ref(false);
const iframeKey = ref(0);

const user = useUserStore();

// Bonjourr prend le thème du site à son chargement (site-sync.js). Une partie de son affichage
// n'étant calculée qu'au démarrage, on le recharge entièrement quand le thème du site change.
watch(
  () => user.settings.theme,
  () => {
    isIframeLoaded.value = false;
    iframeKey.value++;
  }
);
</script>

<template>
  <app-container :loaded="isIframeLoaded" app="bonjourr">
    <iframe :key="iframeKey" :src="url" title="Bonjourr" @load="isIframeLoaded = true" />
  </app-container>
</template>

<style lang="scss" scoped>
@use "@/assets/variables";

iframe {
  width: 100%;
  height: 100%;
  border: none;
  border-radius: variables.$sn-apple-border-radius;
}
</style>
