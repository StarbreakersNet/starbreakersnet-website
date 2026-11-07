import { defineStore } from "pinia";
import { ref } from "vue";
import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import { getAuthErrorMessage } from "@/lib/authErrors";
import { useMessage } from "@/composables/useMessage";
import { useUserStore } from "@/stores/user";
import type { UserType } from "@/types/User";

const CONFIRMATION_TEXT =
  "Merci de votre inscription ! Consultez vos emails et cliquez sur le lien de confirmation pour vous connecter";
const CONFIRMATION_DURATION = 10000;

export const useAuthStore = defineStore("auth", () => {
  const user = useUserStore();
  const message = useMessage();

  // Passe à true quand on sait s'il y a une session (et que le profil est chargé s'il y en a une)
  const isReady = ref(false);
  let resolveReady: () => void = () => {};
  const readyPromise = new Promise<void>(resolve => {
    resolveReady = resolve;
  });

  function whenReady() {
    return readyPromise;
  }

  let pendingLoad: { id: string; promise: Promise<void> } | null = null;

  function clearUser() {
    pendingLoad = null;
    user.infos.connected = false;
    user.infos.me = null;
  }

  async function fetchUser(authUser: User) {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authUser.id)
      .single();

    user.infos.connected = true;

    if (error) {
      message.error("Impossible de récupérer les informations du compte");
      return;
    }

    user.infos.me = {
      id: authUser.id,
      username: profile.username,
      email: authUser.email ?? null,
      firstName: profile.first_name,
      lastName: profile.last_name,
    };
  }

  // Charge le profil une seule fois par utilisateur, même si plusieurs événements arrivent en même temps
  function loadUser(authUser: User, force = false): Promise<void> {
    if (!force) {
      if (pendingLoad?.id === authUser.id) {
        return pendingLoad.promise;
      }
      if (user.infos.me?.id === authUser.id) {
        return Promise.resolve();
      }
    }

    const promise = fetchUser(authUser).finally(() => {
      if (pendingLoad?.promise === promise) {
        pendingLoad = null;
      }
    });
    pendingLoad = { id: authUser.id, promise };

    return promise;
  }

  async function handleAuthChange(event: AuthChangeEvent, session: Session | null) {
    switch (event) {
      case "INITIAL_SESSION":
        if (session) {
          await loadUser(session.user);
        } else {
          clearUser();
        }
        isReady.value = true;
        resolveReady();
        break;
      case "SIGNED_IN":
      case "TOKEN_REFRESHED":
        if (session) {
          await loadUser(session.user);
        }
        break;
      case "USER_UPDATED":
        if (session) {
          await loadUser(session.user, true);
        }
        break;
      case "SIGNED_OUT":
        clearUser();
        break;
    }
  }

  // Seule source de vérité pour l'état de connexion. Le callback ne doit pas appeler Supabase
  // directement (risque d'interblocage, cf. doc de onAuthStateChange) : on diffère le traitement.
  supabase.auth.onAuthStateChange((event, session) => {
    setTimeout(() => handleAuthChange(event, session), 0);
  });

  async function login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      message.error(getAuthErrorMessage(error, "Email ou mot de passe incorrect"));
      return false;
    }

    await loadUser(data.user);
    message.success("Vous êtes connecté");
    return true;
  }

  async function refreshData() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session) {
      await loadUser(session.user, true);
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    clearUser();
  }

  async function register(email: string, password: string, username: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
      },
    });

    if (error) {
      message.error(getAuthErrorMessage(error, "Impossible de créer le compte"));
      return false;
    }

    // Confirmation d'email désactivée (autoconfirm en local) : GoTrue renvoie directement une session.
    // Sinon, pas de session : l'utilisateur doit cliquer sur le lien reçu par email. GoTrue répond
    // de la même façon si l'email est déjà inscrit, pour ne pas révéler quels comptes existent.
    if (data.session) {
      await loadUser(data.session.user);
      message.success("Bienvenue ! Votre compte est créé et vous êtes connecté");
    } else {
      message.success(CONFIRMATION_TEXT, { duration: CONFIRMATION_DURATION });
    }

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

  return {
    isReady,
    whenReady,
    login,
    refreshData,
    logout,
    register,
    update,
    updatePassword,
  };
});
