<script setup lang="ts">
import { NGridItem, type GridItemProps } from "naive-ui";

defineOptions({ __GRID_ITEM__: true, inheritAttrs: false });

defineProps</* @vue-ignore */ GridItemProps>();
</script>

<template>
  <n-grid-item v-bind="$attrs">
    <template v-for="(_, name) in $slots" #[name]="slotProps">
      <slot :name="name" v-bind="slotProps ?? {}" />
    </template>
  </n-grid-item>
</template>
