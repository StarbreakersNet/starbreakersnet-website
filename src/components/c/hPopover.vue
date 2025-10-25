<template>
    <n-popover
        ref="popover"
        :animated="props.animated"
        :arrow-class="props.arrowClass"
        :arrow-point-to-center="props.arrowPointToCenter"
        :arrow-style="props.arrowStyle"
        :arrow-wrapper-class="props.arrowWrapperClass"
        :arrow-wrapper-style="props.arrowWrapperStyle"
        :content-class="props.contentClass"
        :content-style="props.contentStyle"
        :delay="props.delay"
        :disabled="props.disabled"
        :display-directive="props.displayDirective"
        :duration="props.duration"
        :flip="props.flip"
        :footer-class="props.footerClass"
        :footer-style="props.footerStyle"
        :header-class="props.headerClass"
        :header-style="props.headerStyle"
        :keep-alive-on-hover="props.keepAliveOnHover"
        :overlap="props.overlap"
        :placement="props.placement"
        :raw="props.raw"
        :scrollable="props.scrollable"
        :show="props.show"
        :show-arrow="props.showArrow"
        :to="props.to"
        :trigger="props.trigger"
        :width="props.width"
        :x="props.x"
        :y="props.y"
        :z-index="props.zIndex"
        v-bind="$attrs">
        <template v-if="slots.trigger" #trigger>
            <slot name="trigger" />
        </template>
        <template v-if="slots.footer" #footer>
            <slot name="footer" />
        </template>
        <template v-if="slots.header" #header>
            <slot name="header" />
        </template>
        <template #default>
            <slot name="default" />
        </template>
    </n-popover>
</template>

<script lang="ts" setup>
import { NPopover } from "naive-ui";
import { type CSSProperties, type PropType, useSlots, useTemplateRef } from "vue";

const popover = useTemplateRef("popover");

const props = defineProps({
    animated: {
        type: Boolean,
        default: true,
    },
    arrowPointToCenter: {
        type: Boolean,
        default: false,
    },
    arrowClass: {
        type: String,
        default: undefined,
    },
    arrowStyle: {
        type: [Object, String] as PropType<CSSProperties | string>,
        default: undefined,
    },
    arrowWrapperClass: {
        type: String,
        default: undefined,
    },
    arrowWrapperStyle: {
        type: [Object, String] as PropType<CSSProperties | string>,
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
    delay: {
        type: Number,
        default: 100,
    },
    disabled: {
        type: Boolean,
        default: false,
    },
    displayDirective: {
        type: String as PropType<"if" | "show">,
        default: "if",
    },
    duration: {
        type: Number,
        default: 100,
    },
    flip: {
        type: Boolean,
        default: true,
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
    keepAliveOnHover: {
        type: Boolean,
        default: true,
    },
    overlap: {
        type: Boolean,
        default: false,
    },
    placement: {
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
    raw: {
        type: Boolean,
        default: false,
    },
    scrollable: {
        type: Boolean,
        default: false,
    },
    showArrow: {
        type: Boolean,
        default: false,
    },
    show: {
        type: Boolean,
        default: undefined,
    },
    to: {
        type: [String, Object, Boolean] as PropType<string | HTMLElement | boolean>,
        default: undefined,
    },
    trigger: {
        type: String as PropType<"hover" | "click" | "focus" | "manual">,
        default: "click",
    },
    width: {
        type: [Number, String] as PropType<number | "trigger">,
        default: undefined,
    },
    x: {
        type: Number,
        default: undefined,
    },
    y: {
        type: Number,
        default: undefined,
    },
    zIndex: {
        type: Number,
        default: undefined,
    },
});

const slots = useSlots();

function setShow(show: boolean) {
    if (popover.value) {
        popover.value.setShow(show);
    }
}

function syncPosition() {
    if (popover.value) {
        popover.value.syncPosition();
    }
}

defineExpose({
    setShow,
    syncPosition,
});
</script>

<style lang="scss" scoped></style>
