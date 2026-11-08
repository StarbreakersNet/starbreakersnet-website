<script lang="ts" setup>
import { NText } from "naive-ui";
import { type PropType, useAttrs, useSlots } from "vue";

const attrs = useAttrs();
const slots = useSlots();

const props = defineProps({
    type: {
        type: String,
        default: undefined,
    },
    depth: {
        type: [String, Number] as PropType<1 | 2 | 3 | "1" | "2" | "3">,
        default: undefined,
    },
    tag: {
        type: String,
        default: "span",
    },
    strong: {
        type: Boolean,
        default: false,
    },
    italic: {
        type: Boolean,
        default: false,
    },
    underline: {
        type: Boolean,
        default: false,
    },
    delete: {
        type: Boolean,
        default: false,
    },
    code: {
        type: Boolean,
        default: false,
    },
    keyboard: {
        type: Boolean,
        default: false,
    },
    themeOverrides: {
        type: Object,
    },
});
</script>

<template>
    <n-text
        :code="props.code"
        :delete="props.delete"
        :depth="props.depth"
        :italic="props.italic"
        :strong="props.strong"
        :tag="props.tag"
        :theme-overrides="props.themeOverrides"
        :type="props.type"
        :underline="props.underline"
        v-bind="attrs">
        <template v-if="slots.default">
            <slot />
        </template>
    </n-text>
</template>
