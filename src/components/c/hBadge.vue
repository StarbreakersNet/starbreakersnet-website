<template>
    <n-badge
        :color="props.color"
        :dot="props.dot"
        :max="props.max"
        :offset="props.offset"
        :processing="props.processing"
        :show="props.show"
        :show-zero="props.showZero"
        :type="props.type"
        :value="props.value"
        v-bind="$attrs">
        <slot />
    </n-badge>
</template>

<script lang="ts" setup>
import { NBadge } from "naive-ui";
import { type PropType } from "vue";

export type hBadgeType = "default" | "error" | "info" | "success" | "warning";

const props = defineProps({
    color: {
        type: String,
        default: undefined,
    },
    dot: {
        type: Boolean,
        default: false,
    },
    max: {
        type: Number,
        default: 99,
    },
    offset: {
        type: [] as PropType<readonly [number | string, number | string]>,
        default: () => undefined,
    },
    processing: {
        type: Boolean,
        default: false,
    },
    showZero: {
        type: Boolean,
        default: false,
    },
    show: {
        type: Boolean,
        default: true,
    },
    type: {
        type: String as PropType<hBadgeType>,
        default: "default",
    },
    value: {
        type: [String, Number],
        default: undefined,
    },
});
</script>

<style lang="sass" scoped></style>
