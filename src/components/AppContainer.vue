<script lang="ts" setup>
import { computed } from "vue";
import { menuItems } from "@/models/MenuItem";
import _ from "lodash";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

const props = defineProps({
  app: {
    type: String,
  },
  loaded: {
    type: Boolean,
    default: false,
  },
});

const appFind = computed(() => {
  return _.find(menuItems, { routeName: props.app });
});
const icon = computed(() => appFind.value?.icon);
const componentStyle = {
  background: appFind.value?.color,
};
</script>

<template>
  <transition-group :style="componentStyle" class="app-container" tag="div">
    <div v-if="!props.loaded" key="icon" class="icon-wrapper">
      <font-awesome-icon :icon="icon ?? 'user'" class="icon" />
    </div>
    <div v-show="props.loaded" key="app" class="app-wrapper">
      <slot name="default" />
    </div>
  </transition-group>
</template>

<style lang="sass" scoped>
@use "@/assets/variables"

.app-container
  position: relative
  width: 100%
  display: flex
  align-items: center
  justify-content: center
  border-radius: variables.$sn-apple-border-radius
  overflow: clip
  padding: 3px

  .app-wrapper
    width: 100%
    height: 100%
    display: flex
    align-items: center
    justify-content: center

  .icon-wrapper
    position: absolute
    top: 0
    right: 0
    bottom: 0
    left: 0
    display: flex
    align-items: center
    justify-content: center

    .icon
      font-size: 10vmin
      color: white
</style>
