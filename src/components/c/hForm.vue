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

<script lang="ts" setup>
import type { HFormInst } from "@/types/components/c/hForm.ts";
import _ from "lodash";
import type { FormRules, FormValidationError } from "naive-ui";
import { onMounted, provide, ref, useTemplateRef, watch } from "vue";

const props = defineProps({
    model: {
        type: Object,
        required: true,
    },
    rules: {
        type: Object as () => FormRules,
        default: () => ({}),
    },
});

const emit = defineEmits(["submit", "validate"]);

const naiveFormRef = useTemplateRef<HFormInst>("naiveFormRef");

const isValid = ref(false);
const initialValues = ref<Record<string, any>>({});
const hasChanges = ref(false);

function reset() {
    Object.assign(props.model, initialValues.value);
    naiveFormRef.value?.restoreValidation();
    recomputeSilentValidity();
}

function isEmpty(value: any) {
    return (
        value == null ||
        (typeof value === "string" && value.trim() === "") ||
        (Array.isArray(value) && value.length === 0)
    );
}

function computeIsValidSilently() {
    const rules: FormRules = props.rules || {};
    const model = props.model || ({} as Record<string, any>);

    for (const [path, ruleDef] of Object.entries(rules)) {
        const ruleList = Array.isArray(ruleDef) ? ruleDef : [ruleDef as any];

        for (const rule of ruleList) {
            if (!rule) continue;

            if (rule.required === true) {
                const value = (model as any)[path as any];
                if (isEmpty(value)) return false;
            }

            if (rule.validator) {
                const value = (model as any)[path as any];
                try {
                    const result = rule.validator(rule, value, () => {});

                    if (result instanceof Error) return false;
                } catch (error) {
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
    initialValues.value = { ...props.model };
    recomputeSilentValidity();
});

watch(
    () => props.model,
    () => {
        recomputeSilentValidity();
        hasChanges.value = !_.isEqual(props.model, initialValues.value);
    },
    { deep: true },
);
watch(
    () => props.rules,
    () => recomputeSilentValidity(),
    { deep: true },
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
