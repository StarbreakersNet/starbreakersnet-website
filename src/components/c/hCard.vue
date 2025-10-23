<template>
    <n-card
        :action="props.action"
        :bordered="props.bordered"
        :closable="props.closable"
        :content="props.content"
        :content-class="props.contentClass"
        :content-style="props.contentStyle"
        :cover="props.cover"
        :embedded="props.embedded"
        :footer="props.footer"
        :footer-class="props.footerClass"
        :footer-style="props.footerStyle"
        :header-class="props.headerClass"
        :header-extra="props.headerExtra"
        :header-extra-class="props.headerExtraClass"
        :header-extra-style="props.headerExtraStyle"
        :header-style="props.headerStyle"
        :hoverable="props.hoverable"
        :segmented="props.segmented"
        :size="props.size"
        :tag="props.tag"
        :theme-overrides="props.themeOverrides"
        :title="props.title"
        v-bind="$attrs">
        <template v-if="slots.header" #header>
            <slot name="header" />
        </template>
        <template v-if="slots['header-extra']" #header-extra>
            <slot name="header-extra" />
        </template>
        <template #default>
            <slot name="default" />
        </template>
        <template v-if="slots.footer" #footer>
            <slot name="footer" />
        </template>
        <template v-if="slots.action" #action>
            <slot name="action" />
        </template>
        <template v-if="slots.cover" #cover>
            <slot name="cover" />
        </template>
    </n-card>
</template>

<script lang="ts" setup>
import { type CardProps, NCard } from "naive-ui";
import type { CardSegmented } from "naive-ui/es/card/src/Card";
import { type CSSProperties, type PropType, useSlots, type VNodeChild } from "vue";

const props = defineProps({
    action: {
        type: Function as PropType<() => VNodeChild>,
        default: undefined,
    },
    bordered: {
        type: Boolean,
        default: true,
    },
    closable: {
        type: Boolean,
        default: false,
    },
    content: {
        type: [String, Function] as PropType<string | (() => VNodeChild)>,
        default: undefined,
    },
    contentClass: {
        type: String,
        default: undefined,
    },
    contentStyle: {
        type: [Object, String] as PropType<CSSProperties | string>,
        default: undefined,
    },
    cover: {
        type: Function as PropType<() => VNodeChild>,
        default: undefined,
    },
    embedded: {
        type: Boolean,
        default: false,
    },
    footer: {
        type: Function as PropType<() => VNodeChild>,
        default: undefined,
    },
    footerClass: {
        type: String,
        default: undefined,
    },
    footerStyle: {
        type: [Object, String] as PropType<CSSProperties | string>,
        default: undefined,
    },
    headerClass: {
        type: String,
        default: undefined,
    },
    headerStyle: {
        type: [Object, String] as PropType<CSSProperties | string>,
        default: undefined,
    },
    headerExtra: {
        type: Function as PropType<() => VNodeChild>,
        default: undefined,
    },
    headerExtraClass: {
        type: String,
        default: undefined,
    },
    headerExtraStyle: {
        type: [Object, String] as PropType<CSSProperties | string>,
        default: undefined,
    },
    hoverable: {
        type: Boolean,
        default: false,
    },
    segmented: {
        type: [Boolean, Object] as PropType<boolean | CardSegmented>,
        default: false,
    },
    size: {
        type: String as PropType<"small" | "medium" | "large" | "huge">,
        default: "medium",
    },
    tag: {
        type: String as PropType<keyof HTMLElementTagNameMap>,
        default: "div",
    },
    title: {
        type: [String, Function] as PropType<string | (() => VNodeChild)>,
        default: undefined,
    },
    themeOverrides: {
        type: Object as PropType<CardProps["themeOverrides"]>,
        default: undefined,
    },
});

const slots = useSlots();
</script>
