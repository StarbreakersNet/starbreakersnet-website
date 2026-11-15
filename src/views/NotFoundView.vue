<script lang="ts" setup>
import HCard from "@/components/c/hCard.vue";
import HButton from "@/components/c/hButton.vue";
import HResult from "@/components/c/hResult.vue";
import { useRouter } from "vue-router";

const router = useRouter();

function handleHomeClick() {
  router.push({ name: "home" });
}
</script>

<template>
  <h-card class="tw:max-w-xl tw:self-center">
    <h-result
      description="Cette page n'existe pas ou a été déplacée."
      status="404"
      title="Page introuvable">
      <template #footer>
        <h-button @click="handleHomeClick()">Retour à l'accueil</h-button>
      </template>
    </h-result>
  </h-card>
</template>
