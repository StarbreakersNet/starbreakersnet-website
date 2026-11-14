<template>
  <n-table
    :bordered="props.bordered"
    :bottom-bordered="props.bottomBordered"
    :single-column="props.singleColumn"
    :single-line="props.singleLine"
    :size="props.size"
    :striped="props.striped"
    :theme-overrides="props.themeOverrides"
    v-bind="$attrs">
    <slot />
  </n-table>
</template>

<script lang="ts" setup>
import { NTable, type TableProps } from "naive-ui";
import { type PropType } from "vue";

// Tableau HTML simple (thead, tbody, tr, th, td écrits dans le slot), aux couleurs du thème.
// Pour un tableau construit à partir de colonnes et de données, voir NDataTable.

const props = defineProps({
  bordered: {
    type: Boolean as PropType<TableProps["bordered"]>,
    default: true,
  },
  bottomBordered: {
    type: Boolean as PropType<TableProps["bottomBordered"]>,
    default: true,
  },
  singleLine: {
    type: Boolean as PropType<TableProps["singleLine"]>,
    default: true,
  },
  singleColumn: {
    type: Boolean as PropType<TableProps["singleColumn"]>,
    default: false,
  },
  striped: {
    type: Boolean as PropType<TableProps["striped"]>,
    default: false,
  },
  size: {
    type: String as PropType<TableProps["size"]>,
    default: "medium",
  },
  themeOverrides: {
    type: Object as PropType<TableProps["themeOverrides"]>,
    default: undefined,
  },
});
</script>
