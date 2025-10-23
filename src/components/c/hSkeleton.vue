<template>
    <div ref="refSkeleton" class="app-skeleton">
        <h-transition name="fade">
            <h-flex
                v-if="shouldShowSkeleton"
                :class="[
                    props.skeletonClass,
                    {
                        'skeleton-grid': props.columns,
                    }
                ]"
                :style="props.columns ? { '--skeleton-columns': props.columns } : undefined"
                :vertical="!props.inline">
                <h-thing
                    v-for="block in blockCount"
                    :class="{
                        'skeleton-dark': isDarkTheme,
                        'skeleton-background': props.background,
                        'forced-primary': props.type === 'primary',
                        'forced-accent': props.type === 'accent',
                        'forced-info': props.type === 'info',
                        'forced-success': props.type === 'success',
                        'forced-warning': props.type === 'warning',
                        'forced-danger': props.type === 'danger',
                    }"
                    class="skeleton-thing tw:flex-grow">
                    <template v-if="props.avatar" #avatar>
                        <n-skeleton
                            :animated="props.loading"
                            :circle="props.circle"
                            :height="props.height"
                            :round="props.round"
                            :sharp="props.sharp"
                            :size="props.size"
                            :text="props.text"
                            class="tw:!w-[3em] tw:!h-[3em]" />
                    </template>
                    <template v-if="props.title" #header>
                        <n-skeleton
                            :animated="props.loading"
                            :circle="props.circle"
                            :height="props.height"
                            :round="props.round"
                            :sharp="props.sharp"
                            :size="props.size"
                            :text="props.text" />
                    </template>
                    <template v-if="props.titleExtra" #header-extra>
                        <n-skeleton
                            :animated="props.loading"
                            :circle="props.circle"
                            :height="props.height"
                            :round="props.round"
                            :sharp="props.sharp"
                            :size="props.size"
                            :text="props.text" />
                    </template>
                    <template v-if="props.description" #description>
                        <h-flex>
                            <n-skeleton
                                :animated="props.loading"
                                :circle="props.circle"
                                :height="props.height"
                                :repeat="3"
                                :round="props.round"
                                :sharp="props.sharp"
                                :size="props.size"
                                :text="props.text" />
                        </h-flex>
                    </template>
                    <template #default>
                        <n-skeleton
                            :animated="props.loading"
                            :circle="props.circle"
                            :height="props.height"
                            :repeat="props.repeat"
                            :round="props.round"
                            :sharp="props.sharp"
                            :size="props.size"
                            :text="props.text"
                            :width="props.autoWidth ? computedWidth : props.width" />
                    </template>
                    <template v-if="props.footer" #footer>
                        <n-skeleton
                            :animated="props.loading"
                            :circle="props.circle"
                            :height="props.height"
                            :round="props.round"
                            :sharp="props.sharp"
                            :size="props.size"
                            :text="props.text" />
                    </template>
                    <template v-if="props.action" #action>
                        <h-flex>
                            <n-skeleton
                                :animated="props.loading"
                                :circle="props.circle"
                                :height="props.height"
                                :repeat="3"
                                :round="props.round"
                                :sharp="props.sharp"
                                :size="props.size"
                                :text="props.text" />
                        </h-flex>
                    </template>
                </h-thing>
            </h-flex>
            <div v-else>
                <slot name="default" />
            </div>
        </h-transition>
    </div>
</template>

<script lang="ts" setup>
import HFlex from "@/components/c/hFlex.vue";
import HThing from "@/components/c/hThing.vue";
import HTransition from "@/components/c/hTransition.vue";
import { useUserStore } from "@/stores/user.ts";
import { computed, onBeforeUnmount, type PropType, ref, useSlots, watch } from "vue";

const DEFAULT_WIDTH = "2em";
const MIN_DISPLAY_TIME = 300; // Temps minimal avant d'afficher le skeleton
const MIN_HIDE_TIME = 500; // Temps minimal avant de masquer le skeleton

const user = useUserStore();

const props = defineProps({
    text: {
        type: Boolean,
        default: true,
    },
    round: {
        type: Boolean,
        default: false,
    },
    circle: {
        type: Boolean,
        default: false,
    },
    height: {
        type: [String, Number],
        default: undefined,
    },
    width: {
        type: [String, Number],
        default: undefined,
    },
    size: {
        type: String as PropType<"small" | "medium" | "large">,
        default: undefined,
    },
    repeat: {
        type: [String, Number],
        default: 1,
    },
    sharp: {
        type: Boolean,
        default: false,
    },
    show: {
        type: Boolean,
        default: true,
    },
    loading: {
        type: Boolean,
        default: true,
    },
    autoWidth: {
        type: Boolean,
        default: false,
    },
    blockCount: {
        type: [String, Number],
        default: 1,
    },
    background: {
        type: Boolean,
        default: false,
    },
    avatar: {
        type: Boolean,
        default: false,
    },
    title: {
        type: Boolean,
        default: false,
    },
    titleExtra: {
        type: Boolean,
        default: false,
    },
    description: {
        type: Boolean,
        default: false,
    },
    footer: {
        type: Boolean,
        default: false,
    },
    action: {
        type: Boolean,
        default: false,
    },
    type: {
        type: String,
        default: "default",
    },
    inline: {
        type: Boolean,
        default: false,
    },
    skeletonClass: {
        type: String,
        default: undefined,
    },
    columns: {
        type: [String, Number],
        default: undefined,
    }
});

const slots = useSlots();

const refSkeleton = ref(null);
const defaultSlotWidth = ref(DEFAULT_WIDTH);
const shouldShowSkeleton = ref(false);
let showTimeoutId: number | null = null;
let hideTimeoutId: number | null = null;
let skeletonShowTime: number | null = null;

const computedWidth = computed(() => props.width ?? defaultSlotWidth.value);
const isDarkTheme = computed(() => user.preference.theme === "dark");

watch(
    () => props.show,
    async newValue => {
        if (showTimeoutId) {
            clearTimeout(showTimeoutId);
            showTimeoutId = null;
        }
        if (hideTimeoutId) {
            clearTimeout(hideTimeoutId);
            hideTimeoutId = null;
        }

        if (newValue) {
            showTimeoutId = setTimeout(() => {
                if (props.show) {
                    shouldShowSkeleton.value = true;
                    skeletonShowTime = Date.now();

                    if (slots.default) {
                        defaultSlotWidth.value = `${refSkeleton.value?.getBoundingClientRect().width}px`;
                    }
                }
            }, MIN_DISPLAY_TIME);
        } else {
            if (shouldShowSkeleton.value && skeletonShowTime) {
                const elapsedTime = Date.now() - skeletonShowTime;
                const remainingTime = Math.max(0, MIN_HIDE_TIME - elapsedTime);

                hideTimeoutId = setTimeout(() => {
                    shouldShowSkeleton.value = false;
                    skeletonShowTime = null;
                }, remainingTime);
            } else {
                shouldShowSkeleton.value = false;
                skeletonShowTime = null;
            }
        }
    },
    { immediate: true },
);

onBeforeUnmount(() => {
    if (showTimeoutId) {
        clearTimeout(showTimeoutId);
    }
    if (hideTimeoutId) {
        clearTimeout(hideTimeoutId);
    }
});
</script>

<style lang="scss" scoped>
@use "@/assets/colors";

.app-skeleton {
    position: relative;
    width: 100%;
}

.skeleton-grid {
    display: grid !important;
    grid-template-columns: repeat(var(--skeleton-columns, 1), 1fr);
}

@mixin set-skeleton-colors() {
    --skeleton-main-color: currentColor;
    --skeleton-container-calc: calc(l + 65);
    --skeleton-background-calc: calc(l + 55);
    --skeleton-color-calc: calc(l + 45);

    --skeleton-container-background-color: hsl(
        from var(--skeleton-main-color) h s clamp(25, var(--skeleton-container-calc), 85) / 1
    );
    --skeleton-background-color: hsl(
        from var(--skeleton-main-color) h s clamp(35, var(--skeleton-background-calc), 75) / 1
    );
    --skeleton-color: hsl(
        from var(--skeleton-main-color) h s clamp(45, var(--skeleton-color-calc), 65) / 1
    );
}

.skeleton-thing {
    @include set-skeleton-colors();

    &.skeleton-dark {
        --skeleton-container-calc: calc(l - 40) !important;
        --skeleton-background-calc: calc(l - 30) !important;
        --skeleton-color-calc: calc(l - 20) !important;
    }

    &.skeleton-background {
        background: var(--skeleton-container-background-color);
        padding: 0.75rem;
        border-radius: 0.5em;
    }

    &.forced-primary {
        @include set-skeleton-colors();
        --skeleton-main-color: #{colors.$primary-light};
    }

    &.forced-accent {
        @include set-skeleton-colors();
        --skeleton-main-color: #{colors.$accent};
    }

    &.forced-info {
        @include set-skeleton-colors();
        --skeleton-main-color: #{colors.$info};
    }

    &.forced-success {
        @include set-skeleton-colors();
        --skeleton-main-color: #{colors.$success};
    }

    &.forced-warning {
        @include set-skeleton-colors();
        --skeleton-main-color: #{colors.$warning};
    }

    &.forced-danger {
        @include set-skeleton-colors();
        --skeleton-main-color: #{colors.$danger};
    }

    :deep(> .n-thing-main) {
        > .n-thing-avatar-header-wrapper {
            align-items: center;

            > .n-thing-avatar {
                margin-top: unset;
                display: flex;
                align-items: center;
            }

            > .n-thing-header-wrapper {
                > .n-thing-header {
                    margin-bottom: unset;

                    > .n-thing-header__title,
                    > .n-thing-header__extra {
                        flex-basis: calc((2 / 5) * 100%);
                    }
                }
            }
        }

        .n-skeleton {
            animation: unset;
            position: relative;
            overflow: hidden;
            --n-color-start: var(--skeleton-background-color) !important;
            --n-color-end: var(--skeleton-color) !important;

            &:after {
                content: "";
                display: block;
                width: 100%;
                height: 100%;
                background: linear-gradient(
                    to right,
                    var(--skeleton-background-color) 10%,
                    var(--skeleton-color) 50%,
                    var(--skeleton-background-color) 90%
                );
                animation: skeleton-loading 2s infinite var(--n-bezier);
                position: absolute;
                top: 0;
                left: 0;
                transform: translateX(-100%);
            }
        }
    }
}

@keyframes skeleton-loading {
    0% {
        transform: translateX(-100%);
    }
    100% {
        transform: translateX(100%);
    }
}
</style>
