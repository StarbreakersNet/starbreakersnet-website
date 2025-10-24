<script lang="ts" setup>
import type { FormItemRule } from "naive-ui";
import { useAuthStore } from "@/stores/auth";
import { reactive, useTemplateRef } from "vue";
import type { HFormInst } from "@/types/components/c/hForm.ts";
import HForm from "@/components/c/hForm.vue";
import HFormItem from "@/components/c/hFormItem.vue";
import HInput from "@/components/c/hInput.vue";
import HFlex from "@/components/c/hFlex.vue";
import HButton from "@/components/c/hButton.vue";

const auth = useAuthStore();

const emit = defineEmits(["registered"]);

const formRef = useTemplateRef<HFormInst>("formRef");
const registerForm = reactive({
  username: "",
  email: "",
  password: "",
});
const rules = reactive({
  username: [
    {
      required: true,
      trigger: ["input", "blur"],
      validator(rule: FormItemRule, value: string) {
        if (!value) {
          return new Error("Un nom d'utilisateur est requis");
        } else if (value.length < 3) {
          return new Error("Doit contenir au moins 3 caractères");
        } else if (/[^a-zA-Z0-9]/.test(value)) {
          return new Error("Ne doit pas contenir de caractères spéciaux");
        }
        return true;
      },
    },
  ],
  email: [
    {
      required: true,
      trigger: ["input", "blur"],
      validator(rule: FormItemRule, value: string) {
        if (!value) {
          return new Error("Une adresse email est requis");
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return new Error("Veuillez entrer une adresse e-mail valide");
        }
        return true;
      },
    },
  ],
  password: [
    {
      required: true,
      trigger: ["input", "blur"],
      validator(rule: FormItemRule, value: string) {
        if (!value) {
          return new Error("Un mot de passe est requis");
        } else if (value.length < 6) {
          return new Error("Doit contenir au moins 6 caractères");
        } else if (!/\d/.test(value)) {
          return new Error("Doit contenir au moins un chiffre");
        } else if (!/[A-Z]/.test(value)) {
          return new Error("Doit contenir au moins une majuscule");
        }
        return true;
      },
    },
  ],
});

async function handleSubmit() {
  let response = await auth.register(
    registerForm.email,
    registerForm.password,
    registerForm.username
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
      <h-form-item label="Nom d'utilisateur" path="username">
        <h-input v-model:value="registerForm.username" placeholder="" />
      </h-form-item>
      <h-form-item label="Email" path="email">
        <h-input v-model:value="registerForm.email" placeholder="" />
      </h-form-item>
      <h-form-item label="Mot de passe" path="password">
        <h-input v-model:value="registerForm.password" placeholder="" type="password" />
      </h-form-item>
      <h-form-item>
        <h-flex style="width: 100%" vertical>
          <h-button :disabled="!formRef?.isValid" attr-type="submit">S'inscrire</h-button>
        </h-flex>
      </h-form-item>
    </h-form>
  </div>
</template>

<style lang="css" scoped></style>
