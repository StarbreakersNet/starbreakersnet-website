<template>
    <n-modal
        ref="modal"
        :auto-focus="props.autoFocus"
        :block-scroll="props.blockScroll"
        :closable="props.closable"
        :close-on-esc="props.closeOnEsc"
        :content-class="props.contentClass"
        :content-style="props.contentStyle"
        :display-directive="props.displayDirective"
        :mask-closable="props.maskClosable"
        :preset="props.preset"
        :show="props.show"
        :title="props.title"
        :to="props.to"
        :transform-origin="props.transformOrigin"
        :trap-focus="props.trapFocus"
        :z-index="props.zIndex"
        v-bind="$attrs"
        @close="$emit('close')"
        @esc="$emit('esc')"
        @after-enter="$emit('after-enter')"
        @after-leave="$emit('after-leave')"
        @mask-click="$emit('mask-click')"
        @positive-click="$emit('positive-click')"
        @negative-click="$emit('negative-click')"
        @update:show="$emit('update:show', $event)">
        <template v-if="slots.header" #header>
            <slot name="header" />
        </template>
        <template v-if="slots.action" #action>
            <slot name="action" />
        </template>
        <template v-if="slots.default" #default>
            <slot name="default" />
        </template>
        <template v-if="slots.footer" #footer>
            <slot name="footer" />
        </template>
    </n-modal>
</template>

<script lang="ts" setup>
import { NModal } from "naive-ui";
import { type CSSProperties, type PropType, useSlots } from "vue";

const slots = useSlots();

const props = defineProps({
    autoFocus: {
        type: Boolean,
        default: true,
    },
    blockScroll: {
        type: Boolean,
        default: true,
    },
    closeOnEsc: {
        type: Boolean,
        default: true,
    },
    closable: {
        type: Boolean,
        default: true,
    },
    contentClass: {
        type: String,
        default: undefined,
    },
    contentStyle: {
        type: [Object, String] as PropType<CSSProperties | string>,
        default: undefined,
    },
    displayDirective: {
        type: String as PropType<"if" | "show">,
        default: "if",
    },
    maskClosable: {
        type: Boolean,
        default: true,
    },
    preset: {
        type: String as PropType<"card" | "dialog" | "confirm">,
        default: null,
    },
    show: {
        type: Boolean,
        default: false,
    },
    title: {
        type: String as PropType<string | (() => import("vue").VNodeChild)>,
        default: undefined,
    },
    to: {
        type: [String, Object] as PropType<string | HTMLElement>,
        default: "body",
    },
    transformOrigin: {
        type: String as PropType<"center" | "mouse">,
        default: "mouse",
    },
    trapFocus: {
        type: Boolean,
        default: true,
    },
    zIndex: {
        type: Number,
        default: undefined,
    },
});

defineEmits([
    "update:show",
    "close",
    "after-enter",
    "after-leave",
    "esc",
    "mask-click",
    "positive-click",
    "negative-click",
]);
</script>
