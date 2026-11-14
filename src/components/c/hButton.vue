<script lang="ts" setup>
import HTooltip from "@/components/c/hTooltip.vue";
import { type ButtonProps, NButton, useThemeVars } from "naive-ui";
import { computed, type PropType, useAttrs } from "vue";

const themeVars = useThemeVars();
const attrs = useAttrs();

const emit = defineEmits<{
    (e: "click", event: Event): void;
}>();

const props = defineProps({
    type: {
        type: String as PropType<ButtonProps["type"]>,
        default: "default",
    },
    size: {
        type: String as PropType<ButtonProps["size"]>,
        default: "medium",
    },
    ghost: {
        type: Boolean as PropType<ButtonProps["ghost"]>,
        default: false,
    },
    round: {
        type: Boolean as PropType<ButtonProps["round"]>,
        default: false,
    },
    circle: {
        type: Boolean as PropType<ButtonProps["circle"]>,
        default: false,
    },
    loading: {
        type: Boolean as PropType<ButtonProps["loading"]>,
        default: false,
    },
    disabled: {
        type: Boolean as PropType<ButtonProps["disabled"]>,
        default: false,
    },
    secondary: {
        type: Boolean as PropType<ButtonProps["secondary"]>,
        default: false,
    },
    tertiary: {
        type: Boolean as PropType<ButtonProps["tertiary"]>,
        default: false,
    },
    quaternary: {
        type: Boolean as PropType<ButtonProps["quaternary"]>,
        default: false,
    },
    strong: {
        type: Boolean as PropType<ButtonProps["strong"]>,
        default: false,
    },
    bordered: {
        type: Boolean as PropType<ButtonProps["bordered"]>,
        default: true,
    },
    dashed: {
        type: Boolean as PropType<ButtonProps["dashed"]>,
        default: false,
    },
    text: {
        type: Boolean as PropType<ButtonProps["text"]>,
        default: false,
    },
    tag: {
        type: String as PropType<ButtonProps["tag"]>,
        default: "button",
    },
    themeOverrides: {
        type: Object as PropType<ButtonProps["themeOverrides"]>,
    },
    // Custom properties
    accent: {
        type: Boolean,
        default: false,
    },
    // Bouton en verre Liquid Glass, en pilule (Buroh) : couleurs de glass.scss, qui suivent le
    // thème et les réglages d'accessibilité du système
    glass: {
        type: Boolean,
        default: false,
    },
    tooltip: {
        type: String,
        default: "",
    },
    tooltipPosition: {
        type: String as PropType<import("vueuc/lib/binder/src/interface").Placement>,
        default: "top",
    },
    href: {
        type: String,
        default: undefined,
    },
    target: {
        type: String,
        default: undefined,
    },
});

const themeOverridesAccent = computed<ButtonProps["themeOverrides"]>(() => {
    return {
        common: {
            primaryColor: themeVars.value.accentColor,
        },
    };
});

// Variables CSS de glass.scss passées telles quelles à Naive UI (types « default » et « primary »,
// et variante transparente « quaternary »)
const GLASS_FILL = "var(--glass-control)";
const GLASS_FILL_HOVER = "var(--glass-control-hover)";
const GLASS_TEXT = "var(--glass-text)";
const GLASS_BLUE = "rgb(10 132 255)";
const GLASS_BLUE_HOVER = "rgb(64 156 255)";

const themeOverridesGlass: ButtonProps["themeOverrides"] = {
    heightSmall: "2rem",
    heightMedium: "2.25rem",
    paddingMedium: "0 1rem",
    fontWeight: "500",

    color: GLASS_FILL,
    colorHover: GLASS_FILL_HOVER,
    colorPressed: GLASS_FILL_HOVER,
    colorFocus: GLASS_FILL_HOVER,
    textColor: GLASS_TEXT,
    textColorHover: GLASS_TEXT,
    textColorPressed: GLASS_TEXT,
    textColorFocus: GLASS_TEXT,
    rippleColor: GLASS_TEXT,
    colorQuaternaryHover: GLASS_FILL_HOVER,
    colorQuaternaryPressed: GLASS_FILL_HOVER,

    colorPrimary: GLASS_BLUE,
    colorHoverPrimary: GLASS_BLUE_HOVER,
    colorPressedPrimary: GLASS_BLUE,
    colorFocusPrimary: GLASS_BLUE_HOVER,
    rippleColorPrimary: GLASS_BLUE,
};

const buttonThemeOverrides = computed(() => {
    return {
        ...(props.accent && themeOverridesAccent.value),
        ...(props.glass && themeOverridesGlass),
    };
});

const buttonProps = computed(() => {
    return {
        bordered: props.bordered && !props.glass,
        circle: props.circle,
        dashed: props.dashed,
        disabled: props.disabled,
        ghost: props.ghost,
        loading: props.loading,
        quaternary: props.quaternary,
        round: props.round || props.glass,
        secondary: props.secondary,
        size: props.size,
        strong: props.strong,
        tag: props.href ? "a" : props.tag, // Utilise tag "a" si href est fourni
        tertiary: props.tertiary,
        text: props.text,
        themeOverrides: buttonThemeOverrides.value,
        type: props.type,
        href: props.disabled ? undefined : props.href,
        target: props.target,
        // Verre : pas de focus forcé au clic (Naive le force sous Safari), sinon le contour
        // clavier de glass.scss resterait affiché après un clic à la souris
        ...(props.glass && { nativeFocusBehavior: true }),
        ...attrs,
    };
});

const handleClick = (event: Event) => {
    if (!props.href) {
        emit("click", event);
    }
};
</script>

<template>
    <h-tooltip v-if="tooltip" :placement="tooltipPosition">
        <template #trigger>
            <n-button :class="{ 'h-button--glass': glass }" v-bind="buttonProps" @click="handleClick">
                <template #default>
                    <slot name="default" />
                </template>
                <template #icon>
                    <slot name="icon" />
                </template>
            </n-button>
        </template>
        {{ tooltip }}
    </h-tooltip>
    <n-button
        v-else
        :class="{ 'h-button--glass': glass }"
        v-bind="buttonProps"
        @click="handleClick">
        <template #default>
            <slot name="default" />
        </template>
        <template #icon>
            <slot name="icon" />
        </template>
    </n-button>
</template>
