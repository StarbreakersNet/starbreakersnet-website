import { preferedOsTheme } from "@/composables/appUtils";
import type { ThemeType } from "@/types/User";

const STORAGE_KEY = "theme";

// Thème des visiteurs (et dernier thème utilisé) : localStorage, sinon préférence du système
export function readLocalTheme(): ThemeType {
  try {
    const value = localStorage.getItem(STORAGE_KEY);

    if (value === "dark" || value === "light") {
      return value;
    }
  } catch {
    // Stockage indisponible (navigation privée stricte…) : préférence du système
  }

  return preferedOsTheme();
}

export function writeLocalTheme(theme: ThemeType) {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Pas de persistance locale possible, le thème reste valable pour la session
  }
}
