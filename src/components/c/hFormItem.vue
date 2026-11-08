<template>
  <n-form-item
    ref="formItemRef"
    :content-class="props.contentClass"
    :content-style="props.contentStyle"
    :feedback="props.feedback"
    :feedback-class="props.feedbackClass"
    :feedback-style="props.feedbackStyle"
    :first="props.first"
    :ignore-path-change="props.ignorePathChange"
    :label="props.label"
    :label-align="props.labelAlign"
    :label-placement="props.labelPlacement"
    :label-props="props.labelProps"
    :label-style="props.labelStyle"
    :label-width="props.labelWidth"
    :path="props.path"
    :require-mark-placement="props.requireMarkPlacement"
    :required="props.required"
    :rule="props.rule"
    :rule-path="props.rulePath"
    :show-feedback="props.showFeedback"
    :show-label="props.showLabel"
    :show-require-mark="props.showRequireMark"
    :size="props.size"
    :validation-status="props.validationStatus"
    v-bind="$attrs">
    <slot />
  </n-form-item>
</template>

<script lang="ts" setup>
import type { FormItemInst, FormItemRule } from "naive-ui";
import { type PropType, ref } from "vue";

const formItemRef = ref<FormItemInst>();

const props = defineProps({
  contentClass: {
    type: String,
    default: undefined,
  },
  contentStyle: {
    type: [String, Object] as PropType<string | object>,
    default: undefined,
  },
  feedback: {
    type: String,
    default: undefined,
  },
  feedbackClass: {
    type: String,
    default: undefined,
  },
  feedbackStyle: {
    type: [String, Object] as PropType<string | object>,
    default: undefined,
  },
  first: {
    type: Boolean,
    default: undefined,
  },
  ignorePathChange: {
    type: Boolean,
    default: undefined,
  },
  label: {
    type: String,
    default: undefined,
  },
  labelAlign: {
    type: String as PropType<"left" | "right">,
    default: undefined,
  },
  labelPlacement: {
    type: String as PropType<"left" | "top">,
    default: undefined,
  },
  labelProps: {
    type: Object,
    default: undefined,
  },
  labelStyle: {
    type: [String, Object] as PropType<string | object>,
    default: undefined,
  },
  labelWidth: {
    type: [Number, String] as PropType<number | string | "auto">,
    default: undefined,
  },
  path: {
    type: String,
    default: undefined,
  },
  required: {
    type: Boolean,
    default: undefined,
  },
  rule: {
    type: [Object, Array] as PropType<FormItemRule | FormItemRule[]>,
    default: undefined,
  },
  rulePath: {
    type: String,
    default: undefined,
  },
  showFeedback: {
    type: Boolean,
    default: undefined,
  },
  showLabel: {
    type: Boolean,
    default: undefined,
  },
  showRequireMark: {
    type: Boolean,
    default: undefined,
  },
  requireMarkPlacement: {
    type: String as PropType<"left" | "right" | "right-hanging">,
    default: undefined,
  },
  size: {
    type: String as PropType<"small" | "medium" | "large">,
    default: undefined,
  },
  validationStatus: {
    type: String as PropType<"error" | "success" | "warning">,
    default: undefined,
  },
});

defineExpose({
  validate: (...args: any[]) => formItemRef.value?.validate(...args),
  restoreValidation: () => formItemRef.value?.restoreValidation(),
});
</script>
