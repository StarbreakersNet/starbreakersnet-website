<script setup lang="ts">
import { NTag, type TagProps, type TagSlots } from "naive-ui";

interface Props extends /* @vue-ignore */ TagProps {
  bordered?: boolean;
}

defineOptions({ inheritAttrs: false });

const { bordered = false } = defineProps<Props>();

defineSlots<TagSlots>();
</script>

<template>
  <n-tag :bordered="bordered" v-bind="$attrs">
    <template v-for="(_, name) in $slots" #[name]="slotProps">
      <slot :name="name as keyof TagSlots" v-bind="slotProps ?? {}" />
    </template>
  </n-tag>
</template>
