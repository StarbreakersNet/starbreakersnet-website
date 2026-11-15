<script setup lang="ts">
import { NTable, type TableProps } from "naive-ui";

// Tableau HTML simple (thead, tbody, tr, th, td écrits dans le slot), aux couleurs du thème.
// Pour un tableau construit à partir de colonnes et de données, voir NDataTable.

defineOptions({ inheritAttrs: false });

defineProps</* @vue-ignore */ TableProps>();
</script>

<template>
  <n-table v-bind="$attrs">
    <template v-for="(_, name) in $slots" #[name]="slotProps">
      <slot :name="name" v-bind="slotProps ?? {}" />
    </template>
  </n-table>
</template>
