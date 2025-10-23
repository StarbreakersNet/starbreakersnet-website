<template>
    <n-tag
        :type="props.type"
        :size="props.size"
        :bordered="props.bordered"
        :round="props.round"
        :strong="props.strong"
        :closable="props.closable"
        :checkable="props.checkable"
        :checked="props.checked"
        :disabled="props.disabled"
        :color="props.color"
        :theme-overrides="props.themeOverrides"
        :trigger-click-on-close="props.triggerClickOnClose"
        v-bind="$attrs"
        @close="$emit('close', $event)"
        @update:checked="$emit('update:checked', $event)">
        <template v-if="slots.avatar" #avatar>
            <slot name="avatar" />
        </template>
        <template v-if="slots.icon" #icon>
            <slot name="icon" />
        </template>
        <template v-if="slots.default" #default>
            <slot />
        </template>
    </n-tag>
</template>

<script lang="ts" setup>
import { NTag, type TagProps } from "naive-ui";
import { type PropType, useSlots } from "vue";

const props = defineProps({
    type: {
        type: String as PropType<TagProps["type"]>,
        default: undefined,
    },
    size: {
        type: String as PropType<TagProps["size"]>,
        default: undefined,
    },
    bordered: {
        type: Boolean as PropType<TagProps["bordered"]>,
        default: false,
    },
    round: {
        type: Boolean as PropType<TagProps["round"]>,
        default: undefined,
    },
    strong: {
        type: Boolean as PropType<TagProps["strong"]>,
        default: undefined,
    },
    closable: {
        type: Boolean as PropType<TagProps["closable"]>,
        default: undefined,
    },
    checkable: {
        type: Boolean as PropType<TagProps["checkable"]>,
        default: undefined,
    },
    checked: {
        type: Boolean as PropType<TagProps["checked"]>,
        default: undefined,
    },
    disabled: {
        type: Boolean as PropType<TagProps["disabled"]>,
        default: undefined,
    },
    color: {
        type: Object as PropType<TagProps["color"]>,
        default: undefined,
    },
    themeOverrides: {
        type: Object as PropType<TagProps["themeOverrides"]>,
        default: undefined,
    },
    triggerClickOnClose: {
        type: Boolean as PropType<TagProps["triggerClickOnClose"]>,
        default: undefined,
    },
});

const slots = useSlots();

defineEmits<{
    (e: "close", event: MouseEvent): void;
    (e: "update:checked", value: boolean): void;
}>();
</script>

<style scoped></style>
