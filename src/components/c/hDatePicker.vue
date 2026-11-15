<script setup lang="ts">
import { NDatePicker, type DatePickerProps, type DatePickerSlots } from "naive-ui";

defineOptions({ inheritAttrs: false });

defineProps</* @vue-ignore */ DatePickerProps>();

defineSlots<DatePickerSlots>();
</script>

<template>
  <n-date-picker v-bind="$attrs">
    <template v-for="(_, name) in $slots" #[name]="slotProps">
      <slot :name="name as keyof DatePickerSlots" v-bind="slotProps ?? {}" />
    </template>
  </n-date-picker>
</template>
