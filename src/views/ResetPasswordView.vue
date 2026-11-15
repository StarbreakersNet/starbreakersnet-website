<script lang="ts" setup>
import { computed, reactive, useTemplateRef } from "vue";
import { useLoader } from "@/composables/useLoader";
import { useRoute, useRouter } from "vue-router";
import type { HFormInst } from "@/types/components/c/hForm";
import HCard from "@/components/c/hCard.vue";
import HAlert from "@/components/c/hAlert.vue";
import HForm from "@/components/c/hForm.vue";
import HFormItem from "@/components/c/hFormItem.vue";
import HInput from "@/components/c/hInput.vue";
import HFlex from "@/components/c/hFlex.vue";
import HButton from "@/components/c/hButton.vue";
import { useAuthStore } from "@/stores/auth";
import { useAppMessage } from "@/composables/useAppMessage";
import { passwordConfirmationRule, passwordRule } from "@/utils/validation";

const auth = useAuthStore();
const message = useAppMessage();
const route = useRoute();
const router = useRouter();

const formRef = useTemplateRef<HFormInst>("formRef");
const saving = useLoader();
const form = reactive({
  password: "",
  passwordConfirmation: "",
});
const rules = {
  password: passwordRule,
  passwordConfirmation: passwordConfirmationRule(() => form.password),
};

// Lien expiré ou déjà utilisé : GoTrue redirige avec l'erreur dans le hash de l'URL
const linkError = computed(() =>
  new URLSearchParams(route.hash.replace(/^#/, "")).get("error_code")
);

async function handleSubmit() {
  const response = await saving.run(() => auth.resetPassword(form.password));

  if (response) {
    message.success("Mot de passe modifié, vous êtes connecté");
    await router.replace({ name: "home" });
  }
}
</script>

<template>
  <h-card class="tw:max-w-xl tw:self-center">
    <template #header>Nouveau mot de passe</template>
    <template #default>
      <!-- Le formulaire n'apparaît qu'après l'événement PASSWORD_RECOVERY (lien valide) -->
      <h-form
        v-if="auth.passwordRecovery"
        ref="formRef"
        :model="form"
        :rules="rules"
        @submit.prevent="handleSubmit()">
        <h-form-item label="Nouveau mot de passe" path="password">
          <h-input
            v-model:value="form.password"
            :input-props="{ autocomplete: 'new-password' }"
            show-password-on="click"
            type="password" />
        </h-form-item>
        <h-form-item label="Confirmer le nouveau mot de passe" path="passwordConfirmation">
          <h-input
            v-model:value="form.passwordConfirmation"
            :input-props="{ autocomplete: 'new-password' }"
            show-password-on="click"
            type="password" />
        </h-form-item>
        <h-flex vertical>
          <h-button :disabled="!formRef?.isValid" :loading="saving.loading" attr-type="submit">
            Enregistrer le mot de passe
          </h-button>
        </h-flex>
      </h-form>
      <h-flex v-else vertical>
        <h-alert type="warning">
          <template #header>
            {{ linkError === "otp_expired" ? "Lien expiré" : "Lien invalide" }}
          </template>
          <template #default>
            Ce lien de réinitialisation est invalide, a expiré ou a déjà été utilisé. Demandez-en un
            nouveau depuis la fenêtre de connexion.
          </template>
        </h-alert>
        <h-button @click="router.replace({ name: 'home', query: { login: '1' } })">
          Retour à la connexion
        </h-button>
      </h-flex>
    </template>
  </h-card>
</template>
