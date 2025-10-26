<script lang="ts" setup>
import HCard from "@/components/c/hCard.vue";
import HFlex from "@/components/c/hFlex.vue";
import HForm from "@/components/c/hForm.vue";
import HFormItem from "@/components/c/hFormItem.vue";
import HInput from "@/components/c/hInput.vue";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { reactive } from "vue";
import { useUserStore } from "@/stores/user.ts";
import HAlert from "@/components/c/hAlert.vue";
import HGrid from "@/components/c/hGrid.vue";
import HFormItemGi from "@/components/c/hFormItemGi.vue";

const user = useUserStore();

const accountForm = reactive({
  firstName: user.infos.me?.first_name,
  email: user.infos.me?.email,
});
const passwordForm = reactive({
  password: "",
  newPassword: "",
  newPasswordConfirmation: "",
});
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
            </ul>
          </template>
        </h-alert>
        <h-card :bordered="false" embedded segmented size="small">
          <template #header>Informations</template>
          <template #default>
            <h-form :model="accountForm" :rules="{}">
              <h-grid>
                <h-form-item-gi :span="6" label="Prénom">
                  <h-input />
                </h-form-item-gi>
                <h-form-item-gi :span="6" label="Nom">
                  <h-input />
                </h-form-item-gi>
              </h-grid>
              <h-form-item label="Email">
                <h-input />
              </h-form-item>
            </h-form>
          </template>
        </h-card>
        <h-card :bordered="false" embedded segmented size="small">
          <template #header>Sécurité</template>
          <template #default>
            <h-flex vertical>
              <h-form :model="passwordForm" :rules="{}">
                <h-form-item label="Ancien mot de passe">
                  <h-input type="password" />
                </h-form-item>
                <h-grid :cols="12">
                  <h-form-item-gi :span="6" label="Nouveau mot de passe">
                    <h-input :disabled="!passwordForm.password" type="password" />
                  </h-form-item-gi>
                  <h-form-item-gi :span="6" label="Confirmer le nouveau mot de passe">
                    <h-input :disabled="!passwordForm.password" type="password" />
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
        <n-float-button type="primary">
          <font-awesome-icon icon="save" />
        </n-float-button>
      </n-float-button-group>
    </template>
  </h-card>
</template>

<style lang="scss" scoped></style>
