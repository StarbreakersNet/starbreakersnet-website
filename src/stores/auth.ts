import { defineStore } from "pinia";
import { createClient } from "@supabase/supabase-js";
import { useMessage } from "@/composables/useMessage";
import { useUserStore } from "@/stores/user";
import type { UserType } from "@/types/User";

const CONFIRMATION_TEXT =
  "Merci de votre inscription ! Consultez vos emails et cliquez sur le lien de confirmation pour vous connecter";

const supabase = createClient(
  import.meta.env.VITE_API_URL,
  import.meta.env.VITE_API_ANON_KEY
);

export const useAuthStore = defineStore("auth", () => {
  const user = useUserStore();
  const message = useMessage();

  async function getUserInfos() {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      user.infos.connected = false;
      user.infos.me = null;
      return;
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authUser.id)
      .single();

    if (error) {
      message.error("Impossible de récupérer les informations du compte");
      return;
    }

    user.infos.connected = true;
    user.infos.me = {
      id: authUser.id,
      username: profile.username,
      email: authUser.email ?? null,
      firstName: profile.first_name,
      lastName: profile.last_name,
    };
  }

  async function login(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      message.error("Email ou mot de passe incorrect");
      return false;
    }

    await getUserInfos();
    return true;
  }

  async function refreshSession() {
    const { data } = await supabase.auth.getSession();

    if (data.session) {
      await getUserInfos();
    }
  }

  async function refreshData() {
    if (user.infos.connected) {
      await getUserInfos();
    }
  }

  async function logout(inError = false) {
    await supabase.auth.signOut();

    user.infos.connected = false;
    user.infos.me = null;

    if (inError) {
      message.error("Votre session a expiré, veuillez vous reconnecter");
    }
  }

  async function register(email: string, password: string, username: string) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
      },
    });

    if (error) {
      message.error("Impossible de créer le compte");
      return false;
    }

    message.success(CONFIRMATION_TEXT);
    return true;
  }

  async function update(updatedUser: UserType) {
    if (!user.infos.me) {
      return false;
    }

    if (updatedUser.email && updatedUser.email !== user.infos.me.email) {
      const { error } = await supabase.auth.updateUser({ email: updatedUser.email });

      if (error) {
        message.error("Impossible de mettre à jour l'email");
        return false;
      }
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        username: updatedUser.username,
        first_name: updatedUser.firstName,
        last_name: updatedUser.lastName,
      })
      .eq("id", user.infos.me.id);

    if (error) {
      message.error("Impossible de mettre à jour le compte");
      return false;
    }

    return true;
  }

  async function updatePassword(oldPassword: string, newPassword: string) {
    if (!user.infos.me?.email) {
      return false;
    }

    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.infos.me.email,
      password: oldPassword,
    });

    if (verifyError) {
      message.error("Ancien mot de passe incorrect");
      return false;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      message.error("Impossible de mettre à jour le mot de passe");
      return false;
    }

    message.success("Mot de passe mis à jour");
    return true;
  }

  supabase.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_OUT") {
      user.infos.connected = false;
      user.infos.me = null;
    } else if (
      event === "SIGNED_IN" ||
      event === "TOKEN_REFRESHED" ||
      event === "INITIAL_SESSION"
    ) {
      getUserInfos();
    }
  });

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
