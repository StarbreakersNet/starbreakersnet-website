<script lang="ts" setup>
import type { HFormInst } from "@/types/components/c/hForm";
import _ from "lodash";
import type { FormItemRule, FormRules, FormValidationError } from "naive-ui";
import { onMounted, provide, ref, useTemplateRef, watch } from "vue";

const model = defineModel<object>("model", { required: true });

const props = defineProps({
  rules: {
    type: Object as () => FormRules,
    default: () => ({}),
  },
});

const emit = defineEmits(["submit", "validate"]);

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

function computeIsValidSilently() {
  const rules: FormRules = props.rules || {};
  const values = (model.value || {}) as Record<string, unknown>;

  for (const [path, ruleDef] of Object.entries(rules)) {
    const ruleList = Array.isArray(ruleDef) ? ruleDef : [ruleDef as FormItemRule];

    for (const rule of ruleList) {
      if (!rule) continue;

      if (rule.required === true) {
        const value = values[path];
        if (isEmpty(value)) return false;
      }

      if (rule.validator) {
        const value = values[path];
        try {
          const result = rule.validator(rule, value, () => {}, values, {});

          if (result instanceof Error) return false;
        } catch {
          return false;
        }
      }
    }
  }

  return true;
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
  () => props.rules,
  () => recomputeSilentValidity(),
  { deep: true }
);

// Provide de la référence du formulaire pour les enfants
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
    @validate="handleValidate"
    @submit.prevent="emit('submit', $event)">
    <slot />
  </n-form>
</template>
