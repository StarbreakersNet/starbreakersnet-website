import { defineStore } from "pinia";
import { reactive } from "vue";

export const useUserStore = defineStore(
  "user",
  () => {
    const settings = reactive({
      theme: "dark",
    });

    return {
      settings,
    };
  },
  {
    persist: {
      paths: ["settings"],
    },
  }
);
