<script setup lang="ts">
import { NInputGroupLabel, type InputGroupLabelProps } from "naive-ui";

defineOptions({ inheritAttrs: false });

defineProps</* @vue-ignore */ InputGroupLabelProps>();
</script>

<template>
  <n-input-group-label v-bind="$attrs">
    <template v-for="(_, name) in $slots" #[name]="slotProps">
      <slot :name="name" v-bind="slotProps ?? {}" />
    </template>
  </n-input-group-label>
</template>
