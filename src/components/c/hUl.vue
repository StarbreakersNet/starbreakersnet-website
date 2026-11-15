<script setup lang="ts">
import { NUl, type UlProps } from "naive-ui";

defineOptions({ inheritAttrs: false });

defineProps</* @vue-ignore */ UlProps>();
</script>

<template>
  <n-ul v-bind="$attrs">
    <template v-for="(_, name) in $slots" #[name]="slotProps">
      <slot :name="name" v-bind="slotProps ?? {}" />
    </template>
  </n-ul>
</template>
