<script lang="ts" setup>
import HFlex from "@/components/c/hFlex.vue";
import HThing from "@/components/c/hThing.vue";
import HTransition from "@/components/c/hTransition.vue";
import { useThemeVars } from "naive-ui";
import { computed, onBeforeUnmount, ref, useSlots, useTemplateRef, watch } from "vue";

const {
  text = true,
  round = false,
  circle = false,
  height,
  width,
  size,
  repeat = 1,
  sharp = false,
  show = true,
  loading = true,
  autoWidth = false,
  blockCount = 1,
  background = false,
  avatar = false,
  title = false,
  titleExtra = false,
  description = false,
  footer = false,
  action = false,
  type = "default",
  inline = false,
  skeletonClass,
  columns,
} = defineProps<Props>();
const DEFAULT_WIDTH = "2em";
const MIN_DISPLAY_TIME = 300; // Temps minimal avant d'afficher le skeleton
const MIN_HIDE_TIME = 500; // Temps minimal avant de masquer le skeleton

const slots = useSlots();
const themeVars = useThemeVars();

const skeletonRef = useTemplateRef<HTMLElement>("skeletonRef");
const defaultSlotWidth = ref(DEFAULT_WIDTH);
const shouldShowSkeleton = ref(false);
let showTimeoutId: number | null = null;
let hideTimeoutId: number | null = null;
let skeletonShowTime: number | null = null;

const computedWidth = computed(() => width ?? defaultSlotWidth.value);

watch(
  () => show,
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
        if (show) {
          shouldShowSkeleton.value = true;
          skeletonShowTime = Date.now();

          if (slots.default) {
            defaultSlotWidth.value = `${skeletonRef.value?.getBoundingClientRect().width}px`;
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
  { immediate: true }
);

onBeforeUnmount(() => {
  if (showTimeoutId) {
    clearTimeout(showTimeoutId);
  }
  if (hideTimeoutId) {
    clearTimeout(hideTimeoutId);
  }
});
interface Props {
  text?: boolean;
  round?: boolean;
  circle?: boolean;
  height?: string | number;
  width?: string | number;
  size?: "small" | "medium" | "large";
  repeat?: string | number;
  sharp?: boolean;
  show?: boolean;
  loading?: boolean;
  autoWidth?: boolean;
  blockCount?: string | number;
  background?: boolean;
  avatar?: boolean;
  title?: boolean;
  titleExtra?: boolean;
  description?: boolean;
  footer?: boolean;
  action?: boolean;
  type?: string;
  inline?: boolean;
  skeletonClass?: string;
  columns?: string | number;
}
</script>

<template>
  <div ref="skeletonRef" class="app-skeleton">
    <h-transition name="fade">
      <h-flex
        v-if="shouldShowSkeleton"
        :class="[
          skeletonClass,
          {
            'skeleton-grid': columns,
          },
        ]"
        :style="columns ? { '--skeleton-columns': columns } : undefined"
        :vertical="!inline">
        <h-thing
          v-for="block in blockCount"
          :key="block"
          :class="{
            'skeleton-background': background,
            'forced-primary': type === 'primary',
            'forced-accent': type === 'accent',
            'forced-info': type === 'info',
            'forced-success': type === 'success',
            'forced-warning': type === 'warning',
            'forced-danger': type === 'danger',
          }"
          class="skeleton-thing tw:flex-grow">
          <template v-if="avatar" #avatar>
            <n-skeleton
              :animated="loading"
              :circle="circle"
              :height="height"
              :round="round"
              :sharp="sharp"
              :size="size"
              :text="text"
              class="tw:!w-[3em] tw:!h-[3em]" />
          </template>
          <template v-if="title" #header>
            <n-skeleton
              :animated="loading"
              :circle="circle"
              :height="height"
              :round="round"
              :sharp="sharp"
              :size="size"
              :text="text" />
          </template>
          <template v-if="titleExtra" #header-extra>
            <n-skeleton
              :animated="loading"
              :circle="circle"
              :height="height"
              :round="round"
              :sharp="sharp"
              :size="size"
              :text="text" />
          </template>
          <template v-if="description" #description>
            <h-flex>
              <n-skeleton
                :animated="loading"
                :circle="circle"
                :height="height"
                :repeat="3"
                :round="round"
                :sharp="sharp"
                :size="size"
                :text="text" />
            </h-flex>
          </template>
          <template #default>
            <n-skeleton
              :animated="loading"
              :circle="circle"
              :height="height"
              :repeat="repeat"
              :round="round"
              :sharp="sharp"
              :size="size"
              :text="text"
              :width="autoWidth ? computedWidth : width" />
          </template>
          <template v-if="footer" #footer>
            <n-skeleton
              :animated="loading"
              :circle="circle"
              :height="height"
              :round="round"
              :sharp="sharp"
              :size="size"
              :text="text" />
          </template>
          <template v-if="action" #action>
            <h-flex>
              <n-skeleton
                :animated="loading"
                :circle="circle"
                :height="height"
                :repeat="3"
                :round="round"
                :sharp="sharp"
                :size="size"
                :text="text" />
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

<style lang="scss" scoped>
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

  :root[data-theme="dark"] & {
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
    --skeleton-main-color: v-bind("themeVars.primaryColor");
  }

  &.forced-accent {
    @include set-skeleton-colors();
    --skeleton-main-color: v-bind("themeVars.accentColor");
  }

  &.forced-info {
    @include set-skeleton-colors();
    --skeleton-main-color: v-bind("themeVars.infoColor");
  }

  &.forced-success {
    @include set-skeleton-colors();
    --skeleton-main-color: v-bind("themeVars.successColor");
  }

  &.forced-warning {
    @include set-skeleton-colors();
    --skeleton-main-color: v-bind("themeVars.warningColor");
  }

  &.forced-danger {
    @include set-skeleton-colors();
    --skeleton-main-color: v-bind("themeVars.errorColor");
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
