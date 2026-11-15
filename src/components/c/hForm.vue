<script lang="ts" setup>
import type { HFormInst } from "@/types/components/c/hForm";
import _ from "lodash";
import type { FormItemRule, FormRules, FormValidationError } from "naive-ui";
import { onMounted, provide, ref, useTemplateRef, watch } from "vue";

defineOptions({ inheritAttrs: false });

const model = defineModel<object>("model", { required: true });

const { rules = {} } = defineProps<{
  rules?: FormRules;
}>();

const emit = defineEmits<{
  submit: [event: Event];
  validate: [errors: Array<FormValidationError> | undefined];
}>();

const naiveFormRef = useTemplateRef<HFormInst>("naiveFormRef");

const isValid = ref(false);
const initialValues = ref<Record<string, unknown>>({});
const hasChanges = ref(false);

function reset() {
  const values = model.value as Record<string, unknown>;

  for (const [key, value] of Object.entries(initialValues.value)) {
    values[key] = value;
  }
  naiveFormRef.value?.restoreValidation();
  recomputeSilentValidity();
}

function isEmpty(value: unknown) {
  return (
    value == null ||
    (typeof value === "string" && value.trim() === "") ||
    (Array.isArray(value) && value.length === 0)
  );
}

function isRuleSatisfied(rule: FormItemRule, value: unknown, values: Record<string, unknown>) {
  if (rule.required === true && isEmpty(value)) {
    return false;
  }

  if (rule.validator) {
    try {
      return !(rule.validator(rule, value, () => {}, values, {}) instanceof Error);
    } catch {
      return false;
    }
  }

  return true;
}

function computeIsValidSilently() {
  const values = (model.value || {}) as Record<string, unknown>;

  return Object.entries(rules).every(([path, ruleDef]) => {
    const ruleList = Array.isArray(ruleDef) ? ruleDef : [ruleDef as FormItemRule];

    return ruleList.every(rule => !rule || isRuleSatisfied(rule, values[path], values));
  });
}

function recomputeSilentValidity() {
  isValid.value = computeIsValidSilently();
}

function handleValidate(errors: Array<FormValidationError> | undefined) {
  emit("validate", errors);
}

onMounted(() => {
  initialValues.value = { ...model.value };
  recomputeSilentValidity();
});

watch(
  () => model.value,
  () => {
    recomputeSilentValidity();
    hasChanges.value = !_.isEqual(model.value, initialValues.value);
  },
  { deep: true }
);
watch(
  () => rules,
  () => recomputeSilentValidity(),
  { deep: true }
);

provide("naiveFormRef", naiveFormRef);

defineExpose({
  isValid,
  hasChanges,
  validate: (callback?: (errors?: Array<FormValidationError>) => void) => {
    return naiveFormRef.value?.validate(callback);
  },
  validateField: (path: string, callback?: (errors?: Array<FormValidationError>) => void) => {
    return naiveFormRef.value?.validate(callback, rule => rule.key === path);
  },
  restoreValidation: () => {
    naiveFormRef.value?.restoreValidation();
  },
  reset,
  naiveFormRef,
});
</script>

<template>
  <n-form
    ref="naiveFormRef"
    :model="model"
    :rules="rules"
    v-bind="$attrs"
    @validate="handleValidate($event)"
    @submit.prevent="emit('submit', $event)">
    <slot />
  </n-form>
</template>
