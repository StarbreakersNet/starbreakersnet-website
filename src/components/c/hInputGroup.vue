<script lang="ts" setup>
import { NInputGroup } from "naive-ui";
</script>

<template>
  <n-input-group v-bind="$attrs">
    <slot></slot>
  </n-input-group>
</template>
