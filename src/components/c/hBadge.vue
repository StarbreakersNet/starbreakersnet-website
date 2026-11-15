<script setup lang="ts">
import { NBadge, type BadgeProps } from "naive-ui";

interface Props extends /* @vue-ignore */ BadgeProps {
  max?: BadgeProps["max"];
}

defineOptions({ inheritAttrs: false });

const { max = 99 } = defineProps<Props>();
</script>

<template>
  <n-badge :max="max" v-bind="$attrs">
    <template v-for="(_, name) in $slots" #[name]="slotProps">
      <slot :name="name" v-bind="slotProps ?? {}" />
    </template>
  </n-badge>
</template>
