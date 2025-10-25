import naive from "naive-ui";
import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "@/App.vue";
import router from "@/router";
import VueParticles from "@tsparticles/vue3";
import { loadSlim } from "@tsparticles/slim";
import { library } from "@fortawesome/fontawesome-svg-core";
import { fab } from "@fortawesome/free-brands-svg-icons";
import { far } from "@fortawesome/free-regular-svg-icons";
import { fas } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import "@/assets/main.scss";
import "@/assets/tailwind.css";

const app = createApp(App);

library.add(fas);
library.add(far);
library.add(fab);

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
