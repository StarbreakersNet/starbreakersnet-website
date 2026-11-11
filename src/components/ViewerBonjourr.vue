<script lang="ts" setup>
import { ref } from "vue";
import AppContainer from "@/components/AppContainer.vue";

// Bonjourr auto-hébergé : build installé dans public/apps/bonjourr par `yarn bonjourr:update`
// (scripts/bonjourr/update.mjs). Même origine que le site, stockage cloisonné (storage-shim.js).
const url = `${import.meta.env.BASE_URL}apps/bonjourr/index.html`;
const isIframeLoaded = ref(false);
</script>

<template>
  <app-container :loaded="isIframeLoaded" app="bonjourr">
    <iframe :src="url" title="Bonjourr" @load="isIframeLoaded = true" />
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
