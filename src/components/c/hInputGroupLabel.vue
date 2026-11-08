<template>
    <n-input-group-label v-bind="$attrs">
        <slot></slot>
    </n-input-group-label>
</template>

<script lang="ts" setup>
import { NInputGroupLabel } from "naive-ui";
</script>

<style lang="scss" scoped></style>
