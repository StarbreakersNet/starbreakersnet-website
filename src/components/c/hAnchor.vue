<template>
    <n-anchor
        ref="anchor"
        :affix="props.affix"
        :bound="props.bound"
        :ignore-gap="props.ignoreGap"
        :offset-target="props.offsetTarget"
        :show-background="props.showBackground"
        :show-rail="props.showRail"
        :type="props.type"
        v-bind="$attrs">
        <template v-if="slots.default">
            <slot />
        </template>
    </n-anchor>
</template>

<script lang="ts" setup>
import { type AnchorProps, NAnchor } from "naive-ui";
import { type PropType, useSlots, useTemplateRef } from "vue";

const anchor = useTemplateRef("anchor");

const slots = useSlots();

const props = defineProps({
    affix: {
        type: Boolean as PropType<AnchorProps["affix"]>,
        default: undefined,
    },
    bound: {
        type: Number as PropType<AnchorProps["bound"]>,
        default: undefined,
    },
    ignoreGap: {
        type: Boolean as PropType<AnchorProps["ignoreGap"]>,
        default: undefined,
    },
    offsetTarget: {
        type: String as PropType<AnchorProps["offsetTarget"]>,
        default: undefined,
    },
    showRail: {
        type: Boolean as PropType<AnchorProps["showRail"]>,
        default: undefined,
    },
    showBackground: {
        type: Boolean as PropType<AnchorProps["showBackground"]>,
        default: undefined,
    },
    type: {
        type: String as PropType<AnchorProps["type"]>,
        default: undefined,
    },
});

function scrollTo(href: string) {
    anchor.value?.scrollTo(href);
}

defineExpose({
    scrollTo,
});
</script>

<style scoped></style>
