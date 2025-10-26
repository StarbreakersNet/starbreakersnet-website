<script lang="ts" setup>
import HCard from "@/components/c/hCard.vue";
import HFlex from "@/components/c/hFlex.vue";
import HForm from "@/components/c/hForm.vue";
import HFormItem from "@/components/c/hFormItem.vue";
import HInput from "@/components/c/hInput.vue";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { reactive, useTemplateRef } from "vue";
import { useNotification } from "@/composables/useNotification";
import { useUserStore } from "@/stores/user.ts";
import HAlert from "@/components/c/hAlert.vue";
import HGrid from "@/components/c/hGrid.vue";
import HFormItemGi from "@/components/c/hFormItemGi.vue";
import { useAuthStore } from "@/stores/auth.ts";
import type { UserType } from "@/types/User.ts";

const user = useUserStore();
const auth = useAuthStore();
const notification = useNotification();

const accountForm = useTemplateRef("accountForm");
const passwordForm = useTemplateRef("passwordForm");

const account = reactive({
  username: user.infos.me?.username ?? null,
  email: user.infos.me?.email ?? null,
});
const passwords = reactive({
  password: "",
  newPassword: "",
  newPasswordConfirmation: "",
});

async function handleSubmit() {
  let query: UserType = {
    username: account.username,
    email: account.email,
  };

  let response = await auth.update(query);

  if (passwordForm.value?.isValid) {
    query.password = passwords.newPassword;
    await auth.updatePassword(passwords.password, passwords.newPassword);
  }

  if (response) {
    await auth.refreshData();
  }
}
</script>

<template>
  <h-card class="tw:max-w-4xl">
    <template #header>Mon compte</template>
    <template #default>
      <h-flex vertical>
        <h-alert type="warning">
          <template #header>WIP: Terminer le formulaire du compte</template>
          <template #default>
            <ul>
              <li>Implémentation des call au backend</li>
              <li>Validation du form</li>
              <li>Faire la verification des routes pour faire un forbiden lorsque pas connecté</li>
            </ul>
          </template>
        </h-alert>
        <h-card :bordered="false" embedded segmented size="small">
          <template #header>Informations</template>
          <template #default>
            <h-form ref="accountForm" :model="account" :rules="{}">
              <h-grid>
                <h-form-item-gi :span="6" label="Pseudo">
                  <h-input v-model:value="account.username" />
                </h-form-item-gi>
                <h-form-item-gi :span="6" label="Email">
                  <h-input v-model:value="account.email" />
                </h-form-item-gi>
              </h-grid>
            </h-form>
          </template>
        </h-card>
        <h-card :bordered="false" embedded segmented size="small">
          <template #header>Sécurité</template>
          <template #default>
            <h-flex vertical>
              <h-form ref="passwordForm" :model="passwords" :rules="{}">
                <h-form-item label="Ancien mot de passe" path="password">
                  <h-input v-model:value="passwords.password" type="password" />
                </h-form-item>
                <h-grid :cols="12">
                  <h-form-item-gi :span="6" label="Nouveau mot de passe" path="newPassword">
                    <h-input
                      v-model:value="passwords.newPassword"
                      :disabled="!passwords.password"
                      type="password" />
                  </h-form-item-gi>
                  <h-form-item-gi
                    :span="6"
                    label="Confirmer le nouveau mot de passe"
                    path="newPasswordConfirmation">
                    <h-input
                      v-model:value="passwords.newPasswordConfirmation"
                      :disabled="!passwords.password"
                      type="password" />
                  </h-form-item-gi>
                </h-grid>
              </h-form>
            </h-flex>
          </template>
        </h-card>
      </h-flex>
    </template>
    <template #action-float>
      <n-float-button-group>
        <n-float-button type="primary" @click="handleSubmit()">
          <font-awesome-icon icon="save" />
        </n-float-button>
      </n-float-button-group>
    </template>
  </h-card>
</template>

<style lang="scss" scoped></style>
