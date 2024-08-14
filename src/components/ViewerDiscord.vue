<script setup lang="ts">
import MimicBackend from "@/stores/MimicBackend";
const url: string = MimicBackend.getViewerDiscordUrl();
</script>

<template>
  <iframe :src="url" allowtransparency="true" />
</template>

<style scoped lang="sass">
iframe
  width: 100%
  height: 100%
  border: none
</style>