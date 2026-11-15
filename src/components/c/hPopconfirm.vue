<script setup lang="ts">
import { NPopconfirm, type PopconfirmProps, type PopconfirmSlots } from "naive-ui";

interface Props extends /* @vue-ignore */ PopconfirmProps {
  showArrow?: boolean;
}

defineOptions({ inheritAttrs: false });

const { showArrow = false } = defineProps<Props>();

defineSlots<PopconfirmSlots>();
</script>

<template>
  <n-popconfirm :show-arrow="showArrow" v-bind="$attrs">
    <template v-for="(_, name) in $slots" #[name]="slotProps">
      <slot :name="name as keyof PopconfirmSlots" v-bind="slotProps ?? {}" />
    </template>
  </n-popconfirm>
</template>
