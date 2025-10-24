<script lang="ts" setup>
import { ref } from "vue";
import RegisterView from "@/views/RegisterView.vue";
import { useAuthStore } from "@/stores/auth";
import { renderNaiveFontAwesomeIcon } from "@/composables/fontAwesomeUtils.ts";

const auth = useAuthStore();

const emit = defineEmits(["connected"]);

const email = ref("");
const password = ref("");
const showRegisterModal = ref(false);

async function handleSubmit() {
  let response = await auth.login(email.value, password.value);

  if (response) {
    emit("connected");
  }
}
</script>

<template>
  <div class="login-container">
    <n-form @submit.prevent="handleSubmit()">
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
      :icon="() => renderNaiveFontAwesomeIcon({ fas: 'user-plus' })"
      :mask-closable="false"
      class="apple-menu"
      preset="dialog"
      transform-origin="center">
      <template #default>
        <register-view @registered="showRegisterModal = false" />
      </template>
    </n-modal>
  </div>
</template>

<style lang="sass" scoped></style>
