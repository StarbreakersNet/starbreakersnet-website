<script lang="ts" setup>
import { useAuthStore } from "@/stores/auth";
import { computed, reactive, useTemplateRef } from "vue";
import { useLoader } from "@/composables/useLoader";
import type { HFormInst } from "@/types/components/c/hForm";
import HForm from "@/components/c/hForm.vue";
import HFormItem from "@/components/c/hFormItem.vue";
import HInput from "@/components/c/hInput.vue";
import HFlex from "@/components/c/hFlex.vue";
import HButton from "@/components/c/hButton.vue";
import HText from "@/components/c/hText.vue";
import {
  emailRule,
  PASSWORD_HINT,
  passwordRule,
  USERNAME_MAX_LENGTH,
  usernameRule,
} from "@/utils/validation";

const emit = defineEmits<{
  registered: [];
}>();

const auth = useAuthStore();

const formRef = useTemplateRef<HFormInst>("formRef");
const registering = useLoader();
const registerForm = reactive({
  username: "",
  email: "",
  password: "",
});
const rules = {
  username: usernameRule,
  email: emailRule,
  password: passwordRule,
};
// Règles du mot de passe affichées tant que le champ est vide, remplacées ensuite par la validation
const passwordFeedback = computed(() =>
  registerForm.password ? undefined : PASSWORD_HINT.charAt(0).toUpperCase() + PASSWORD_HINT.slice(1)
);

async function handleSubmit() {
  const response = await registering.run(() =>
    auth.register(registerForm.email, registerForm.password, registerForm.username)
  );

  if (response) {
    formRef.value?.reset();
    emit("registered");
  }
}
</script>

<template>
  <div class="signup-container">
    <h-form ref="formRef" :model="registerForm" :rules="rules" @submit.prevent="handleSubmit()">
      <h-form-item label="Pseudo" path="username">
        <h-input
          placeholder=""
          v-model:value="registerForm.username"
          :input-props="{ autocomplete: 'username', name: 'username' }"
          :maxlength="USERNAME_MAX_LENGTH" />
      </h-form-item>
      <h-form-item label="Email" path="email">
        <h-input
          placeholder=""
          v-model:value="registerForm.email"
          :input-props="{ type: 'email', autocomplete: 'email', name: 'email' }" />
      </h-form-item>
      <h-form-item :feedback="passwordFeedback" label="Mot de passe" path="password">
        <h-input
          placeholder=""
          v-model:value="registerForm.password"
          :input-props="{ autocomplete: 'new-password', name: 'new-password' }"
          show-password-on="click"
          type="password" />
      </h-form-item>
      <h-flex class="tw:mt-3" vertical>
        <h-button :disabled="!formRef?.isValid" :loading="registering.loading" attr-type="submit">
          S'inscrire
        </h-button>
        <h-text depth="3">
          En créant un compte, vous acceptez le traitement de vos données décrit dans les
          <n-a href="/mentions-legales" target="_blank">mentions légales et de confidentialité</n-a>
        </h-text>
      </h-flex>
    </h-form>
  </div>
</template>
