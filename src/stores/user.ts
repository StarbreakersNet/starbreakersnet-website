import { defineStore } from "pinia";
import { ref } from "vue";
import { readLocalTheme } from "@/lib/localTheme";
import type { UserSettingsType, UserType } from "@/types/User";

export const useUserStore = defineStore("user", () => {
  const infos = ref({
    connected: false,
    me: null as UserType | null,
  });
  // Valeur locale au démarrage, remplacée par celle de la base à la connexion (stores/settings.ts)
  const settings = ref<UserSettingsType>({
    theme: readLocalTheme(),
  });

  return {
    infos,
    settings,
  };
});
