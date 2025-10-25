<script setup>
import { particlesOptions } from "@/models/ParticlesConfig.ts";
</script>

<template>
  <main>
    <vue-particles id="tsparticles" :options="particlesOptions" />
    <n-flex align="center" justify="center" class="container">
      <h3>🚧 Site en maintenance 🚧</h3>
    </n-flex>
  </main>
</template>

<style scoped lang="scss">
.container {
  height: 100vh;
  font-size: 2em;
}
</style>