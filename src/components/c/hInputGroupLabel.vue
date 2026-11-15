<script lang="ts" setup>
import { NInputGroupLabel } from "naive-ui";
</script>

<template>
  <n-input-group-label v-bind="$attrs">
    <slot></slot>
  </n-input-group-label>
</template>
