<script setup lang="ts">
import { NInput, type InputProps, type InputSlots, type InputInst } from "naive-ui";
import { useTemplateRef } from "vue";

defineOptions({ inheritAttrs: false });

defineProps</* @vue-ignore */ InputProps>();

defineSlots<InputSlots>();

const inputRef = useTemplateRef<InputInst>("inputRef");

function blur() {
  inputRef.value?.blur();
}

function clear() {
  inputRef.value?.clear();
}

function focus() {
  inputRef.value?.focus();
}

function scrollTo(options: ScrollToOptions) {
  inputRef.value?.scrollTo(options);
}

function select() {
  inputRef.value?.select();
}

defineExpose({ blur, clear, focus, scrollTo, select });
</script>

<template>
  <n-input ref="inputRef" v-bind="$attrs">
    <template v-for="(_, name) in $slots" #[name]="slotProps">
      <slot :name="name as keyof InputSlots" v-bind="slotProps ?? {}" />
    </template>
  </n-input>
</template>

<style scoped>
:deep(.n-input) {
  width: 100%;
}
</style>
