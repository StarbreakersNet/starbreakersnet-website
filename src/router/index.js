import { createRouter, createWebHistory } from "vue-router";
import HomeView from "@/views/HomeView.vue";
import ViewerDiscord from "@/components/ViewerDiscord.vue";
import ViewerYoutube from "@/components/ViewerYoutube.vue";
import AccountView from "@/views/AccountView.vue";
import { useAuthStore } from "@/stores/auth.ts";
import { useUserStore } from "@/stores/user.ts";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: HomeView,
    },
    {
      // Buroh, page d'accueil à widgets
      path: "/buroh",
      name: "buroh",
      component: () => import("@/views/BurohView.vue"),
    },
    {
      path: "/discord",
      name: "discord",
      component: ViewerDiscord,
    },
    {
      path: "/youtube",
      name: "youtube",
      component: ViewerYoutube,
    },
    {
      path: "/mentions-legales",
      name: "legal",
      component: () => import("@/views/LegalView.vue"),
    },
    {
      path: "/account",
      name: "account",
      component: AccountView,
      meta: { requiresAuth: true },
    },
    {
      // Cible du lien envoyé par resetPasswordForEmail (voir stores/auth.ts)
      path: "/reset-password",
      name: "reset-password",
      component: () => import("@/views/ResetPasswordView.vue"),
    },
    {
      // Toute adresse inconnue (doit rester la dernière route)
      path: "/:pathMatch(.*)*",
      name: "not-found",
      component: () => import("@/views/NotFoundView.vue"),
    },
  ],
});

router.beforeEach(async to => {
  // On attend de connaître la session initiale avant toute navigation (loader affiché par AppLayout)
  await useAuthStore().whenReady();

  // Route protégée sans session : retour à l'accueil avec la modale de connexion ouverte,
  // puis retour sur la route demandée une fois connecté (voir UserMenu.vue)
  if (to.meta.requiresAuth && !useUserStore().infos.connected) {
    return { name: "home", query: { login: "1", redirect: to.fullPath } };
  }
});

export default router;
