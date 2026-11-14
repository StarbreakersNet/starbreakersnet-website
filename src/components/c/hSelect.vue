<template>
  <n-select
    :clearable="props.clearable"
    :disabled="props.disabled"
    :filterable="props.filterable"
    :loading="props.loading"
    :options="props.options"
    :placeholder="props.placeholder"
    :remote="props.remote"
    :size="props.size"
    :value="props.value"
    v-bind="$attrs"
    @search="$emit('search', $event)"
    @update:value="$emit('update:value', $event)">
    <template v-if="slots.empty" #empty>
      <slot name="empty" />
    </template>
  </n-select>
</template>

<script lang="ts" setup>
import { NSelect, type SelectProps } from "naive-ui";
import { type PropType, useSlots } from "vue";

const slots = useSlots();

const props = defineProps({
  value: {
    type: [String, Number, Array] as PropType<SelectProps["value"]>,
    default: undefined,
  },
  options: {
    type: Array as PropType<SelectProps["options"]>,
    default: () => [],
  },
  placeholder: {
    type: String,
    default: undefined,
  },
  size: {
    type: String as PropType<SelectProps["size"]>,
    default: undefined,
  },
  filterable: {
    type: Boolean,
    default: false,
  },
  remote: {
    type: Boolean,
    default: false,
  },
  clearable: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: undefined,
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

defineEmits(["update:value", "search"]);
</script>
