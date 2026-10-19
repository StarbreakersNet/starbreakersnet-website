<script lang="ts" setup>
import { MenuItem, menuItems } from "@/models/MenuItem";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { useRouter } from "vue-router";

const router = useRouter();

// Les items sont de vrais <a href> (parcours humain, y compris sans JS) ;
// la navigation interne reste une navigation SPA sans rechargement.
function hrefFor(item: MenuItem): string | undefined {
  if (item.routeName) {
    return router.resolve({ name: item.routeName }).href;
  }
  return item.externalLink;
}

function onClick(item: MenuItem, event: MouseEvent) {
  if (item.routeName) {
    event.preventDefault();
    router.push({ name: item.routeName });
  }
}
</script>

<template>
  <n-flex :size="30" align="center" class="component apple-blurred" justify="center">
    <div v-for="item in menuItems" :key="item.label" class="item">
      <n-button
        :color="item.color"
        :href="hrefFor(item)"
        :rel="item.externalLink ? 'noopener' : undefined"
        :tag="hrefFor(item) ? 'a' : 'button'"
        :target="item.externalLink ? '_blank' : undefined"
        :text-color="item.textColor ?? (item.color ? 'white' : '')"
        @click="onClick(item, $event)">
        <n-flex :size="10" align="center" justify="center" vertical>
          <FontAwesomeIcon v-if="item.icon" :icon="item.icon" class="fa-icon" />
          <span v-if="item.label" class="label">{{ item.label }}</span>
        </n-flex>
      </n-button>
    </div>
  </n-flex>
</template>

<style lang="sass" scoped>
@import @/assets/variables.sass

.component
  padding: 1em
  margin: unset

  .item
    button
      height: auto
      width: 15vw
      aspect-ratio: 16 / 9
      border-radius: $sn-apple-border-radius
      transition: transform .2s ease-in-out, box-shadow .2s ease-in-out
      padding: .5em 1em
      display: flex
      flex-direction: column
      align-items: center
      justify-content: center
      //background: rgb(255 255 255 / 0.1)
      box-shadow: 0 4px 6px rgb(0 0 0 / 0.1)

      &:hover
        transform: scale(1.05)
        box-shadow: 0 8px 12px rgb(0 0 0 / 0.2)

      &:active
        transform: scale(1)
        box-shadow: 0 4px 6px rgb(0 0 0 / 0.1)

      .fa-icon
        font-size: 3vw

      .label
        font-size: 1vw
        font-weight: bold
</style>
