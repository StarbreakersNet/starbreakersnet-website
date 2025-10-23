import { defineStore } from "pinia";
import { ref } from "vue";
import { UserType } from "@/types/User";

export const useUserStore = defineStore("user", () => {
  const infos = ref({
    connected: false,
    me: null as UserType | null,
  });
  const settings = ref({
    theme: "dark",
  });

  return {
    infos,
    settings,
  };
});
