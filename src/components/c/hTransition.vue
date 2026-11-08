<template>
    <transition
        v-bind="$attrs"
        @enter="enter"
        @leave="leave"
        @before-enter="beforeEnter"
        @after-enter="afterEnter"
        @before-leave="beforeLeave"
        @after-leave="afterLeave">
        <slot></slot>
    </transition>
</template>

<script lang="ts" setup>
import { computed, nextTick, type PropType } from "vue";

type ModeType = "width" | "height";

const props = defineProps({
    mode: {
        type: String as PropType<ModeType>,
        default: "height",
    },
    raw: {
        type: Boolean,
        default: false,
    }
});

const elementSizes = new Map();
const maxDimension = computed(() => `max-${props.mode}`);
let transitionId = 0;

function generateTransitionId() {
    return `transition-${++transitionId}-${Date.now()}`;
}

function getElementId(el: any) {
    if (!el.dataset.transitionId) {
        el.dataset.transitionId = generateTransitionId();
    }
    return el.dataset.transitionId;
}

async function beforeEnter(el: any) {
    if (props.mode != null && !props.raw) {
        await nextTick();
        const naturalSize = el[`scroll${props.mode.charAt(0).toUpperCase() + props.mode.slice(1)}`];

        el.style[maxDimension.value] = "none";
        el.style.visibility = "hidden";

        elementSizes.set(getElementId(el), naturalSize);

        el.style[maxDimension.value] = "0";
        el.style.visibility = "visible";
    }
}

async function enter(el: any) {
    if (props.mode != null && !props.raw) {
        await nextTick();
        const naturalSize = elementSizes.get(getElementId(el));

        if (naturalSize) {
            void el.offsetHeight; // Forcer un reflow

            el.style[maxDimension.value] = naturalSize + "px";
            el.style.overflow = "hidden";
        } else {
            // Sert uniquement pour du debug
            // console.warn("[hTransition] enter - Taille non trouvée pour ID:", getElementId(el));
        }
    }
}

async function afterEnter(el: any) {
    if (props.mode != null && !props.raw) {
        await nextTick();

        el.style[maxDimension.value] = "";
        el.style.overflow = "";

        elementSizes.delete(getElementId(el));

        delete el.dataset.transitionId;
    }
}

async function beforeLeave(el: any) {
    if (props.mode != null && !props.raw) {
        await nextTick();
        const naturalSize = el[`scroll${props.mode.charAt(0).toUpperCase() + props.mode.slice(1)}`];

        elementSizes.set(getElementId(el), naturalSize);

        el.style[maxDimension.value] = naturalSize + "px";
        el.style.overflow = "hidden";
    }
}

async function leave(el: any) {
    if (props.mode != null && !props.raw) {
        await nextTick();

        void el.offsetHeight; // Forcer un reflow

        el.style[maxDimension.value] = "0";
    }
}

async function afterLeave(el: any) {
    if (props.mode != null && !props.raw) {
        await nextTick();

        el.style[maxDimension.value] = "";
        el.style.overflow = "";

        elementSizes.delete(getElementId(el));

        delete el.dataset.transitionId;
    }
}
</script>
