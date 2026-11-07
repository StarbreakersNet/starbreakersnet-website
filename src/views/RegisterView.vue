<script lang="ts" setup>
import { useAuthStore } from "@/stores/auth";
import { reactive, ref, useTemplateRef } from "vue";
import type { HFormInst } from "@/types/components/c/hForm.ts";
import HForm from "@/components/c/hForm.vue";
import HFormItem from "@/components/c/hFormItem.vue";
import HInput from "@/components/c/hInput.vue";
import HFlex from "@/components/c/hFlex.vue";
import HButton from "@/components/c/hButton.vue";
import { emailRule, passwordRule, usernameRule } from "@/lib/validation";

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
      <h-form-item label="Nom d'utilisateur" path="username">
        <h-input v-model:value="registerForm.username" placeholder="" />
      </h-form-item>
      <h-form-item label="Email" path="email">
        <h-input v-model:value="registerForm.email" placeholder="" />
      </h-form-item>
      <h-form-item label="Mot de passe" path="password">
        <h-input
          v-model:value="registerForm.password"
          show-password-on="click"
          type="password" />
      </h-form-item>
      <h-form-item>
        <h-flex style="width: 100%" vertical>
          <h-button :disabled="!formRef?.isValid" :loading="loading" attr-type="submit">
            S'inscrire
          </h-button>
        </h-flex>
      </h-form-item>
    </h-form>
  </div>
</template>

<style lang="css" scoped></style>
