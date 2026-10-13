import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueDevTools from "vite-plugin-vue-devtools";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  server: {
    host: true,
    port: 5173,
    watch: {
      // tests/ n'est pas importé par l'application : le surveiller fait planter
      // le serveur de dev en EBUSY sur Windows dès qu'un outil y écrit (piège
      // relevé trois sessions de suite).
      ignored: ["**/tests/**"],
    },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "happy-dom",
    include: ["tests/**/*.spec.{js,ts}"],
  },
});
