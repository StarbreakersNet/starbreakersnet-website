<script lang="ts" setup>
import { useRouter } from "vue-router";

const router = useRouter();

const routes = [
  { name: "home", label: "Accueil" },
  { name: "discord", label: "Discord" },
  { name: "youtube", label: "Le Zap" },
];
</script>

<template>
  <n-flex align="center" justify="center" class="component">
    <div v-for="route in routes" class="item">
      <router-link :to="{name: route.name}">
        <n-button>
          {{ route.label }}
        </n-button>
      </router-link>

    </div>
  </n-flex>
</template>

<style lang="sass" scoped>
@import @/assets/variables.sass

.component
  padding: 1em
  margin: unset
  border: 1px solid rgba(255, 255, 255, 0.18)
  border-radius: 16px
  background: rgba(83, 83, 83, 0.25)
  backdrop-filter: blur(13px)

  .item
    padding: 1em .75em

    button
      width: 10em
      aspect-ratio: 16 / 9
      border-radius: $sn-main-border-radius
      transition: transform .1s ease-in-out

      &:hover
        transform: scale(1.1)

      &:active
        transform: scale(1)

</style>