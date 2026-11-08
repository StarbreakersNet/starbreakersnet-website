<script lang="ts" setup>
import { NThing, type ThingProps } from "naive-ui";
import { type PropType, useAttrs, useSlots } from "vue";

const attrs = useAttrs();
const slots = useSlots();

const props = defineProps({
    title: {
        type: String as PropType<ThingProps["title"]>,
        default: undefined,
    },
    titleExtra: {
        type: String as PropType<ThingProps["titleExtra"]>,
        default: undefined,
    },
    description: {
        type: String as PropType<ThingProps["description"]>,
        default: undefined,
    },
    content: {
        type: String as PropType<ThingProps["content"]>,
        default: undefined,
    },
    contentIndented: {
        type: Boolean as PropType<ThingProps["contentIndented"]>,
        default: false,
    },
    contentClass: {
        type: [String, Object] as PropType<ThingProps["contentClass"]>,
        default: undefined,
    },
    contentStyle: {
        type: [String, Object] as PropType<ThingProps["contentStyle"]>,
        default: undefined,
    },
    themeOverrides: {
        type: Object as PropType<ThingProps["themeOverrides"]>,
    },
});
</script>

<template>
    <n-thing
        :content="props.content"
        :content-class="props.contentClass"
        :content-indented="props.contentIndented"
        :content-style="props.contentStyle"
        :description="props.description"
        :theme-overrides="props.themeOverrides"
        :title="props.title"
        :title-extra="props.titleExtra"
        v-bind="attrs">
        <template v-if="slots.default" #default>
            <slot name="default" />
        </template>
        <template v-if="slots.avatar" #avatar>
            <slot name="avatar" />
        </template>
        <template v-if="slots.header" #header>
            <slot name="header" />
        </template>
        <template v-if="slots['header-extra']" #header-extra>
            <slot name="header-extra" />
        </template>
        <template v-if="slots.description" #description>
            <slot name="description" />
        </template>
        <template v-if="slots.footer" #footer>
            <slot name="footer" />
        </template>
        <template v-if="slots.action" #action>
            <slot name="action" />
        </template>
    </n-thing>
</template>
