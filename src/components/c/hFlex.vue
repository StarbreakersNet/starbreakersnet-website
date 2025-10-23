<script lang="ts" setup>
import { type FlexProps, NFlex, useThemeVars } from "naive-ui";
import { type PropType, useAttrs, useSlots } from "vue";

const props = defineProps({
    align: {
        type: String as PropType<FlexProps["align"]>,
        default: undefined,
    },
    justify: {
        type: String as PropType<FlexProps["justify"]>,
        default: undefined,
    },
    inline: {
        type: Boolean as PropType<FlexProps["inline"]>,
        default: undefined,
    },
    vertical: {
        type: Boolean as PropType<FlexProps["vertical"]>,
        default: undefined,
    },
    wrap: {
        type: Boolean as PropType<FlexProps["wrap"]>,
        default: false,
    },
    size: {
        type: [String, Number, Array] as PropType<FlexProps["size"]>,
        default: undefined,
    },
    themeOverrides: {
        type: Object as PropType<FlexProps["themeOverrides"]>,
    },
});
</script>

<template>
    <n-flex
        :align="props.align || (!props.vertical ? 'center' : undefined)"
        :justify="props.justify"
        :inline="props.inline"
        :vertical="props.vertical"
        :wrap="props.wrap"
        :size="props.size"
        :theme-overrides="props.themeOverrides"
        v-bind="$attrs">
        <slot />
    </n-flex>
</template>
