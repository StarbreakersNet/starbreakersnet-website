<template>
    <n-popconfirm
        :disabled="props.disabled"
        :negative-button-props="props.negativeButtonProps"
        :negative-text="props.negativeText"
        :placement="props.placement"
        :positive-button-props="props.positiveButtonProps"
        :positive-text="props.positiveText"
        :show="props.show"
        :show-arrow="!!props.showArrow"
        :show-icon="props.showIcon"
        :to="props.to"
        :trigger="props.trigger"
        v-bind="$attrs"
        @positive-click="$emit('positive-click', $event)"
        @negative-click="$emit('negative-click', $event)"
        @update:show="$emit('update:show', $event)">
        <template v-if="slots.trigger" #trigger>
            <slot name="trigger" />
        </template>
        <template v-if="slots.icon" #icon>
            <slot name="icon" />
        </template>
        <template v-if="slots.action" #action>
            <slot name="action" />
        </template>
        <template #default>
            <slot />
        </template>
    </n-popconfirm>
</template>

<script lang="ts" setup>
import { type ButtonProps, NPopconfirm, type PopconfirmProps } from "naive-ui";
import { type PropType, useSlots } from "vue";

const slots = useSlots();

const props = defineProps({
    show: {
        type: Boolean as PropType<PopconfirmProps["show"]>,
        default: undefined,
    },
    to: {
        type: [String, Object, Boolean] as PropType<PopconfirmProps["to"]>,
        default: undefined,
    },
    trigger: {
        type: String as PropType<PopconfirmProps["trigger"]>,
        default: undefined,
    },
    placement: {
        type: String as PropType<PopconfirmProps["placement"]>,
        default: undefined,
    },
    positiveText: {
        type: String as PropType<PopconfirmProps["positiveText"]>,
        default: undefined,
    },
    negativeText: {
        type: String as PropType<PopconfirmProps["negativeText"]>,
        default: undefined,
    },
    positiveButtonProps: {
        type: Object as PropType<ButtonProps>,
        default: undefined,
    },
    negativeButtonProps: {
        type: Object as PropType<ButtonProps>,
        default: undefined,
    },
    showIcon: {
        type: Boolean as PropType<PopconfirmProps["showIcon"]>,
        default: true,
    },
    disabled: {
        type: Boolean,
        default: undefined,
    },
    showArrow: {
        type: Boolean,
        default: false,
    },
});

defineEmits(["positive-click", "negative-click", "update:show"]);
</script>
