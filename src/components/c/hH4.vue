<script setup lang="ts">
import { NH4, type H4Props } from "naive-ui";

defineOptions({ inheritAttrs: false });

defineProps</* @vue-ignore */ H4Props>();
</script>

<template>
  <n-h4 v-bind="$attrs">
    <template v-for="(_, name) in $slots" #[name]="slotProps">
      <slot :name="name" v-bind="slotProps ?? {}" />
    </template>
  </n-h4>
</template>
