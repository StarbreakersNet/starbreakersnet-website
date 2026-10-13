<script lang="ts" setup>
// L'application Bonjourr du site est le fork natif Vue/TypeScript du projet
// Bonjourr (demande du 26/10) : elle occupe l'encadré coloré du site, comme la
// vidéo YouTube et le widget Discord. L'iframe de l'application en ligne
// (online.bonjourr.fr) a vécu ; le fork est livré avec le site, hors ligne.
import AppContainer from "@/components/AppContainer.vue";
import BonjourrView from "@/views/BonjourrView.vue";
</script>

<template>
  <app-container loaded app="bonjourr">
    <BonjourrView />
  </app-container>
</template>
