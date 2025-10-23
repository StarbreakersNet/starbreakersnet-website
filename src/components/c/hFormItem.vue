<template>
    <n-form-item
        :feedback="feedback"
        :label="label"
        :path="path"
        :rule="rule"
        :validation-status="validationStatus"
        v-bind="$attrs">
        <slot />
    </n-form-item>
</template>

<script lang="ts" setup>
import type { FormInst, FormItemRule } from "naive-ui";
import { inject, type PropType } from "vue";

const props = defineProps({
    label: String,
    path: String,
    rule: {
        type: [Object, Array] as PropType<FormItemRule | FormItemRule[]>,
    },
    validationStatus: {
        type: String as () => "error" | "warning" | "success",
    },
    feedback: String,
    required: {
        type: Boolean,
        default: false,
    },
});

// Injecter la référence du formulaire parent
const naiveFormRef = inject<FormInst>("naiveFormRef");

defineExpose({
    validate: () => {
        if (naiveFormRef && props.path) {
            return naiveFormRef.validate(undefined, rule => rule.key === props.path);
        }
    },
    restoreValidation: () => {
        if (naiveFormRef) {
            naiveFormRef.restoreValidation();
        }
    },
});
</script>
