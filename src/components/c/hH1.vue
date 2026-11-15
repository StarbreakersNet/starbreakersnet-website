<script setup lang="ts">
import { NH1, type H1Props } from "naive-ui";

defineOptions({ inheritAttrs: false });

defineProps</* @vue-ignore */ H1Props>();
</script>

<template>
  <n-h1 v-bind="$attrs">
    <template v-for="(_, name) in $slots" #[name]="slotProps">
      <slot :name="name" v-bind="slotProps ?? {}" />
    </template>
  </n-h1>
</template>
