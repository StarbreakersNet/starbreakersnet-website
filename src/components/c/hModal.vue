<script setup lang="ts">
import { NModal, type ModalProps, type ModalSlots } from "naive-ui";

interface Props extends /* @vue-ignore */ ModalProps {
  to?: ModalProps["to"];
}

defineOptions({ inheritAttrs: false });

const { to = "body" } = defineProps<Props>();

defineSlots<ModalSlots>();
</script>

<template>
  <n-modal :to="to" v-bind="$attrs">
    <template v-for="(_, name) in $slots" #[name]="slotProps">
      <slot :name="name as keyof ModalSlots" v-bind="slotProps ?? {}" />
    </template>
  </n-modal>
</template>
