<template>
    <n-menu
        v-model:expanded-keys="expandedKeys"
        v-model:value="modelValue"
        :accordion="props.accordion"
        :children-field="props.childrenField"
        :collapsed="props.collapsed"
        :collapsed-icon-size="props.collapsedIconSize"
        :collapsed-width="props.collapsedWidth"
        :default-expand-all="props.defaultExpandAll"
        :default-expanded-keys="props.defaultExpandedKeys"
        :default-value="props.defaultValue"
        :disabled-field="props.disabledField"
        :dropdown-placement="props.dropdownPlacement"
        :dropdown-props="props.dropdownProps"
        :expand-icon="props.expandIcon"
        :icon-size="props.iconSize"
        :indent="props.indent"
        :inverted="props.inverted"
        :key-field="props.keyField"
        :label-field="props.labelField"
        :mode="props.mode"
        :node-props="props.nodeProps"
        :options="props.options"
        :render-extra="props.renderExtra"
        :render-icon="props.renderIcon"
        :render-label="props.renderLabel"
        :responsive="props.responsive"
        :root-indent="props.rootIndent"
        :watch-props="props.watchProps"
        v-bind="$attrs">
        <slot></slot>
    </n-menu>
</template>

<script lang="ts" setup>
import { type MenuGroupOption, type MenuNodeProps, type MenuOption, NMenu } from "naive-ui";
import type { DropdownProps } from "naive-ui/es/dropdown";
import type { MenuMixedOption } from "naive-ui/es/menu/src/interface";
import type { Key } from "treemate";
import { type PropType, type VNodeChild } from "vue";

const modelValue = defineModel<string>("modelValue");
const expandedKeys = defineModel<string[]>("expandedKeys");

const props = defineProps({
    accordion: {
        type: Boolean,
        default: false,
    },
    childrenField: {
        type: String,
        default: "children",
    },
    collapsedIconSize: {
        type: Number,
        default: 24,
    },
    collapsedWidth: {
        type: Number,
        default: 48,
    },
    collapsed: {
        type: Boolean,
        default: false,
    },
    defaultExpandAll: {
        type: Boolean,
        default: false,
    },
    defaultExpandedKeys: {
        type: Array as PropType<Key[]>,
        default: () => [],
    },
    defaultValue: {
        type: String as PropType<Key | null>,
        default: null,
    },
    disabledField: {
        type: String,
        default: "disabled",
    },
    dropdownPlacement: {
        type: String as PropType<
            | "top-start"
            | "top"
            | "top-end"
            | "right-start"
            | "right"
            | "right-end"
            | "bottom-start"
            | "bottom"
            | "bottom-end"
            | "left-start"
            | "left"
            | "left-end"
        >,
        default: "top",
    },
    dropdownProps: {
        type: Object as PropType<DropdownProps>,
        default: undefined,
    },
    expandIcon: {
        type: Function as PropType<(option: MenuOption) => VNodeChild>,
        default: undefined,
    },
    iconSize: {
        type: Number,
        default: 20,
    },
    indent: {
        type: Number,
        default: 32,
    },
    inverted: {
        type: Boolean,
        default: false,
    },
    keyField: {
        type: String,
        default: "key",
    },
    labelField: {
        type: String,
        default: "label",
    },
    options: {
        type: Array as PropType<MenuMixedOption[]>,
        default: () => [],
    },
    nodeProps: {
        type: Function as PropType<MenuNodeProps>,
        default: undefined,
    },
    mode: {
        type: String as PropType<"vertical" | "horizontal">,
        default: "vertical",
    },
    renderExtra: {
        type: Function as PropType<(option: MenuOption | MenuGroupOption) => VNodeChild>,
        default: undefined,
    },
    renderIcon: {
        type: Function as PropType<(option: MenuOption) => VNodeChild>,
        default: undefined,
    },
    renderLabel: {
        type: Function as PropType<(option: MenuOption | MenuGroupOption) => VNodeChild>,
        default: undefined,
    },
    responsive: {
        type: Boolean,
        default: false,
    },
    rootIndent: {
        type: Number,
        default: undefined,
    },
    watchProps: {
        type: Array as PropType<Array<"defaultValue" | "defaultExpandedKeys">>,
        default: undefined,
    },
});
</script>
