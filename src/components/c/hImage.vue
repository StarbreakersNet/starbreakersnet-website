<template>
    <n-image
        :alt="props.alt"
        :fallback-src="props.fallbackSrc"
        :height="props.height"
        :img-props="props.imgProps"
        :intersection-observer-options="props.intersectionObserverOptions"
        :lazy="props.lazy"
        :load-description="props.loadDescription"
        :object-fit="props.objectFit"
        :preview-disabled="props.previewDisabled"
        :preview-src="props.previewSrc"
        :previewed-img-props="props.previewedImgProps"
        :render-toolbar="props.renderToolbar"
        :show-toolbar="props.showToolbar"
        :show-toolbar-tooltip="props.showToolbarTooltip"
        :src="props.src"
        :width="props.width"
        v-bind="$attrs"
        @error="$emit('error', $event)"
        @load="$emit('load', $event)"
        @preview-prev="$emit('preview-prev')"
        @preview-next="$emit('preview-next')">
        <template v-if="slots.placeholder" #placeholder>
            <slot name="placeholder" />
        </template>
        <template #error>
            <slot name="error">
                <font-awesome-icon :icon="['fas', 'image']" />
            </slot>
        </template>
    </n-image>
</template>

<script lang="ts" setup>
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { NImage } from "naive-ui";
import type { ImageRenderToolbarProps } from "naive-ui/es/image/src/public-types";
import type { IntersectionObserverOptions } from "naive-ui/es/image/src/utils";
import { type ImgHTMLAttributes, type PropType, useSlots, type VNodeChild } from "vue";

const slots = useSlots();

const props = defineProps({
    alt: {
        type: String,
        default: undefined,
    },
    fallbackSrc: {
        type: String,
        default: undefined,
    },
    height: {
        type: [String, Number],
        default: undefined,
    },
    imgProps: {
        type: Object as PropType<ImgHTMLAttributes>,
        default: undefined,
    },
    intersectionObserverOptions: {
        type: Object as PropType<IntersectionObserverOptions>,
        default: undefined,
    },
    lazy: {
        type: Boolean,
        default: false,
    },
    loadDescription: {
        type: String,
        default: undefined,
    },
    objectFit: {
        type: String as PropType<"fill" | "contain" | "cover" | "none" | "scale-down">,
        default: "cover",
    },
    previewDisabled: {
        type: Boolean,
        default: false,
    },
    previewSrc: {
        type: String,
        default: undefined,
    },
    previewedImgProps: {
        type: Object as PropType<ImgHTMLAttributes>,
        default: undefined,
    },
    renderToolbar: {
        type: Function as PropType<(props: ImageRenderToolbarProps) => VNodeChild>,
        default: undefined,
    },
    showToolbar: {
        type: Boolean,
        default: true,
    },
    showToolbarTooltip: {
        type: Boolean,
        default: false,
    },
    src: {
        type: String,
        default: undefined,
    },
    width: {
        type: [String, Number],
        default: undefined,
    },
});

defineEmits(["error", "load", "preview-prev", "preview-next"]);
</script>

<style lang="scss" scoped></style>
