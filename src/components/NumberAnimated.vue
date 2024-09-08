<script setup>
import { computed } from "vue";

const props = defineProps({
  value: {
    type: [String, Number],
    required: true,
  },
  digits: {
    type: Number,
    default: 1,
  },
});

const formatedValue = computed(() => {
  return props.value.toString().padStart(props.digits, "0");
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

<style lang="sass" scoped>
@import @/assets/variables.sass

.number-container
  position: relative
  overflow: hidden

  .current-value
    visibility: hidden

  .animated-value
    position: absolute
    top: 0
    opacity: 1
    filter: blur(0)

  .slide-digit-enter-active, .slide-digit-leave-active
    transition: all .3s $sn-default-timing

  .slide-digit-enter-from
    transform: translateY(100%)
    opacity: 0
    filter: blur(20px)

  .slide-digit-leave-to
    transform: translateY(-100%)
    opacity: 0
    filter: blur(20px)
</style>
