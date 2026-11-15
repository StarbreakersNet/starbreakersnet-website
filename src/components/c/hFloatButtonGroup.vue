<script setup lang="ts">
import { NFloatButtonGroup, type FloatButtonGroupProps } from "naive-ui";

defineOptions({ inheritAttrs: false });

defineProps</* @vue-ignore */ FloatButtonGroupProps>();
</script>

<template>
  <n-float-button-group v-bind="$attrs">
    <template v-for="(_, name) in $slots" #[name]="slotProps">
      <slot :name="name" v-bind="slotProps ?? {}" />
    </template>
  </n-float-button-group>
</template>
