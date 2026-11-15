<script setup lang="ts">
import { NTooltip, type TooltipInst, type TooltipProps, type TooltipSlots } from "naive-ui";
import { computed, useTemplateRef } from "vue";

interface Props extends /* @vue-ignore */ TooltipProps {
  contentClass?: string;
  delay?: TooltipProps["delay"];
  keepAliveOnHover?: boolean;
  showArrow?: boolean;
  to?: TooltipProps["to"];
}

defineOptions({ inheritAttrs: false });

const {
  contentClass,
  delay = 250,
  keepAliveOnHover = false,
  showArrow = false,
  to = "body",
} = defineProps<Props>();

defineSlots<TooltipSlots>();

const tooltipRef = useTemplateRef<TooltipInst>("tooltipRef");

const mergedContentClass = computed(() =>
  [!keepAliveOnHover && "h-tooltip-prevent-pointer-events", contentClass].filter(Boolean).join(" ")
);

function setShow(show: boolean) {
  tooltipRef.value?.setShow(show);
}

function syncPosition() {
  tooltipRef.value?.syncPosition();
}

defineExpose({ setShow, syncPosition });
</script>

<template>
  <n-tooltip
    ref="tooltipRef"
    :content-class="mergedContentClass"
    :delay="delay"
    :keep-alive-on-hover="keepAliveOnHover"
    :show-arrow="showArrow"
    :to="to"
    v-bind="$attrs">
    <template v-for="(_, name) in $slots" #[name]="slotProps">
      <slot :name="name as keyof TooltipSlots" v-bind="slotProps ?? {}" />
    </template>
  </n-tooltip>
</template>

<style lang="scss">
.n-popover:has(.h-tooltip-prevent-pointer-events) {
  pointer-events: none;
}
</style>
