<template>
    <n-dropdown
        :animated="props.animated"
        :children-field="props.childrenField"
        :inverted="props.inverted"
        :key-field="props.keyField"
        :keyboard="props.keyboard"
        :label-field="props.labelField"
        :menu-props="props.menuProps"
        :node-props="props.nodeProps"
        :options="props.options"
        :placement="props.placement"
        :render-icon="props.renderIcon"
        :render-label="props.renderLabel"
        :render-option="props.renderOption"
        :size="props.size"
        :trigger="props.trigger"
        v-bind="$attrs">
        <slot name="default" />
    </n-dropdown>
</template>

<script lang="ts" setup>
import { NDropdown } from "naive-ui";
import type {
    DropdownMenuProps,
    DropdownMixedOption,
    NodeProps,
    RenderIcon,
    RenderLabel,
    RenderOption,
} from "naive-ui/es/dropdown/src/interface";
import type { PropType } from "vue";

const props = defineProps({
    animated: {
        type: Boolean,
        default: true,
    },
    inverted: {
        type: Boolean,
        default: false,
    },
    childrenField: {
        type: String,
        default: "children",
    },
    keyboard: {
        type: Boolean,
        default: true,
    },
    keyField: {
        type: String,
        default: "key",
    },
    labelField: {
        type: String,
        default: "label",
    },
    nodeProps: {
        type: Function as PropType<NodeProps>,
        default: undefined,
    },
    menuProps: {
        type: Function as PropType<DropdownMenuProps>,
        default: undefined,
    },
    options: {
        type: Array as PropType<DropdownMixedOption[]>,
        default: () => [],
    },
    renderIcon: {
        type: Function as PropType<RenderIcon>,
        default: undefined,
    },
    renderLabel: {
        type: Function as PropType<RenderLabel>,
        default: undefined,
    },
    renderOption: {
        type: Function as PropType<RenderOption>,
        default: undefined,
    },
    size: {
        type: String as PropType<"small" | "medium" | "large" | "huge">,
        default: "medium",
    },
    trigger: {
        type: String as PropType<"click" | "hover" | "focus" | "manual">,
        default: "hover",
    },
    placement: {
        type: String as PropType<
            | "top"
            | "top-start"
            | "top-end"
            | "right"
            | "right-start"
            | "right-end"
            | "bottom"
            | "bottom-start"
            | "bottom-end"
            | "left"
            | "left-start"
            | "left-end"
        >,
        default: "bottom",
    },
});
</script>

<style lang="scss" scoped></style>
