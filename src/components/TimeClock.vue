<script setup>
import { useCurrentTime } from "@/composables/currentTime.js";
import NumberAnimated from "@/components/NumberAnimated.vue";
import { computed } from "vue";

const currentTime = useCurrentTime();
const time = computed(() => {
  return {
    hours: currentTime.value.getHours(),
    minutes: currentTime.value.getMinutes(),
    seconds: currentTime.value.getSeconds(),
  };
});
</script>

<template>
  <div class="time-clock">
    <n-flex :size="3" align="center" justify="center">
      <number-animated :digits="2" :value="time.hours" />
      <div>:</div>
      <number-animated :digits="2" :value="time.minutes" />
      <div>:</div>
      <number-animated :digits="2" :value="time.seconds" />
    </n-flex>
  </div>
</template>

<style lang="sass" scoped></style>
