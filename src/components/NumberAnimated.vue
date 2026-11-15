<script setup lang="ts">
import { computed } from "vue";

const { value, digits = 1 } = defineProps<{
  value: string | number;
  digits?: number;
}>();

const formatedValue = computed(() => {
  return value.toString().padStart(digits, "0");
});
</script>

<template>
  <div class="number-container">
    <transition name="slide-digit">
      <span :key="formatedValue" class="animated-value">{{ formatedValue }}</span>
    </transition>
    <span class="current-value">{{ formatedValue }}</span>
  </div>
</template>

<style lang="scss" scoped>
@use "@/assets/variables";

.number-container {
  position: relative;
  overflow: hidden;

  .current-value {
    visibility: hidden;
  }

  .animated-value {
    position: absolute;
    top: 0;
    opacity: 1;
    filter: blur(0);
  }

  .slide-digit-enter-active,
  .slide-digit-leave-active {
    transition: all 0.3s variables.$sn-default-timing;
  }

  .slide-digit-enter-from {
    transform: translateY(100%);
    opacity: 0;
    filter: blur(20px);
  }

  .slide-digit-leave-to {
    transform: translateY(-100%);
    opacity: 0;
    filter: blur(20px);
  }
}
</style>
