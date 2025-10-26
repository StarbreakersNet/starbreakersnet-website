<template>
  <n-grid
    :collapsed="props.collapsed"
    :collapsed-rows="props.collapsedRows"
    :cols="props.cols"
    :item-responsive="props.itemResponsive"
    :layout-shift-disabled="props.layoutShiftDisabled"
    :responsive="props.responsive"
    :x-gap="props.xGap"
    :y-gap="props.yGap"
    v-bind="$attrs">
    <slot />
  </n-grid>
</template>

<script lang="ts" setup>
import { type GridProps, NGrid } from "naive-ui";
import { type PropType } from "vue";

const props = defineProps({
  cols: {
    type: [Number, String] as PropType<GridProps["cols"]>,
    default: 12,
  },
  collapsed: {
    type: Boolean as PropType<GridProps["collapsed"]>,
    default: undefined,
  },
  collapsedRows: {
    type: Number as PropType<GridProps["collapsedRows"]>,
    default: undefined,
  },
  layoutShiftDisabled: {
    type: Boolean as PropType<GridProps["layoutShiftDisabled"]>,
    default: undefined,
  },
  responsive: {
    type: String as PropType<GridProps["responsive"]>,
    default: undefined,
  },
  itemResponsive: {
    type: Boolean as PropType<GridProps["itemResponsive"]>,
    default: undefined,
  },
  xGap: {
    type: [Number, String] as PropType<GridProps["xGap"]>,
    default: 24,
  },
  yGap: {
    type: [Number, String] as PropType<GridProps["yGap"]>,
    default: 24,
  },
});
</script>
