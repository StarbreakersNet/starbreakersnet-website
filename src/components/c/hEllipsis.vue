<script setup lang="ts">
import { NEllipsis, type EllipsisProps, type EllipsisSlots } from "naive-ui";

defineOptions({ inheritAttrs: false });

defineProps</* @vue-ignore */ EllipsisProps>();

defineSlots<EllipsisSlots>();
</script>

<template>
  <n-ellipsis v-bind="$attrs">
    <template v-for="(_, name) in $slots" #[name]="slotProps">
      <slot :name="name as keyof EllipsisSlots" v-bind="slotProps ?? {}" />
    </template>
  </n-ellipsis>
</template>
