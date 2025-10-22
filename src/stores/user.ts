import { defineStore } from "pinia";
import { ref } from "vue";
import { authentication, createDirectus, readMe, registerUser, rest } from "@directus/sdk";
import { useRouter } from "vue-router";
import { useMessage } from "naive-ui";

export interface UserType {
  appearance: string | null;
  auth_data: string | null;
  avatar: string | null;
  description: string | null;
  email: string | null;
  email_notifications: boolean;
  external_identifier: any | null;
  first_name: string | null;
  id: string | null;
  language: string | null;
  last_access: string | null;
  last_name: string | null;
  last_page: string | null;
  location: string | null;
  password: string | null;
  provider: string | null;
  role: string | null;
  status: string | null;
  tags: string | null;
  tfa_secret: any | null;
  theme_dark: any | null;
  theme_dark_overrides: any | null;
  theme_light: any | null;
  theme_light_overrides: any | null;
  title: string | null;
  token: string | null;
}

const CONFIRMATION_TEXT =
  "Merci de votre inscription ! Consultez vos emails et cliquez sur le lien de confirmation pour vous connecter";

export const useUserStore = defineStore("user", () => {
  const router = useRouter();
  const message = useMessage();
  const directus = createDirectus(import.meta.env.VITE_API_URL)
    .with(
      authentication("cookie", {
        credentials: "include",
        autoRefresh: true,
      })
    )
    .with(rest({ credentials: "include" }));

  const infos = ref({
    connected: false,
    me: null as UserType | null,
  });
  const settings = ref({
    theme: "dark",
  });

  async function getUserInfos() {
    if (infos.value.connected) {
      infos.value.me = (await directus.request(readMe())) as UserType;
    } else {
      // TODO: Ajouter une fonction toast/message pour afficher les erreurs globales
      console.error("You are not connected");
    }
  }

  async function login(email: string, password: string) {
    try {
      const response = await directus.login(email, password);
      if (response) {
        infos.value.me = (await directus.request(readMe())) as UserType;
        infos.value.connected = true;
        localStorage.setItem("user_authenticated", "true");
        message.success("Authentification réussie. Bienvenue " + infos.value.me.first_name);
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
        infos.value.connected = true;
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
    infos.value.connected = false;
    infos.value.me = null;
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
    infos,
    settings,
    login,
    refreshSession,
    logout,
    register,
  };
});
