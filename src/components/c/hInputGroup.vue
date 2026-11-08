<template>
    <n-input-group v-bind="$attrs">
        <slot></slot>
    </n-input-group>
</template>

<script lang="ts" setup>
import { NInputGroup } from "naive-ui";
</script>

<style lang="scss" scoped></style>
