<template>
  <n-radio-button :disabled="props.disabled" :value="props.value" v-bind="$attrs">
    <slot />
  </n-radio-button>
</template>

<script lang="ts" setup>
import { NRadioButton, type RadioButtonProps } from "naive-ui";
import { type PropType } from "vue";

const props = defineProps({
  value: {
    type: [String, Number, Boolean] as PropType<RadioButtonProps["value"]>,
    default: undefined,
  },
  disabled: {
    type: Boolean,
    default: undefined,
  },
});
</script>
