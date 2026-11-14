<script lang="ts" setup>
import { reactive, ref, useTemplateRef } from "vue";
import type { HFormInst } from "@/types/components/c/hForm.ts";
import HForm from "@/components/c/hForm.vue";
import HFormItem from "@/components/c/hFormItem.vue";
import HInput from "@/components/c/hInput.vue";
import HFlex from "@/components/c/hFlex.vue";
import HButton from "@/components/c/hButton.vue";
import HText from "@/components/c/hText.vue";
import { useAuthStore } from "@/stores/auth";
import { emailRule } from "@/utils/validation";

const props = defineProps({
  email: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["sent"]);

const auth = useAuthStore();

const formRef = useTemplateRef<HFormInst>("formRef");
const loading = ref(false);
const form = reactive({
  email: props.email,
});
const rules = {
  email: emailRule,
};

async function handleSubmit() {
  loading.value = true;
  const response = await auth.requestPasswordReset(form.email);
  loading.value = false;

  if (response) {
    emit("sent");
  }
}
</script>

<template>
  <h-form ref="formRef" :model="form" :rules="rules" @submit.prevent="handleSubmit()">
    <h-flex vertical>
      <h-text>
        Saisissez l'adresse email de votre compte : vous recevrez un lien pour choisir un nouveau
        mot de passe.
      </h-text>
      <h-form-item label="Email" path="email">
        <h-input
          placeholder=""
          v-model:value="form.email"
          :input-props="{ type: 'email', autocomplete: 'email', name: 'email' }" />
      </h-form-item>
      <h-button :disabled="!formRef?.isValid" :loading="loading" attr-type="submit">
        Envoyer le lien
      </h-button>
    </h-flex>
  </h-form>
</template>
