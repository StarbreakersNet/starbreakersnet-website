<template>
    <n-collapse-item
        ref="collapseItem"
        :disabled="props.disabled"
        :display-directive="props.displayDirective"
        :name="props.name"
        :title="props.title"
        v-bind="$attrs">
        <template v-if="slots.default" #default>
            <slot name="default" />
        </template>
        <template v-if="slots.header" #header="slotProps">
            <slot name="header" v-bind="slotProps" />
        </template>
        <template v-if="slots['header-extra']" #header-extra="slotProps">
            <slot name="header-extra" v-bind="slotProps" />
        </template>
        <template v-if="slots.arrow" #arrow="slotProps">
            <slot name="arrow" v-bind="slotProps" />
        </template>
    </n-collapse-item>
</template>

<script lang="ts" setup>
import { NCollapseItem } from "naive-ui";
import { type PropType, useSlots } from "vue";

const slots = useSlots();

const props = defineProps({
    title: {
        type: String,
        default: undefined,
    },
    name: {
        type: [String, Number] as PropType<string | number>,
        default: undefined,
    },
    disabled: {
        type: Boolean,
        default: false,
    },
    displayDirective: {
        type: String as PropType<"if" | "show">,
        default: undefined,
    },
});
</script>
