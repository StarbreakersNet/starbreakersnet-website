<script setup lang="ts">
import { NMenu, type MenuProps } from "naive-ui";

interface Props extends /* @vue-ignore */ MenuProps {
  collapsed?: boolean;
  defaultExpandedKeys?: MenuProps["defaultExpandedKeys"];
  dropdownPlacement?: MenuProps["dropdownPlacement"];
}

defineOptions({ inheritAttrs: false });

const modelValue = defineModel<string>("modelValue");
const expandedKeys = defineModel<string[]>("expandedKeys");

const {
  collapsed = false,
  defaultExpandedKeys = [],
  dropdownPlacement = "top",
} = defineProps<Props>();
</script>

<template>
  <n-menu
    v-model:expanded-keys="expandedKeys"
    v-model:value="modelValue"
    :collapsed="collapsed"
    :default-expanded-keys="defaultExpandedKeys"
    :dropdown-placement="dropdownPlacement"
    v-bind="$attrs">
    <template v-for="(_, name) in $slots" #[name]="slotProps">
      <slot :name="name" v-bind="slotProps ?? {}" />
    </template>
  </n-menu>
</template>
