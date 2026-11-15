<script setup lang="ts">
import { NA, type AProps } from "naive-ui";

defineOptions({ inheritAttrs: false });

defineProps</* @vue-ignore */ AProps>();
</script>

<template>
  <n-a v-bind="$attrs">
    <template v-for="(_, name) in $slots" #[name]="slotProps">
      <slot :name="name" v-bind="slotProps ?? {}" />
    </template>
  </n-a>
</template>
