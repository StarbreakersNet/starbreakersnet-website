<script lang="ts" setup>
import { ref } from "vue";
import MimicBackend from "@/stores/MimicBackend";
import AppContainer from "@/components/AppContainer.vue";

const url: string = MimicBackend.getViewerYoutubeZapUrl();
const isIframeLoaded = ref(false);
</script>

<template>
  <app-container :loaded="isIframeLoaded" app="youtube">
    <iframe
      :src="url"
      allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
      allowfullscreen
      @load="isIframeLoaded = true" />
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
