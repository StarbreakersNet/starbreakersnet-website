import type { FormItemRule } from "naive-ui";

// Doit rester aligné avec GOTRUE_PASSWORD_MIN_LENGTH et GOTRUE_PASSWORD_REQUIRED_CHARACTERS
// (docker-compose.yml) : c'est GoTrue qui fait foi, ces règles évitent juste un aller-retour.
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_HINT = `au moins ${PASSWORD_MIN_LENGTH} caractères, dont une minuscule, une majuscule et un chiffre`;

// Doit rester aligné avec public.is_valid_username (supabase/migrations) : c'est la base qui fait foi
export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 32;

type Value = string | null | undefined;

export function checkUsername(value: Value): Error | true {
  if (!value) {
    return new Error("Un nom d'utilisateur est requis");
  } else if (value.length < USERNAME_MIN_LENGTH) {
    return new Error(`Doit contenir au moins ${USERNAME_MIN_LENGTH} caractères`);
  } else if (value.length > USERNAME_MAX_LENGTH) {
    return new Error(`Doit contenir au plus ${USERNAME_MAX_LENGTH} caractères`);
  } else if (/[^a-zA-Z0-9]/.test(value)) {
    return new Error("Ne doit pas contenir de caractères spéciaux");
  }
  return true;
}

export function checkEmail(value: Value): Error | true {
  if (!value) {
    return new Error("Une adresse email est requise");
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return new Error("Veuillez entrer une adresse email valide");
  }
  return true;
}

export function checkPassword(value: Value): Error | true {
  if (!value) {
    return new Error("Un mot de passe est requis");
  } else if (value.length < PASSWORD_MIN_LENGTH) {
    return new Error(`Doit contenir au moins ${PASSWORD_MIN_LENGTH} caractères`);
  } else if (!/[a-z]/.test(value)) {
    return new Error("Doit contenir au moins une minuscule");
  } else if (!/[A-Z]/.test(value)) {
    return new Error("Doit contenir au moins une majuscule");
  } else if (!/\d/.test(value)) {
    return new Error("Doit contenir au moins un chiffre");
  }
  return true;
}

const TRIGGER = ["input", "blur"];

export const usernameRule: FormItemRule = {
  required: true,
  trigger: TRIGGER,
  validator: (_rule, value: Value) => checkUsername(value),
};

export const emailRule: FormItemRule = {
  required: true,
  trigger: TRIGGER,
  validator: (_rule, value: Value) => checkEmail(value),
};

export const passwordRule: FormItemRule = {
  required: true,
  trigger: TRIGGER,
  validator: (_rule, value: Value) => checkPassword(value),
};

// Confirmation : doit être identique à la valeur renvoyée par getPassword
export function passwordConfirmationRule(getPassword: () => Value): FormItemRule {
  return {
    required: true,
    trigger: TRIGGER,
    validator: (_rule, value: Value) => {
      if (!value) {
        return new Error("Veuillez confirmer le mot de passe");
      } else if (value !== getPassword()) {
        return new Error("Les mots de passe ne correspondent pas");
      }
      return true;
    },
  };
}
