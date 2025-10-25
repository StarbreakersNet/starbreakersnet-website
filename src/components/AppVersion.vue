<script setup lang="ts">
import { ref } from "vue";
import { version } from "@/../package.json";

const packageVersion = ref(version);
</script>

<template>
  <n-flex :size="0" align="center" justify="center">
    v{{ packageVersion }}
  </n-flex>
</template>

<style scoped lang="scss">

</style>