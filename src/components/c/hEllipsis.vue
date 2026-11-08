<script lang="ts" setup>
import { NEllipsis, type PopoverProps } from "naive-ui";
import { type PropType, useAttrs, useSlots } from "vue";

const attrs = useAttrs();
const slots = useSlots();

const props = defineProps({
    lineClamp: {
        type: [String, Number],
        default: undefined,
    },
    expandTrigger: {
        type: String as PropType<"click">,
        default: undefined,
    },
    tooltip: {
        type: [Boolean, Object] as PropType<boolean | PopoverProps>,
        default: true,
    },
});
</script>

<template>
    <n-ellipsis
        :expand-trigger="props.expandTrigger"
        :line-clamp="props.lineClamp"
        :tooltip="props.tooltip"
        v-bind="attrs">
        <template v-if="slots.default">
            <slot />
        </template>
        <template v-if="slots.tooltip" #tooltip>
            <slot name="tooltip" />
        </template>
    </n-ellipsis>
</template>
