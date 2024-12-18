<script lang="ts" setup>
import { ref } from "vue";
import { useUserStore } from "@/stores/user";
import RegisterView from "@/views/RegisterView.vue";
import { renderFontAwesomeIcon } from "@/composables/appUtils";

const userStore = useUserStore();

const email = ref("");
const password = ref("");
const showRegisterModal = ref(false);
</script>

<template>
  <div class="login-container">
    <n-form @submit.prevent="userStore.login(email, password)">
      <n-form-item label="Email">
        <n-input v-model:value="email" placeholder="" />
      </n-form-item>
      <n-form-item label="Mot de passe">
        <n-input v-model:value="password" placeholder="" type="password" />
      </n-form-item>
      <n-form-item>
        <n-flex style="width: 100%" vertical>
          <n-button attr-type="submit">Se connecter</n-button>
        </n-flex>
      </n-form-item>
      <n-text>
        Vous n'avez pas de compte ?
        <n-a @click="showRegisterModal = true">S'inscrire</n-a>
      </n-text>
    </n-form>
    <n-modal
      v-model:show="showRegisterModal"
      :icon="() => renderFontAwesomeIcon({ fas: 'user-plus' })"
      :mask-closable="false"
      class="apple-menu"
      preset="dialog"
      transform-origin="center">
      <template #default>
        <register-view />
      </template>
    </n-modal>
  </div>
</template>

<style lang="sass" scoped></style>
