<script lang="ts" setup>
import { ref } from "vue";
import MimicBackend from "@/stores/MimicBackend";
import AppContainer from "@/components/AppContainer.vue";

const url: string = MimicBackend.getViewerDiscordUrl();
const isIframeLoaded = ref(false);
</script>

<template>
  <app-container :loaded="isIframeLoaded" app="discord">
    <iframe :src="url" allowtransparency="true" @load="isIframeLoaded = true" />
  </app-container>
</template>

<style lang="sass" scoped>
@import @/assets/variables.sass

iframe
  width: 100%
  height: 100%
  border: none
  border-radius: $sn-apple-border-radius
</style>
