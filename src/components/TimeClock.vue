<script setup lang="ts">
import { useCurrentTime } from "@/composables/useCurrentTime";
import NumberAnimated from "@/components/NumberAnimated.vue";
import { computed } from "vue";
import HFlex from "@/components/c/hFlex.vue";

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
    <h-flex wrap :size="3" align="center" justify="center">
      <number-animated :digits="2" :value="time.hours" />
      <div>:</div>
      <number-animated :digits="2" :value="time.minutes" />
      <div>:</div>
      <number-animated :digits="2" :value="time.seconds" />
    </h-flex>
  </div>
</template>
