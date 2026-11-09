<script setup>
import TimeClock from "@/components/TimeClock.vue";
import { computed, h, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import AppVersion from "@/components/AppVersion.vue";
import { version } from "@/../package.json";
import LoginView from "@/views/LoginView.vue";
import HModal from "@/components/c/hModal.vue";
import { useAuthStore } from "@/stores/auth.ts";
import { useUserStore } from "@/stores/user.ts";
import { useSettingsStore } from "@/stores/settings.ts";
import { renderNaiveFontAwesomeIcon } from "@/composables/fontAwesomeUtils.ts";
import { formatUserTag } from "@/lib/userTag.ts";

const auth = useAuthStore();
const user = useUserStore();
const settings = useSettingsStore();
const route = useRoute();
const router = useRouter();
const packageVersion = ref(version);
const currentYear = new Date().getFullYear();
const options = computed(() => {
  const items = [];
  const me = user.infos.me;

  if (user.infos.connected) {
    // Membre connecté, en tête du menu : « Renard#0421 »
    if (me) {
      items.push({
        key: "identity",
        type: "render",
        render: () =>
          h("div", { class: "user-identity" }, [
            h("span", { class: "username" }, me.username),
            h("span", { class: "tag" }, formatUserTag(me.tag)),
          ]),
      });
      items.push({ key: "identity-divider", type: "divider" });
    }
    items.push({
      label: "Mon compte",
      key: "account",
    });
    items.push({
      label: "Se déconnecter",
      key: "logout",
    });
  } else {
    items.push({
      label: "Se connecter",
      key: "login",
    });
  }

  items.push({
    label: user.settings.theme === "dark" ? "Thème clair" : "Thème sombre",
    key: "theme",
  });

  items.push({
    label: "À propos",
    key: "about",
  });

  items.push({
    label: "Mentions légales",
    key: "legal",
  });

  items.push({
    key: "version",
    type: "render",
    render: () => {
      return h(AppVersion);
    },
  });

  return items;
});
const showModal = ref(false);

// La modale de connexion est pilotée par l'URL (?login=1&redirect=/account) :
// le guard du router peut l'ouvrir, et le bouton « précédent » la referme.
const showLoginModal = computed(() => route.query.login === "1");

function getRedirect() {
  const redirect = route.query.redirect;

  // Uniquement un chemin interne, pour éviter une redirection vers un autre site
  if (typeof redirect === "string" && redirect.startsWith("/") && !redirect.startsWith("//")) {
    return redirect;
  }
  return null;
}

function openLoginModal() {
  router.push({ query: { ...route.query, login: "1" } });
}

function closeLoginModal() {
  const query = { ...route.query };
  delete query.login;
  delete query.redirect;
  router.replace({ query });
}

function handleConnected() {
  const redirect = getRedirect();

  if (redirect) {
    router.replace(redirect);
  } else {
    closeLoginModal();
  }
}

function handleSelect(key) {
  switch (key) {
    case "login":
      openLoginModal();
      break;
    case "logout":
      auth.logout();
      break;
    case "theme":
      settings.toggleTheme();
      break;
    case "about":
      showModal.value = true;
      break;
    default:
      router.push({ name: key });
  }
}
</script>

<template>
  <div>
    <n-flex key="menu" :size="0" align="center" class="apple-container">
      <transition-group name="insert">
        <n-tag key="icon" :bordered="false" :color="{ color: 'transparent' }" round>
          <n-flex align="center">
            <time-clock key="time" />
          </n-flex>
        </n-tag>
        <div key="menu">
          <n-dropdown
            :options="options"
            class="apple-container"
            trigger="click"
            @select="handleSelect($event)">
            <n-button :bordered="false" round>
              <n-flex align="center">
                <transition mode="out-in" name="scale">
                  <font-awesome-icon
                    v-if="user.infos.connected"
                    key="icon-user-circle"
                    icon="user-circle" />
                  <font-awesome-icon v-else key="icon-bars" icon="bars" />
                </transition>
              </n-flex>
            </n-button>
          </n-dropdown>
        </div>
      </transition-group>
    </n-flex>
    <n-modal
      v-model:show="showModal"
      :closable="false"
      :show-icon="false"
      class="apple-menu"
      preset="dialog"
      transform-origin="center">
      <template #default>
        <n-flex align="center" justify="center" vertical>
          <n-h4>Portail des Starbreakers</n-h4>
          <n-text>
            Actuellement un simple site vitrine mais comme il s'agit d'un grand terrain de jeu pour
            votre renard, le site s'agrémentera de pleins de belles choses au fil du temps.
          </n-text>
          <n-text>
            Si vous êtes intéressé pour participer au développement, n'hésitez pas à contacter
            <n-text strong type="info">TheRedfoox</n-text>
            sur Discord ou à passer sur notre
            <n-a href="https://github.com/StarbreakersNet" target="_blank">GitHub</n-a>
          </n-text>
          <n-text code>
            <p>Version {{ packageVersion }} © 2024–{{ currentYear }}</p>
          </n-text>
        </n-flex>
      </template>
    </n-modal>
    <h-modal
      :icon="() => renderNaiveFontAwesomeIcon({ fas: 'user' })"
      :show="showLoginModal"
      class="apple-menu"
      preset="dialog"
      title="Connexion"
      transform-origin="center"
      @update:show="!$event && closeLoginModal()">
      <template #default>
        <login-view @connected="handleConnected()" />
      </template>
    </h-modal>
  </div>
</template>

<style lang="scss">
@use "@/assets/variables";

.apple-container {
  &.n-dropdown-menu:not(.n-dropdown-menu--scrollable) {
    padding: variables.$sn-main-padding;
    border-radius: variables.$sn-apple-border-radius;
  }

  .user-identity {
    padding: 0.25em 0.75em;
    font-weight: 500;

    .tag {
      margin-left: 0.15em;
      opacity: 0.6;
    }
  }
}
</style>
