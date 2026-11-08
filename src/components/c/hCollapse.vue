<template>
    <n-collapse
        ref="collapse"
        :accordion="props.accordion"
        :arrow-placement="props.arrowPlacement"
        :default-expanded-names="props.defaultExpandedNames"
        :display-directive="props.displayDirective"
        :expanded-names="props.expandedNames"
        :trigger-areas="props.triggerAreas"
        v-bind="$attrs"
        @update:expanded-names="$emit('update:expandedNames', $event)"
        @item-header-click="$emit('itemHeaderClick', $event)">
        <template v-if="slots.default" #default>
            <slot name="default" />
        </template>
        <template v-if="slots.arrow" #arrow="slotProps">
            <slot name="arrow" v-bind="slotProps" />
        </template>
        <template v-if="slots.header" #header="slotProps">
            <slot name="header" v-bind="slotProps" />
        </template>
        <template v-if="slots['header-extra']" #header-extra="slotProps">
            <slot name="header-extra" v-bind="slotProps" />
        </template>
    </n-collapse>
</template>

<script lang="ts" setup>
import { NCollapse } from "naive-ui";
import { type PropType, useSlots } from "vue";

const slots = useSlots();

const props = defineProps({
    defaultExpandedNames: {
        type: [String, Number, Array] as PropType<string | number | Array<string | number> | null>,
        default: null,
    },
    expandedNames: {
        type: [String, Number, Array] as PropType<string | number | Array<string | number> | null>,
        default: undefined,
    },
    arrowPlacement: {
        type: String as PropType<"left" | "right">,
        default: "left",
    },
    accordion: {
        type: Boolean,
        default: false,
    },
    displayDirective: {
        type: String as PropType<"if" | "show">,
        default: "if",
    },
    triggerAreas: {
        type: Array as PropType<Array<"main" | "extra" | "arrow">>,
        default: () => ["arrow", "extra", "main"],
    },
});

defineEmits(["update:expandedNames", "itemHeaderClick"]);
</script>
