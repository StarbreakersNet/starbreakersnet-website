<script setup lang="ts">
import { NPopover, type PopoverProps, type PopoverSlots, type PopoverInst } from "naive-ui";
import { useTemplateRef } from "vue";

interface Props extends /* @vue-ignore */ PopoverProps {
  showArrow?: boolean;
  trigger?: PopoverProps["trigger"];
}

defineOptions({ inheritAttrs: false });

const { showArrow = false, trigger = "click" } = defineProps<Props>();

defineSlots<PopoverSlots>();

const popoverRef = useTemplateRef<PopoverInst>("popoverRef");

function setShow(show: boolean) {
  popoverRef.value?.setShow(show);
}

function syncPosition() {
  popoverRef.value?.syncPosition();
}

defineExpose({ setShow, syncPosition });
</script>

<template>
  <n-popover ref="popoverRef" :show-arrow="showArrow" :trigger="trigger" v-bind="$attrs">
    <template v-for="(_, name) in $slots" #[name]="slotProps">
      <slot :name="name as keyof PopoverSlots" v-bind="slotProps ?? {}" />
    </template>
  </n-popover>
</template>
