import { defineStore } from "pinia";
import { supabase } from "@/utils/supabaseClient";
import { writeLocalTheme } from "@/utils/localTheme";
import { useMessage } from "@/composables/useMessage";
import { useUserStore } from "@/stores/user";
import type { ThemeType } from "@/types/User";

// Paramètres utilisateur (table public.user_settings) : la valeur en base l'emporte à la connexion,
// la copie locale sert aux visiteurs et au premier affichage.
export const useSettingsStore = defineStore("settings", () => {
  const user = useUserStore();
  const message = useMessage();

  function applyTheme(theme: ThemeType) {
    user.settings.theme = theme;
    writeLocalTheme(theme);
  }

  async function load(userId: string) {
    const { data, error } = await supabase
      .from("user_settings")
      .select("theme")
      .eq("user_id", userId)
      .maybeSingle();

    // En cas d'erreur, on garde simplement la valeur locale
    if (!error && data) {
      applyTheme(data.theme);
    }
  }

  async function setTheme(theme: ThemeType) {
    applyTheme(theme);

    const userId = user.infos.me?.id;

    if (!userId) {
      return;
    }

    const { error } = await supabase.from("user_settings").update({ theme }).eq("user_id", userId);

    if (error) {
      message.error("Impossible d'enregistrer le thème sur votre compte");
    }
  }

  function toggleTheme() {
    return setTheme(user.settings.theme === "dark" ? "light" : "dark");
  }

  return {
    load,
    setTheme,
    toggleTheme,
  };
});
