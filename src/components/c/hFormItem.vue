<script setup lang="ts">
import { NFormItem, type FormItemProps, type FormItemInst } from "naive-ui";
import { useTemplateRef } from "vue";

defineOptions({ inheritAttrs: false });

defineProps</* @vue-ignore */ FormItemProps>();

const formItemRef = useTemplateRef<FormItemInst>("formItemRef");

function validate(...args: Parameters<FormItemInst["validate"]>) {
  return formItemRef.value?.validate(...args);
}

function restoreValidation() {
  formItemRef.value?.restoreValidation();
}

defineExpose({ validate, restoreValidation });
</script>

<template>
  <n-form-item ref="formItemRef" v-bind="$attrs">
    <template v-for="(_, name) in $slots" #[name]="slotProps">
      <slot :name="name" v-bind="slotProps ?? {}" />
    </template>
  </n-form-item>
</template>
