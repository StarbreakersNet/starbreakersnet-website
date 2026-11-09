<script lang="ts" setup>
import { computed, reactive, ref, useTemplateRef } from "vue";
import { useRoute, useRouter } from "vue-router";
import type { HFormInst } from "@/types/components/c/hForm.ts";
import HCard from "@/components/c/hCard.vue";
import HAlert from "@/components/c/hAlert.vue";
import HForm from "@/components/c/hForm.vue";
import HFormItem from "@/components/c/hFormItem.vue";
import HInput from "@/components/c/hInput.vue";
import HFlex from "@/components/c/hFlex.vue";
import HButton from "@/components/c/hButton.vue";
import { useAuthStore } from "@/stores/auth";
import { useMessage } from "@/composables/useMessage";
import { passwordConfirmationRule, passwordRule } from "@/lib/validation";

const auth = useAuthStore();
const message = useMessage();
const route = useRoute();
const router = useRouter();

const formRef = useTemplateRef<HFormInst>("formRef");
const loading = ref(false);
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
  loading.value = true;
  const response = await auth.resetPassword(form.password);
  loading.value = false;

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
          <h-button :disabled="!formRef?.isValid" :loading="loading" attr-type="submit">
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
