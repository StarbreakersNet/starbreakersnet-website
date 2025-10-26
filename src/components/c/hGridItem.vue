<template>
  <n-grid-item :offset="props.offset" :span="props.span" :suffix="props.suffix" v-bind="$attrs">
    <slot />
  </n-grid-item>
</template>

<script lang="ts" setup>
import { type GridItemProps, NGridItem } from "naive-ui";
import { type PropType } from "vue";

const props = defineProps({
  offset: {
    type: Number as PropType<GridItemProps["offset"]>,
    default: undefined,
  },
  span: {
    type: [Number, String] as PropType<GridItemProps["span"]>,
    default: undefined,
  },
  suffix: {
    type: Boolean as PropType<GridItemProps["suffix"]>,
    default: undefined,
  },
});

defineOptions({
  __GRID_ITEM__: true,
});
</script>
