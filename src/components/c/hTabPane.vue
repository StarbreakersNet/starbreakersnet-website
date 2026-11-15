<script lang="ts" setup>
import { NTabPane } from "naive-ui";
import { type PropType } from "vue";

defineOptions({
  __TAB_PANE__: true,
});

const props = defineProps({
  name: {
    type: [String, Number] as PropType<string | number>,
    required: true,
  },
  tab: {
    type: String,
    default: undefined,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});
</script>

<template>
  <n-tab-pane :disabled="props.disabled" :name="props.name" :tab="props.tab" v-bind="$attrs">
    <slot />
  </n-tab-pane>
</template>
