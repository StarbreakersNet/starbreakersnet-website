import { defineStore } from "pinia";
import { ref } from "vue";
import {
  type AuthChangeEvent,
  isAuthRetryableFetchError,
  type Session,
  type User,
} from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import { getAuthErrorMessage } from "@/lib/authErrors";
import { APP_LOCALE } from "@/lib/locale";
import { useMessage } from "@/composables/useMessage";
import { useUserStore } from "@/stores/user";
import { useSettingsStore } from "@/stores/settings";
import type { UserType } from "@/types/User";

type ProfileUpdate = Pick<UserType, "username" | "firstName" | "lastName">;

const CONFIRMATION_TEXT =
  "Merci de votre inscription ! Consultez vos emails et cliquez sur le lien de confirmation pour vous connecter";
const CONFIRMATION_DURATION = 10000;
// Message identique que le compte existe ou non, pour ne pas révéler quels emails sont inscrits
const PASSWORD_RESET_TEXT =
  "Si un compte existe avec cette adresse, un email contenant un lien de réinitialisation vient d'être envoyé";

export const useAuthStore = defineStore("auth", () => {
  const user = useUserStore();
  const settings = useSettingsStore();
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

  // Vrai quand l'utilisateur arrive par le lien de réinitialisation du mot de passe
  const passwordRecovery = ref(false);

  let pendingLoad: { id: string; promise: Promise<void> } | null = null;

  function clearUser() {
    pendingLoad = null;
    passwordRecovery.value = false;
    user.infos.connected = false;
    user.infos.me = null;
  }

  async function fetchUser(authUser: User) {
    const [{ data: profile, error }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", authUser.id).single(),
      settings.load(authUser.id),
    ]);

    user.infos.connected = true;

    if (error) {
      message.error("Impossible de récupérer les informations du compte");
      return;
    }

    user.infos.me = toUser(authUser, profile);
  }

  function toUser(
    authUser: User,
    profile: { username: string; first_name: string | null; last_name: string | null }
  ): UserType {
    return {
      id: authUser.id,
      username: profile.username,
      email: authUser.email ?? null,
      pendingEmail: authUser.new_email ?? null,
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

  // Email modifié ailleurs (lien de confirmation ouvert dans un autre onglet) : profil à recharger
  function isEmailStale(authUser: User) {
    const me = user.infos.me;

    return (
      !!me &&
      me.id === authUser.id &&
      (me.email !== (authUser.email ?? null) || me.pendingEmail !== (authUser.new_email ?? null))
    );
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
          await loadUser(session.user, isEmailStale(session.user));
        }
        break;
      case "PASSWORD_RECOVERY":
        passwordRecovery.value = true;
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

  async function logout() {
    await supabase.auth.signOut();
    clearUser();
  }

  async function register(email: string, password: string, username: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // username et theme : repris par les triggers d'inscription (profil et paramètres).
        // locale : langue des mails envoyés par GoTrue (supabase/templates).
        data: { username, theme: user.settings.theme, locale: APP_LOCALE },
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

  async function updateProfile(profile: ProfileUpdate) {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return false;
    }

    const { data, error } = await supabase
      .from("profiles")
      .update({
        username: profile.username,
        first_name: profile.firstName || null,
        last_name: profile.lastName || null,
      })
      .eq("id", session.user.id)
      .select()
      .single();

    if (error) {
      message.error("Impossible de mettre à jour le profil");
      return false;
    }

    user.infos.me = toUser(session.user, data);
    return true;
  }

  // Double confirmation active (GOTRUE_MAILER_SECURE_EMAIL_CHANGE_ENABLED par défaut) : le changement
  // n'est effectif qu'une fois les liens envoyés à l'ancienne et à la nouvelle adresse validés.
  async function updateEmail(email: string) {
    const { error } = await supabase.auth.updateUser(
      { email },
      { emailRedirectTo: `${window.location.origin}/account` }
    );

    if (error) {
      message.error(getAuthErrorMessage(error, "Impossible de modifier l'adresse email"));
      return false;
    }

    return true;
  }

  async function updatePassword(currentPassword: string, newPassword: string) {
    if (!user.infos.me?.email) {
      return false;
    }

    // Vérifie le mot de passe actuel en se reconnectant avec
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.infos.me.email,
      password: currentPassword,
    });

    if (verifyError) {
      const text =
        verifyError.code === "invalid_credentials"
          ? "Mot de passe actuel incorrect"
          : getAuthErrorMessage(verifyError, "Impossible de vérifier le mot de passe actuel");
      message.error(text);
      return false;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      message.error(getAuthErrorMessage(error, "Impossible de modifier le mot de passe"));
      return false;
    }

    return true;
  }

  async function requestPasswordReset(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    // Seules les erreurs qui ne dépendent pas de l'existence du compte sont affichées
    // (réseau, limite de requêtes par IP). Les autres (limite d'envoi par utilisateur,
    // échec SMTP…) révéleraient que l'adresse est inscrite.
    if (error && (isAuthRetryableFetchError(error) || error.code === "over_request_rate_limit")) {
      message.error(getAuthErrorMessage(error, "Impossible d'envoyer l'email"));
      return false;
    }

    if (error) {
      console.warn("resetPasswordForEmail", error);
    }

    message.info(PASSWORD_RESET_TEXT, { duration: CONFIRMATION_DURATION });
    return true;
  }

  async function resetPassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      message.error(getAuthErrorMessage(error, "Impossible de modifier le mot de passe"));
      return false;
    }

    passwordRecovery.value = false;
    return true;
  }

  return {
    isReady,
    passwordRecovery,
    whenReady,
    login,
    logout,
    register,
    updateProfile,
    updateEmail,
    updatePassword,
    requestPasswordReset,
    resetPassword,
  };
});
