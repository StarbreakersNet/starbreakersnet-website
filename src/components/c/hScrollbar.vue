<script setup lang="ts">
import { NScrollbar, type ScrollbarInst, type ScrollbarProps } from "naive-ui";
import { computed, useTemplateRef } from "vue";

interface Props extends /* @vue-ignore */ ScrollbarProps {
  containerClass?: string;
  yScrollable?: boolean;
}

defineOptions({ inheritAttrs: false });

const { containerClass, yScrollable = true } = defineProps<Props>();

const scrollbarRef = useTemplateRef<ScrollbarInst>("scrollbarRef");

const mergedContainerClass = computed(() => [containerClass, "h-fade"].filter(Boolean).join(" "));

// Délégation à NScrollbar en conservant les surcharges de scrollTo / scrollBy
const scrollTo = ((...args: unknown[]) =>
  scrollbarRef.value &&
  Reflect.apply(
    scrollbarRef.value.scrollTo,
    scrollbarRef.value,
    args
  )) as ScrollbarInst["scrollTo"];
const scrollBy = ((...args: unknown[]) =>
  scrollbarRef.value &&
  Reflect.apply(
    scrollbarRef.value.scrollBy,
    scrollbarRef.value,
    args
  )) as ScrollbarInst["scrollBy"];

defineExpose({ scrollTo, scrollBy });
</script>

<template>
  <n-scrollbar
    ref="scrollbarRef"
    :container-class="mergedContainerClass"
    :y-scrollable="yScrollable"
    class="h-scrollbar"
    v-bind="$attrs">
    <template v-for="(_, name) in $slots" #[name]="slotProps">
      <slot :name="name" v-bind="slotProps ?? {}" />
    </template>
  </n-scrollbar>
</template>

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
        linear-gradient(
          to bottom,
          var(--n-color, white),
          transparent var(--h-scrollbar-top-fade-size)
        ),
        linear-gradient(
          to top,
          var(--n-color, white),
          transparent var(--h-scrollbar-bottom-fade-size)
        );
      pointer-events: none;
      z-index: 1;
    }
  }
}
</style>
