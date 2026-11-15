<script setup lang="ts">
import { NAlert, type AlertProps, type AlertSlots } from "naive-ui";

interface Props extends /* @vue-ignore */ AlertProps {
  bordered?: boolean;
}

defineOptions({ inheritAttrs: false });

const { bordered = false } = defineProps<Props>();

defineSlots<AlertSlots>();
</script>

<template>
  <n-alert :bordered="bordered" v-bind="$attrs">
    <template v-for="(_, name) in $slots" #[name]="slotProps">
      <slot :name="name as keyof AlertSlots" v-bind="slotProps ?? {}" />
    </template>
  </n-alert>
</template>
