<script setup lang="ts">
import { NFloatButton, type FloatButtonProps, type FloatButtonSlots } from "naive-ui";

defineOptions({ inheritAttrs: false });

defineProps</* @vue-ignore */ FloatButtonProps>();

defineSlots<FloatButtonSlots>();
</script>

<template>
  <n-float-button v-bind="$attrs">
    <template v-for="(_, name) in $slots" #[name]="slotProps">
      <slot :name="name as keyof FloatButtonSlots" v-bind="slotProps ?? {}" />
    </template>
  </n-float-button>
</template>
