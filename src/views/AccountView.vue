<script lang="ts" setup>
import HCard from "@/components/c/hCard.vue";
import HFlex from "@/components/c/hFlex.vue";
import HForm from "@/components/c/hForm.vue";
import HInput from "@/components/c/hInput.vue";
import HAlert from "@/components/c/hAlert.vue";
import HGrid from "@/components/c/hGrid.vue";
import HFormItemGi from "@/components/c/hFormItemGi.vue";
import HFormItem from "@/components/c/hFormItem.vue";
import HButton from "@/components/c/hButton.vue";
import HModal from "@/components/c/hModal.vue";
import HText from "@/components/c/hText.vue";
import { renderNaiveFontAwesomeIcon } from "@/composables/fontAwesomeUtils.ts";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import type { FormItemRule, FormRules } from "naive-ui";
import { computed, onMounted, reactive, ref, useTemplateRef, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useMessage } from "@/composables/useMessage";
import { useUserStore } from "@/stores/user.ts";
import { useAuthStore } from "@/stores/auth.ts";
import type { HFormInst } from "@/types/components/c/hForm.ts";
import {
  emailRule,
  passwordConfirmationRule,
  passwordRule,
  USERNAME_MAX_LENGTH,
  usernameRule,
} from "@/lib/validation";
import { formatUserTag } from "@/lib/userTag";

const EMAIL_CHANGE_TEXT =
  "Un lien de confirmation a été envoyé à votre adresse actuelle et à la nouvelle. " +
  "Le changement sera effectif une fois les deux liens validés.";
const EMAIL_CHANGE_DURATION = 10000;

const user = useUserStore();
const auth = useAuthStore();
const message = useMessage();
const route = useRoute();
const router = useRouter();

const accountFormRef = useTemplateRef<HFormInst>("accountFormRef");
const passwordFormRef = useTemplateRef<HFormInst>("passwordFormRef");
const deleteFormRef = useTemplateRef<HFormInst>("deleteFormRef");

const saving = ref(false);
const account = reactive({
  username: "",
  firstName: "",
  lastName: "",
  email: "",
});
const passwords = reactive({
  password: "",
  newPassword: "",
  newPasswordConfirmation: "",
});

const accountRules: FormRules = {
  username: usernameRule,
  email: emailRule,
};

// Les champs mot de passe sont facultatifs : ils ne sont validés que si l'un d'eux est rempli
const wantsPasswordChange = computed(() => Object.values(passwords).some(value => value !== ""));
const currentPasswordRule: FormItemRule = {
  required: true,
  trigger: ["input", "blur"],
  message: "Saisissez votre mot de passe actuel",
};
const passwordRules = computed((): FormRules => {
  if (!wantsPasswordChange.value) {
    return {};
  }

  return {
    password: currentPasswordRule,
    newPassword: passwordRule,
    newPasswordConfirmation: passwordConfirmationRule(() => passwords.newPassword),
  };
});

// Suppression du compte : confirmée par le mot de passe, dans une fenêtre dédiée
const showDeleteModal = ref(false);
const deleting = ref(false);
const deleteForm = reactive({ password: "" });
const deleteRules: FormRules = { password: currentPasswordRule };

function openDeleteModal() {
  deleteForm.password = "";
  showDeleteModal.value = true;
}

async function handleDelete() {
  if (deleting.value || !(await isValid(deleteFormRef.value))) {
    return;
  }

  deleting.value = true;
  const deleted = await auth.deleteAccount(deleteForm.password);
  deleting.value = false;

  // Plus de session : AppLayout ramène à l'accueil depuis cette page protégée
  if (deleted) {
    showDeleteModal.value = false;
  }
}

const pendingEmail = computed(() => user.infos.me?.pendingEmail ?? null);
// Numéro du pseudo enregistré (« #0421 »), recalculé par la base quand le pseudo change
const userTag = computed(() => formatUserTag(user.infos.me?.tag));

function resetAccountForm() {
  const me = user.infos.me;

  account.username = me?.username ?? "";
  account.firstName = me?.firstName ?? "";
  account.lastName = me?.lastName ?? "";
  account.email = me?.email ?? "";
}

// Le formulaire suit le profil du store : il est rempli dès que le profil est chargé
// (accès direct à /account) et remis à jour après chaque sauvegarde
watch(() => user.infos.me, resetAccountForm, { immediate: true });

function isProfileChanged() {
  const me = user.infos.me;

  return (
    account.username !== (me?.username ?? "") ||
    account.firstName !== (me?.firstName ?? "") ||
    account.lastName !== (me?.lastName ?? "")
  );
}

async function isValid(form: HFormInst | null) {
  try {
    await form?.validate();
    return true;
  } catch {
    return false;
  }
}

async function handleSubmit() {
  if (saving.value || !user.infos.me) {
    return;
  }

  const accountValid = await isValid(accountFormRef.value);
  const passwordValid = !wantsPasswordChange.value || (await isValid(passwordFormRef.value));

  if (!accountValid || !passwordValid) {
    return;
  }

  const profileChanged = isProfileChanged();
  const emailChanged = account.email !== user.infos.me.email;

  if (!profileChanged && !emailChanged && !wantsPasswordChange.value) {
    message.info("Aucune modification à enregistrer");
    return;
  }

  saving.value = true;
  let saved = false;

  if (profileChanged) {
    saved =
      (await auth.updateProfile({
        username: account.username,
        firstName: account.firstName,
        lastName: account.lastName,
      })) || saved;
  }

  if (wantsPasswordChange.value) {
    if (await auth.updatePassword(passwords.password, passwords.newPassword)) {
      saved = true;
      passwordFormRef.value?.reset();
    }
  }

  if (emailChanged && (await auth.updateEmail(account.email))) {
    message.info(EMAIL_CHANGE_TEXT, { duration: EMAIL_CHANGE_DURATION });
  }

  if (saved) {
    message.success("Modifications enregistrées");
  }

  saving.value = false;
}

onMounted(() => {
  // Retour du premier lien de changement d'email : GoTrue ajoute un message dans le hash de l'URL
  const params = new URLSearchParams(route.hash.replace(/^#/, ""));

  if (params.has("message")) {
    message.info("Premier lien validé : confirmez maintenant celui envoyé à l'autre adresse", {
      duration: EMAIL_CHANGE_DURATION,
    });
    router.replace({ hash: "" });
  }
});
</script>

<template>
  <h-card class="tw:max-w-4xl">
    <template #header>Mon compte</template>
    <template #default>
      <h-flex vertical>
        <h-alert v-if="pendingEmail" type="info">
          <template #header>Changement d'adresse email en attente</template>
          <template #default>
            <strong>{{ pendingEmail }}</strong>
            deviendra votre adresse une fois validés les liens de confirmation envoyés à votre
            adresse actuelle et à la nouvelle.
          </template>
        </h-alert>
        <h-card :bordered="false" embedded segmented size="small">
          <template #header>Informations</template>
          <template #default>
            <h-form ref="accountFormRef" :model="account" :rules="accountRules">
              <h-grid>
                <h-form-item-gi :span="6" label="Pseudo" path="username">
                  <h-input
                    v-model:value="account.username"
                    :input-props="{ autocomplete: 'username' }"
                    :maxlength="USERNAME_MAX_LENGTH">
                    <template v-if="userTag" #suffix>
                      <span title="Numéro qui vous distingue des membres ayant le même pseudo">
                        {{ userTag }}
                      </span>
                    </template>
                  </h-input>
                </h-form-item-gi>
                <h-form-item-gi :span="6" label="Email" path="email">
                  <h-input
                    v-model:value="account.email"
                    :input-props="{ type: 'email', autocomplete: 'email' }" />
                </h-form-item-gi>
                <h-form-item-gi :span="6" label="Prénom" path="firstName">
                  <h-input
                    v-model:value="account.firstName"
                    :input-props="{ autocomplete: 'given-name' }" />
                </h-form-item-gi>
                <h-form-item-gi :span="6" label="Nom" path="lastName">
                  <h-input
                    v-model:value="account.lastName"
                    :input-props="{ autocomplete: 'family-name' }" />
                </h-form-item-gi>
              </h-grid>
            </h-form>
          </template>
        </h-card>
        <h-card :bordered="false" embedded segmented size="small">
          <template #header>Sécurité</template>
          <template #default>
            <h-form ref="passwordFormRef" :model="passwords" :rules="passwordRules">
              <h-grid>
                <h-form-item-gi :span="12" label="Mot de passe actuel" path="password">
                  <h-input
                    v-model:value="passwords.password"
                    :input-props="{ autocomplete: 'current-password' }"
                    show-password-on="click"
                    type="password" />
                </h-form-item-gi>
                <h-form-item-gi :span="6" label="Nouveau mot de passe" path="newPassword">
                  <h-input
                    v-model:value="passwords.newPassword"
                    :disabled="!passwords.password"
                    :input-props="{ autocomplete: 'new-password' }"
                    show-password-on="click"
                    type="password" />
                </h-form-item-gi>
                <h-form-item-gi
                  :span="6"
                  label="Confirmer le nouveau mot de passe"
                  path="newPasswordConfirmation">
                  <h-input
                    v-model:value="passwords.newPasswordConfirmation"
                    :disabled="!passwords.password"
                    :input-props="{ autocomplete: 'new-password' }"
                    show-password-on="click"
                    type="password" />
                </h-form-item-gi>
              </h-grid>
            </h-form>
          </template>
        </h-card>
        <h-card :bordered="false" embedded segmented size="small">
          <template #header>Supprimer mon compte</template>
          <template #default>
            <h-flex align="center" justify="space-between">
              <h-text depth="3">
                Votre compte, votre profil et vos paramètres sont supprimés définitivement.
              </h-text>
              <h-button ghost type="error" @click="openDeleteModal()">
                Supprimer mon compte
              </h-button>
            </h-flex>
          </template>
        </h-card>
      </h-flex>
      <h-modal
        v-model:show="showDeleteModal"
        :icon="() => renderNaiveFontAwesomeIcon({ fas: 'triangle-exclamation' })"
        class="apple-menu"
        preset="dialog"
        title="Supprimer mon compte"
        transform-origin="center"
        type="error">
        <template #default>
          <h-form
            ref="deleteFormRef"
            :model="deleteForm"
            :rules="deleteRules"
            @submit.prevent="handleDelete()">
            <h-flex vertical>
              <h-text>
                Cette action est définitive : votre compte, votre profil et vos paramètres seront
                supprimés et ne pourront pas être récupérés. Saisissez votre mot de passe pour
                confirmer.
              </h-text>
              <h-form-item label="Mot de passe" path="password">
                <h-input
                  v-model:value="deleteForm.password"
                  :input-props="{ autocomplete: 'current-password' }"
                  show-password-on="click"
                  type="password" />
              </h-form-item>
              <h-flex justify="end">
                <h-button @click="showDeleteModal = false">Annuler</h-button>
                <h-button :loading="deleting" attr-type="submit" type="error">
                  Supprimer définitivement
                </h-button>
              </h-flex>
            </h-flex>
          </h-form>
        </template>
      </h-modal>
    </template>
    <template #action-float>
      <n-float-button-group>
        <n-float-button type="primary" @click="handleSubmit()">
          <font-awesome-icon :icon="saving ? 'spinner' : 'save'" :spin="saving" />
        </n-float-button>
      </n-float-button-group>
    </template>
  </h-card>
</template>

<style lang="scss" scoped></style>
