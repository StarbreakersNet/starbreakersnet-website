import naive from "naive-ui";
import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "@/App.vue";
import router from "@/router";
import VueParticles from "@tsparticles/vue3";
import { loadSlim } from "@tsparticles/slim";
import "@/lib/icons";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import "@/assets/main.scss";
import "@/assets/tailwind.css";

const app = createApp(App);

app.use(naive);
app.use(createPinia());
app.use(router);
app.use(VueParticles, {
  init: async engine => {
    await loadSlim(engine);
  }
});
app.component("FontAwesomeIcon", FontAwesomeIcon);

app.mount("#app");
