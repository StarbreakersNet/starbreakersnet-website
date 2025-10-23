import { defineStore } from "pinia";
import { authentication, createDirectus, readMe, registerUser, rest } from "@directus/sdk";
import { useMessage } from "@/composables/useMessage";
import { useUserStore } from "@/stores/user";
import { UserType } from "@/types/User";

const CONFIRMATION_TEXT =
  "Merci de votre inscription ! Consultez vos emails et cliquez sur le lien de confirmation pour vous connecter";

export const useAuthStore = defineStore("auth", () => {
  const user = useUserStore();
  const message = useMessage();
  const directus = createDirectus(import.meta.env.VITE_API_URL)
    .with(
      authentication("cookie", {
        credentials: "include",
        autoRefresh: true,
      })
    )
    .with(rest({ credentials: "include" }));

  async function getUserInfos() {
    if (user.infos.connected) {
      const directusUserData = (await directus.request(
        readMe({
          fields: ["id", "email", "first_name", "last_name"],
        })
      )) as UserType;
      console.log("UserData", directusUserData);
      user.infos.me = directusUserData;
    } else {
      console.error("You are not connected");
    }
  }

  async function login(email: string, password: string) {
    try {
      const response = await directus.login(email, password);
      if (response) {
        user.infos.connected = true;
        await getUserInfos();
        localStorage.setItem("user_authenticated", "true");
        message.success("Authentification réussie. Bienvenue " + user.infos.me?.first_name);
        return true;
      }
    } catch (error) {
      localStorage.removeItem("user_authenticated");
      message.error("Identifiants incorrects");
      console.error("Authentication failed:", error);
      return false;
    }
  }

  async function refreshSession() {
    if (localStorage.getItem("user_authenticated")) {
      try {
        await directus.refresh();
        user.infos.connected = true;
        await getUserInfos();
      } catch (error) {
        await logout(true);
        message.error(
          "Votre session a expiré ou rencontré une erreur." +
            "Veuillez vous reconnecter pour continuer"
        );
        console.error("Your session has expired or encountered an error:", error);
      }
    }
  }

  async function logout(inError = false) {
    if (!inError) {
      await directus.logout();
    }
    localStorage.removeItem("user_authenticated");
    user.infos.connected = false;
    user.infos.me = null;
    message.info("À bientôt ! Vous êtes maintenant déconnecté");
    return true;
  }

  async function register(email: string, password: string, firstName: string) {
    try {
      await directus.request(
        registerUser(email, password, {
          first_name: firstName,
        })
      );

      message.info(CONFIRMATION_TEXT, {
        duration: 5000,
      });
      return true;
    } catch (error) {
      message.error("Une erreur est survenue lors de l'inscription");
      console.error("Signup failed:", error);
      return false;
    }
  }

  return {
    login,
    refreshSession,
    logout,
    register,
  };
});
