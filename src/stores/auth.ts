import { defineStore } from "pinia";
import { useMessage } from "@/composables/useMessage";
import { useUserStore } from "@/stores/user";
import type { UserType } from "@/types/User";

const CONFIRMATION_TEXT =
  "Merci de votre inscription ! Consultez vos emails et cliquez sur le lien de confirmation pour vous connecter";

export const useAuthStore = defineStore("auth", () => {
  const user = useUserStore();
  const message = useMessage();

  async function getUserInfos() {

  }

  async function login(email: string, password: string) {

  }

  async function refreshSession() {

  }

  async function refreshData() {
    if (user.infos.connected) {
      await getUserInfos();
    }
  }

  async function logout(inError = false) {

  }

  async function register(email: string, password: string, firstName: string) {

  }

  async function update(user: UserType) {

  }

  async function updatePassword(oldPassword: string, newPassword: string) {

  }

  return {
    login,
    refreshSession,
    refreshData,
    logout,
    register,
    update,
    updatePassword,
  };
});
