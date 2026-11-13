<script lang="ts" setup>
import { reactive, ref, useTemplateRef } from "vue";
import type { FormRules } from "naive-ui";
import RegisterView from "@/views/RegisterView.vue";
import ForgotPasswordView from "@/views/ForgotPasswordView.vue";
import HModal from "@/components/c/hModal.vue";
import HForm from "@/components/c/hForm.vue";
import HFormItem from "@/components/c/hFormItem.vue";
import HInput from "@/components/c/hInput.vue";
import HFlex from "@/components/c/hFlex.vue";
import HButton from "@/components/c/hButton.vue";
import HText from "@/components/c/hText.vue";
import HAlert from "@/components/c/hAlert.vue";
import type { HFormInst } from "@/types/components/c/hForm.ts";
import { useAuthStore } from "@/stores/auth";
import { useUserStore } from "@/stores/user";
import { emailRule } from "@/utils/validation";
import { renderNaiveFontAwesomeIcon } from "@/composables/fontAwesomeUtils.ts";

const auth = useAuthStore();
const user = useUserStore();

const emit = defineEmits(["connected"]);

const formRef = useTemplateRef<HFormInst>("formRef");
const form = reactive({
  email: "",
  password: "",
});
// À la connexion, on vérifie seulement que les champs sont remplis : les règles de complexité du
// mot de passe s'appliquent à sa création, pas aux comptes existants
const rules: FormRules = {
  email: emailRule,
  password: { required: true, trigger: ["blur"], message: "Saisissez votre mot de passe" },
};
const loading = ref(false);
const resending = ref(false);
// Email du compte non confirmé, pour proposer le renvoi du lien
const unconfirmedEmail = ref<string | null>(null);
const showRegisterModal = ref(false);
const showForgotPasswordModal = ref(false);

async function handleSubmit() {
  // Pas de bouton désactivé : les champs remplis par le gestionnaire de mots de passe ne sont
  // visibles du script qu'après une interaction, on valide donc à l'envoi
  try {
    await formRef.value?.validate();
  } catch {
    return;
  }

  loading.value = true;
  const result = await auth.login(form.email, form.password);
  loading.value = false;

  unconfirmedEmail.value = result === "unconfirmed" ? form.email : null;

  if (result === "ok") {
    emit("connected");
  }
}

async function handleResend() {
  if (!unconfirmedEmail.value) {
    return;
  }

  resending.value = true;
  if (await auth.resendConfirmation(unconfirmedEmail.value)) {
    unconfirmedEmail.value = null;
  }
  resending.value = false;
}

function handleRegistered() {
  showRegisterModal.value = false;

  // Sans confirmation d'email (autoconfirm), l'inscription connecte directement l'utilisateur
  if (user.infos.connected) {
    emit("connected");
  }
}
</script>

<template>
  <div class="login-container">
    <h-form ref="formRef" :model="form" :rules="rules" @submit.prevent="handleSubmit()">
      <h-form-item label="Email" path="email">
        <h-input
          placeholder=""
          v-model:value="form.email"
          :input-props="{ type: 'email', autocomplete: 'email', name: 'email' }" />
      </h-form-item>
      <h-form-item label="Mot de passe" path="password">
        <h-input
          placeholder=""
          v-model:value="form.password"
          :input-props="{ autocomplete: 'current-password', name: 'password' }"
          show-password-on="click"
          type="password" />
      </h-form-item>
      <h-flex vertical>
        <h-alert v-if="unconfirmedEmail" type="warning">
          <h-flex vertical>
            <span>Votre adresse n'est pas encore confirmée. Lien perdu ou expiré ?</span>
            <h-button :loading="resending" size="small" @click="handleResend()">
              Renvoyer le mail de confirmation
            </h-button>
          </h-flex>
        </h-alert>
        <h-button :loading="loading" attr-type="submit">Se connecter</h-button>
        <h-text>
          <n-a @click="showForgotPasswordModal = true">Mot de passe oublié ?</n-a>
        </h-text>
        <h-text>
          Vous n'avez pas de compte ?
          <n-a @click="showRegisterModal = true">S'inscrire</n-a>
        </h-text>
      </h-flex>
    </h-form>
    <h-modal
      v-model:show="showRegisterModal"
      :icon="() => renderNaiveFontAwesomeIcon({ fas: 'user-plus' })"
      :mask-closable="false"
      class="apple-menu"
      preset="dialog"
      title="Inscription"
      transform-origin="center">
      <template #default>
        <register-view @registered="handleRegistered()" />
      </template>
    </h-modal>
    <h-modal
      v-model:show="showForgotPasswordModal"
      :icon="() => renderNaiveFontAwesomeIcon({ fas: 'key' })"
      class="apple-menu"
      preset="dialog"
      title="Mot de passe oublié"
      transform-origin="center">
      <template #default>
        <forgot-password-view :email="form.email" @sent="showForgotPasswordModal = false" />
      </template>
    </h-modal>
  </div>
</template>

<style lang="scss" scoped></style>
