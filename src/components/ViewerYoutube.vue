<script setup lang="ts">
import MimicBackend from "@/stores/MimicBackend";
const url: string = MimicBackend.getViewerYoutubeZapUrl();
</script>

<template>
  <iframe
    :src="url"
    allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
    allowfullscreen/>
</template>

<style scoped lang="sass">
iframe
  width: 100%
  height: 100%
  border: none
</style>