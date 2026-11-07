import { createRouter, createWebHistory } from "vue-router";
import HomeView from "@/views/HomeView.vue";
import ViewerDiscord from "@/components/ViewerDiscord.vue";
import ViewerYoutube from "@/components/ViewerYoutube.vue";
import AccountView from "@/views/AccountView.vue";
import { useAuthStore } from "@/stores/auth.ts";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: HomeView,
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
      path: "/about",
      name: "about",
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import("@/views/AboutView.vue"),
    },
    {
      path: "/account",
      name: "account",
      component: AccountView,
    },
  ],
});

// On attend de connaître la session initiale avant toute navigation (loader affiché par AppLayout)
router.beforeEach(async () => {
  await useAuthStore().whenReady();
});

export default router;
