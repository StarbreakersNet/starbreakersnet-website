<script setup lang="ts">
import { NCarousel, type CarouselProps, type CarouselSlots } from "naive-ui";

defineOptions({ inheritAttrs: false });

defineProps</* @vue-ignore */ CarouselProps>();

defineSlots<CarouselSlots>();
</script>

<template>
  <n-carousel v-bind="$attrs">
    <template v-for="(_, name) in $slots" #[name]="slotProps">
      <slot :name="name as keyof CarouselSlots" v-bind="slotProps ?? {}" />
    </template>
  </n-carousel>
</template>
