<script setup lang="ts">
import { NText, type TextProps } from "naive-ui";

interface Props extends /* @vue-ignore */ TextProps {
  tag?: TextProps["tag"];
}

defineOptions({ inheritAttrs: false });

const { tag = "span" } = defineProps<Props>();
</script>

<template>
  <n-text :tag="tag" v-bind="$attrs">
    <template v-for="(_, name) in $slots" #[name]="slotProps">
      <slot :name="name" v-bind="slotProps ?? {}" />
    </template>
  </n-text>
</template>
