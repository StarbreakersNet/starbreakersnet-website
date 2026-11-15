<script setup lang="ts">
import { NFlex, type FlexProps } from "naive-ui";

interface Props extends /* @vue-ignore */ FlexProps {
  align?: FlexProps["align"];
  vertical?: boolean;
  wrap?: boolean;
}

defineOptions({ inheritAttrs: false });

const { align, vertical = false, wrap = false } = defineProps<Props>();
</script>

<template>
  <n-flex
    :align="align || (vertical ? undefined : 'center')"
    :vertical="vertical"
    :wrap="wrap"
    v-bind="$attrs">
    <template v-for="(_, name) in $slots" #[name]="slotProps">
      <slot :name="name" v-bind="slotProps ?? {}" />
    </template>
  </n-flex>
</template>
