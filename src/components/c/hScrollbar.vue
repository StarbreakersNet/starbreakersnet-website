<template>
    <n-scrollbar
        ref="scrollbar"
        :container-class="computedContainerClass"
        :container-style="props.containerStyle"
        :content-class="props.contentClass"
        :content-style="props.contentStyle"
        :size="props.size"
        :theme="props.theme"
        :theme-overrides="props.themeOverrides"
        :trigger="props.trigger"
        :x-placement="props.xPlacement"
        :x-scrollable="props.xScrollable"
        :y-placement="props.yPlacement"
        :y-scrollable="props.yScrollable"
        class="h-scrollbar"
        v-bind="$attrs"
        @scroll="$emit('scroll', $event)">
        <slot></slot>
    </n-scrollbar>
</template>

<script lang="ts" setup>
import { NScrollbar } from "naive-ui";
import { computed, type PropType, ref, useSlots } from "vue";

const slots = useSlots();
const scrollbar = ref(null);

const props = defineProps({
    trigger: {
        type: String as PropType<"none" | "hover">,
        default: undefined,
    },
    xScrollable: {
        type: Boolean,
        default: false,
    },
    yScrollable: {
        type: Boolean,
        default: true,
    },
    containerClass: {
        type: String,
        default: undefined,
    },
    containerStyle: {
        type: [String, Object] as PropType<string | Record<string, any>>,
        default: undefined,
    },
    contentClass: {
        type: String,
        default: undefined,
    },
    contentStyle: {
        type: [String, Object] as PropType<string | Record<string, any>>,
        default: undefined,
    },
    size: {
        type: Number,
        default: undefined,
    },
    yPlacement: {
        type: String as PropType<"left" | "right">,
        default: "right",
    },
    xPlacement: {
        type: String as PropType<"top" | "bottom">,
        default: "bottom",
    },
    theme: {
        type: Object,
        default: undefined,
    },
    themeOverrides: {
        type: Object,
        default: undefined,
    },
});

defineEmits(["scroll"]);

defineExpose({
    scrollTo: (...args: any[]) => scrollbar.value?.scrollTo(...args),
    scrollBy: (...args: any[]) => scrollbar.value?.scrollBy(...args),
});

const computedContainerClass = computed(() => {
    const additionalClasses = [props.containerClass, "h-fade"];

    return additionalClasses.filter(Boolean).join(" ");
});
</script>

<style lang="scss">
$shadow-height: 2rem;

@property --h-scrollbar-top-fade-size {
    syntax: "<length>";
    inherits: true;
    initial-value: 0;
}

@property --h-scrollbar-bottom-fade-size {
    syntax: "<length>";
    inherits: true;
    initial-value: 0;
}

@keyframes h-scrollbar-fade {
    0% {
        --h-scrollbar-top-fade-size: 0;
    }
    10%,
    100% {
        --h-scrollbar-top-fade-size: #{$shadow-height};
    }
    0%,
    90% {
        --h-scrollbar-bottom-fade-size: #{$shadow-height};
    }
    100% {
        --h-scrollbar-bottom-fade-size: 0;
    }
}

.h-scrollbar {
    > .n-scrollbar-container {
        overflow-y: scroll;
        animation: h-scrollbar-fade;
        animation-timeline: --h-scrollbar-fade;
        scroll-timeline: --h-scrollbar-fade y;

        &::after {
            content: "";
            position: absolute;
            inset: 0;
            background:
                linear-gradient(to bottom, var(--n-color, white), transparent var(--h-scrollbar-top-fade-size)),
                linear-gradient(to top, var(--n-color, white), transparent var(--h-scrollbar-bottom-fade-size));
            pointer-events: none;
            z-index: 1;
        }
    }
}
</style>
