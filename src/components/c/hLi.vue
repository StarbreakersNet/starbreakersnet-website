<script setup lang="ts">
import { NLi } from "naive-ui";

defineOptions({ inheritAttrs: false });
</script>

<template>
  <n-li v-bind="$attrs">
    <template v-for="(_, name) in $slots" #[name]="slotProps">
      <slot :name="name" v-bind="slotProps ?? {}" />
    </template>
  </n-li>
</template>
