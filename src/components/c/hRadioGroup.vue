<template>
  <n-radio-group
    :disabled="props.disabled"
    :name="props.name"
    :size="props.size"
    :value="props.value"
    v-bind="$attrs"
    @update:value="$emit('update:value', $event)">
    <slot />
  </n-radio-group>
</template>

<script lang="ts" setup>
import { NRadioGroup, type RadioGroupProps } from "naive-ui";
import { type PropType } from "vue";

const props = defineProps({
  value: {
    type: [String, Number, Boolean] as PropType<RadioGroupProps["value"]>,
    default: undefined,
  },
  name: {
    type: String,
    default: undefined,
  },
  size: {
    type: String as PropType<RadioGroupProps["size"]>,
    default: undefined,
  },
  disabled: {
    type: Boolean,
    default: undefined,
  },
});

defineEmits(["update:value"]);
</script>
