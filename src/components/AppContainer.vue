<script lang="ts" setup>
import { computed } from "vue";
import { MENU_ITEMS } from "@/models/MenuItem";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

const { app, loaded = false } = defineProps<{
  app?: string;
  loaded?: boolean;
}>();

const appFind = computed(() => {
  return MENU_ITEMS.find(item => item.routeName === app);
});
const icon = computed(() => appFind.value?.icon);
const componentStyle = {
  background: appFind.value?.color,
};
</script>

<template>
  <transition-group :style="componentStyle" class="app-container" tag="div">
    <div v-if="!loaded" key="icon" class="icon-wrapper">
      <font-awesome-icon :icon="icon ?? 'user'" class="icon" />
    </div>
    <div v-show="loaded" key="app" class="app-wrapper">
      <slot name="default" />
    </div>
  </transition-group>
</template>

<style lang="scss" scoped>
@use "@/assets/variables";

.app-container {
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: variables.$sn-apple-border-radius;
  overflow: clip;
  padding: 3px;

  .app-wrapper {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .icon-wrapper {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    display: flex;
    align-items: center;
    justify-content: center;

    .icon {
      font-size: 10vmin;
      color: white;
    }
  }
}
</style>
