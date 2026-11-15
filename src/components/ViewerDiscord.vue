<script lang="ts" setup>
import { ref } from "vue";
import { DISCORD_WIDGET_URL } from "@/utils/embeds";
import AppContainer from "@/components/AppContainer.vue";

const isIframeLoaded = ref(false);
</script>

<template>
  <app-container :loaded="isIframeLoaded" app="discord">
    <iframe :src="DISCORD_WIDGET_URL" allowtransparency="true" @load="isIframeLoaded = true" />
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
