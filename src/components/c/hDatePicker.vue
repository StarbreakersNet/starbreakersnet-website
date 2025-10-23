<template>
    <n-date-picker
        :actions="props.actions"
        :clearable="props.clearable"
        :close-on-select="props.closeOnSelect"
        :default-value="props.defaultValue"
        :disabled="props.disabled"
        :format="props.format"
        :is-date-disabled="props.isDateDisabled"
        :placeholder="props.placeholder"
        :placement="props.placement"
        :size="props.size"
        :to="props.to"
        :type="props.type"
        :value="props.value"
        :value-format="props.valueFormat"
        v-bind="$attrs"
        @update:value="$emit('update:value', $event)">
        <template v-if="slots.default">
            <slot />
        </template>
        <template v-if="slots['date-icon']" #date-icon>
            <slot name="date-icon" />
        </template>
        <template v-if="slots.footer" #footer>
            <slot name="footer" />
        </template>
        <template v-if="slots['next-month']" #next-month>
            <slot name="next-month" />
        </template>
        <template v-if="slots['next-year']" #next-year>
            <slot name="next-year" />
        </template>
        <template v-if="slots['prev-month']" #prev-month>
            <slot name="prev-month" />
        </template>
        <template v-if="slots['prev-year']" #prev-year>
            <slot name="prev-year" />
        </template>
        <template v-if="slots.separator" #separator>
            <slot name="separator" />
        </template>
    </n-date-picker>
</template>

<script lang="ts" setup>
import { type DatePickerProps, NDatePicker } from "naive-ui";
import { type PropType, useSlots } from "vue";

const slots = useSlots();

const props = defineProps({
    value: {
        type: [Number, Array] as PropType<number | [number, number] | null | undefined>,
        default: undefined,
    },
    defaultValue: {
        type: [Number, Array] as PropType<number | [number, number] | null | undefined>,
        default: undefined,
    },
    type: {
        type: String as PropType<DatePickerProps["type"]>,
        default: undefined,
    },
    size: {
        type: String as PropType<"small" | "medium" | "large">,
        default: undefined,
    },
    clearable: {
        type: Boolean,
        default: undefined,
    },
    disabled: {
        type: Boolean,
        default: undefined,
    },
    placeholder: {
        type: String,
        default: undefined,
    },
    format: {
        type: String,
        default: undefined,
    },
    valueFormat: {
        type: [String, Object] as PropType<DatePickerProps["valueFormat"]>,
        default: undefined,
    },
    actions: {
        type: Array as PropType<DatePickerProps["actions"]>,
        default: undefined,
    },
    isDateDisabled: {
        type: Function as PropType<DatePickerProps["isDateDisabled"]>,
        default: undefined,
    },
    closeOnSelect: {
        type: Boolean as PropType<DatePickerProps["closeOnSelect"]>,
        default: undefined,
    },
    to: {
        type: [String, Object, Boolean] as PropType<DatePickerProps["to"]>,
        default: undefined,
    },
    placement: {
        type: String as PropType<DatePickerProps["placement"]>,
        default: undefined,
    },
});

defineEmits(["update:value"]);
</script>
