<template>
    <n-input
        ref="inputRef"
        :allow-input="props.allowInput"
        :autosize="props.autosize"
        :clearable="props.clearable"
        :default-value="props.defaultValue"
        :disabled="props.disabled"
        :input-props="props.inputProps"
        :maxlength="props.maxlength"
        :minlength="props.minlength"
        :placeholder="props.placeholder"
        :round="props.round"
        :size="props.size"
        :type="props.type"
        :value="props.value"
        v-bind="$attrs"
        @update:value="$emit('update:value', $event)">
        <template v-if="slots.prefix" #prefix>
            <slot name="prefix" />
        </template>
        <template v-if="slots.suffix" #suffix>
            <slot name="suffix" />
        </template>
        <template v-if="slots.clear" #clear>
            <slot name="clear" />
        </template>
        <template v-if="slots.count" #count>
            <slot name="count" />
        </template>
    </n-input>
</template>

<script lang="ts" setup>
import { type InputProps, NInput } from "naive-ui";
import { type PropType, useSlots, useTemplateRef } from "vue";

const inputRef = useTemplateRef("inputRef");

const slots = useSlots();

const props = defineProps({
    value: {
        type: [String, Number] as PropType<string | number | null | undefined>,
        default: undefined,
    },
    defaultValue: {
        type: [String, Number] as PropType<string | number | null | undefined>,
        default: undefined,
    },
    placeholder: {
        type: String,
        default: undefined,
    },
    type: {
        type: String as PropType<InputProps["type"]>,
        default: undefined,
    },
    size: {
        type: String as PropType<"small" | "medium" | "large">,
        default: undefined,
    },
    disabled: {
        type: Boolean,
        default: undefined,
    },
    clearable: {
        type: Boolean,
        default: undefined,
    },
    minlength: {
        type: Number,
        default: undefined,
    },
    maxlength: {
        type: Number,
        default: undefined,
    },
    autosize: {
        type: [Boolean, Object] as PropType<boolean | { minRows?: number; maxRows?: number }>,
        default: undefined,
    },
    round: {
        type: Boolean,
        default: false,
    },
    allowInput: {
        type: Function as PropType<InputProps["allowInput"]>,
        default: undefined,
    },
    inputProps: {
        type: Object as PropType<Record<string, any>>,
        default: undefined,
    },
});

defineEmits(["update:value"]);

function blur() {
    inputRef.value?.blur();
}

function clear() {
    inputRef.value?.clear();
}

function focus() {
    inputRef.value?.focus();
}

function scrollTo(options: ScrollToOptions) {
    inputRef.value?.scrollTo(options);
}

function select() {
    inputRef.value?.select();
}

defineExpose({
    blur,
    clear,
    focus,
    scrollTo,
    select,
})
</script>

<style scoped>
:deep(.n-input) {
    width: 100%;
}
</style>
