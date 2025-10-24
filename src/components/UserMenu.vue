<script setup>
import TimeClock from "@/components/TimeClock.vue";
import { computed, h, ref } from "vue";
import AppVersion from "@/components/AppVersion.vue";
import { version } from "@/../package.json";
import router from "@/router/index.js";
import LoginView from "@/views/LoginView.vue";
import { useAuthStore } from "@/stores/auth.ts";
import { useUserStore } from "@/stores/user.ts";
import { renderNaiveFontAwesomeIcon } from "@/composables/fontAwesomeUtils.ts";

const auth = useAuthStore();
const user = useUserStore();
const packageVersion = ref(version);
const options = computed(() => {
  let items = [];

  if (user.infos.connected) {
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
    label: "À propos",
    key: "about",
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
const showLoginModal = ref(false);

function handleSelect(key) {
  switch (key) {
    case "login":
      showLoginModal.value = true;
      break;
    case "logout":
      auth.logout();
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
            sur Discord ou le GitLab.
          </n-text>
          <n-text code>
            <p>Version {{ packageVersion }} © 2024</p>
          </n-text>
        </n-flex>
      </template>
    </n-modal>
    <n-modal
      v-model:show="showLoginModal"
      :icon="() => renderNaiveFontAwesomeIcon({ fas: 'user' })"
      class="apple-menu"
      preset="dialog"
      transform-origin="center">
      <template #default>
        <login-view @connected="showLoginModal = false" />
      </template>
    </n-modal>
  </div>
</template>

<style lang="sass">
@use "@/assets/variables"

.apple-container
  &.n-dropdown-menu:not(.n-dropdown-menu--scrollable)
    padding: variables.$sn-main-padding
    border-radius: variables.$sn-apple-border-radius
</style>
