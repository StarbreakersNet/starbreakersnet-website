<template>
    <n-switch
        :value="props.value"
        :default-value="props.defaultValue"
        :disabled="props.disabled"
        :loading="props.loading"
        :size="props.size"
        :round="props.round"
        :rubber-band="props.rubberBand"
        :rail-style="props.railStyle"
        :checked-value="props.checkedValue"
        :unchecked-value="props.uncheckedValue"
        v-bind="$attrs"
        @update:value="$emit('update:value', $event)">
        <template v-if="slots['checked-icon']" #checked-icon>
            <slot name="checked-icon" />
        </template>
        <template v-if="slots['unchecked-icon']" #unchecked-icon>
            <slot name="unchecked-icon" />
        </template>
        <template v-if="slots.checked" #checked>
            <slot name="checked" />
        </template>
        <template v-if="slots.unchecked" #unchecked>
            <slot name="unchecked" />
        </template>
        <template v-if="slots.icon" #icon>
            <slot name="icon" />
        </template>
    </n-switch>
</template>

<script lang="ts" setup>
import { NSwitch, type SwitchProps } from 'naive-ui';
import { type CSSProperties, type PropType, useSlots } from 'vue';

const slots = useSlots();

const props = defineProps({
    value: {
        type: [Boolean, String, Number],
        default: undefined,
    },
    defaultValue: {
        type: [Boolean, String, Number],
        default: undefined,
    },
    disabled: {
        type: Boolean,
        default: false,
    },
    loading: {
        type: Boolean,
        default: false,
    },
    size: {
        type: String as PropType<SwitchProps['size']>,
        default: 'medium',
    },
    round: {
        type: Boolean,
        default: true,
    },
    rubberBand: {
        type: Boolean,
        default: true,
    },
    railStyle: {
        type: Function as PropType<(params: {
            focused: boolean;
            checked: boolean;
        }) => string | CSSProperties>,
        default: undefined,
    },
    checkedValue: {
        type: [Boolean, String, Number],
        default: true,
    },
    uncheckedValue: {
        type: [Boolean, String, Number],
        default: false,
    },
});

defineEmits(['update:value']);
</script>

<style lang="sass" scoped></style>
