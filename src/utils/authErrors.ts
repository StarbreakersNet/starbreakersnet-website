import { type AuthError, isAuthRetryableFetchError } from "@supabase/supabase-js";
import { PASSWORD_HINT } from "@/utils/validation";

// Traduit les erreurs GoTrue en messages compréhensibles.
// Codes : https://supabase.com/docs/guides/auth/debugging/error-codes
export function getAuthErrorMessage(error: AuthError, fallback: string): string {
  if (isAuthRetryableFetchError(error)) {
    return "Impossible de joindre le serveur, vérifiez votre connexion et réessayez";
  }

  switch (error.code) {
    case "user_already_exists":
    case "email_exists":
      return "Un compte existe déjà avec cette adresse email";
    case "weak_password":
      return `Mot de passe trop faible : ${PASSWORD_HINT}`;
    case "same_password":
      return "Le nouveau mot de passe doit être différent de l'actuel";
    case "invalid_credentials":
      return "Email ou mot de passe incorrect";
    case "email_not_confirmed":
      return "Adresse email non confirmée : cliquez sur le lien reçu par email";
    case "email_address_invalid":
      return "Adresse email invalide";
    case "signup_disabled":
      return "Les inscriptions sont fermées pour le moment";
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return "Trop de tentatives, veuillez réessayer dans quelques minutes";
  }

  if (error.status === 429) {
    return "Trop de tentatives, veuillez réessayer dans quelques minutes";
  }

  return fallback;
}
