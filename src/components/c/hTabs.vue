<template>
  <n-tabs
    :animated="props.animated"
    :justify-content="props.justifyContent"
    :size="props.size"
    :type="props.type"
    :value="props.value"
    v-bind="$attrs"
    @update:value="$emit('update:value', $event)">
    <slot />
  </n-tabs>
</template>

<script lang="ts" setup>
import { NTabs, type TabsProps } from "naive-ui";
import { type PropType } from "vue";

const props = defineProps({
  value: {
    type: [String, Number] as PropType<TabsProps["value"]>,
    default: undefined,
  },
  type: {
    type: String as PropType<TabsProps["type"]>,
    default: "bar",
  },
  size: {
    type: String as PropType<TabsProps["size"]>,
    default: undefined,
  },
  justifyContent: {
    type: String as PropType<TabsProps["justifyContent"]>,
    default: undefined,
  },
  animated: {
    type: Boolean,
    default: false,
  },
});

defineEmits(["update:value"]);
</script>
