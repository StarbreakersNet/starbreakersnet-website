<script setup lang="ts">
import { NGrid, type GridProps } from "naive-ui";

interface Props extends /* @vue-ignore */ GridProps {
  cols?: GridProps["cols"];
  xGap?: GridProps["xGap"];
  yGap?: GridProps["yGap"];
}

defineOptions({ inheritAttrs: false });

const { cols = 12, xGap = 24, yGap = 24 } = defineProps<Props>();
</script>

<template>
  <n-grid :cols="cols" :x-gap="xGap" :y-gap="yGap" v-bind="$attrs">
    <template v-for="(_, name) in $slots" #[name]="slotProps">
      <slot :name="name" v-bind="slotProps ?? {}" />
    </template>
  </n-grid>
</template>
