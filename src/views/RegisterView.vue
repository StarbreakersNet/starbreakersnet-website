<script lang="ts" setup>
import { useAuthStore } from "@/stores/auth";
import { computed, reactive, ref, useTemplateRef } from "vue";
import type { HFormInst } from "@/types/components/c/hForm.ts";
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

const auth = useAuthStore();

const emit = defineEmits(["registered"]);

const formRef = useTemplateRef<HFormInst>("formRef");
const loading = ref(false);
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
  loading.value = true;
  const response = await auth.register(
    registerForm.email,
    registerForm.password,
    registerForm.username
  );
  loading.value = false;

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
        <h-button :disabled="!formRef?.isValid" :loading="loading" attr-type="submit">
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

<style lang="css" scoped></style>
