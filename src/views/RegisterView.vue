<script lang="ts" setup>
import { useUserStore } from "@/stores/user.js";
import { useReactiveForm, useReactiveRules } from "@/composables/reactiveForm";
import { FormItemRule, useMessage } from "naive-ui";
import { ref, useTemplateRef } from "vue";

const userStore = useUserStore();
const message = useMessage();

const emit = defineEmits(["registered"]);

const formRef = useTemplateRef("formRef");
const registerForm = useReactiveForm(
  {
    username: "",
    email: "",
    password: "",
  },
  formRef
);
const rules = useReactiveRules({
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
  let response = await userStore.register(
    registerForm.form.email,
    registerForm.form.password,
    registerForm.form.username
  );

  if (response) {
    await registerForm.reset();
    emit("registered");
  }
}
</script>

<template>
  <div class="signup-container">
    <n-form
      ref="formRef"
      :model="registerForm.form"
      :rules="rules"
      @submit.prevent="handleSubmit()">
      <n-form-item label="Nom d'utilisateur" path="username">
        <n-input v-model:value="registerForm.form.username" placeholder="" />
      </n-form-item>
      <n-form-item label="Email" path="email">
        <n-input v-model:value="registerForm.form.email" placeholder="" />
      </n-form-item>
      <n-form-item label="Mot de passe" path="password">
        <n-input v-model:value="registerForm.form.password" placeholder="" type="password" />
      </n-form-item>
      <n-form-item>
        <n-flex style="width: 100%" vertical>
          <n-button :disabled="!registerForm.isValid.value" attr-type="submit">S'inscrire</n-button>
        </n-flex>
      </n-form-item>
      <n-text>
        Vous avez déjà un compte ?
        <router-link #="{ navigate, href }" custom to="/login">
          <n-a :href="href" @click="navigate">Se connecter</n-a>
        </router-link>
      </n-text>
    </n-form>
  </div>
</template>

<style lang="css" scoped></style>
