<script setup lang="ts">
import { PARTICLES_OPTIONS } from "@/models/ParticlesConfig";
import HFlex from "@/components/c/hFlex.vue";
</script>

<template>
  <main>
    <vue-particles id="tsparticles" :options="PARTICLES_OPTIONS" />
    <h-flex wrap align="center" justify="center" class="container">
      <h3>🚧 Site en maintenance 🚧</h3>
    </h-flex>
  </main>
</template>

<style scoped lang="scss">
.container {
  height: 100vh;
  font-size: 2em;
}
</style>
