<script setup lang="ts">
import { ref } from "vue";
import { version } from "@/../package.json";
import HFlex from "@/components/c/hFlex.vue";

const packageVersion = ref(version);
</script>

<template>
  <h-flex wrap :size="0" align="center" justify="center">v{{ packageVersion }}</h-flex>
</template>
