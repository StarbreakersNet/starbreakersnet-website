<script lang="ts" setup>
// Case 20 — Ce composant ne rend rien : il applique les réglages visuels au
// document (thème, variables de page/police/ombre, @font-face, CSS, titre
// d'onglet, favicon, classes de masquage) et réagit à leurs changements, comme
// les appels de Bonjourr/src/scripts/index.ts l.74-93 au démarrage de la page.
import { onBeforeUnmount, onMounted, watch } from "vue";
import { applyVisuals } from "@/bonjourr/visuals";
import { useBonjourrStore } from "@/stores/bonjourr";

const settings = useBonjourrStore();

// `matchMedia('(prefers-color-scheme: dark)')` (others.ts l.75) et son écouteur
// `handleThemeChange` (l.114-121), qui ne rejoue le thème que pour « system ».
const media = typeof window.matchMedia === "function" ? window.matchMedia("(prefers-color-scheme: dark)") : null;

function apply() {
  applyVisuals(settings.config, {
    prefersDark: media?.matches === true,
    userAgent: navigator.userAgent,
  });
}

function onSchemeChange() {
  if (settings.config.dark === "system") {
    apply();
  }
}

onMounted(() => {
  apply();
  media?.addEventListener?.("change", onSchemeChange);
});

onBeforeUnmount(() => {
  media?.removeEventListener?.("change", onSchemeChange);
});

// Signature des seuls réglages vus par ce composant ; `flush: "post"` laisse le
// temps aux éléments masquables d'être dans le DOM avant le toggle de classe.
watch(
  () =>
    JSON.stringify([
      settings.config.dark,
      settings.config.favicon,
      settings.config.tabtitle,
      settings.config.pagegap,
      settings.config.pagewidth,
      settings.config.textShadow,
      settings.config.css,
      settings.config.hide,
      settings.config.font,
      settings.config.lang,
    ]),
  apply,
  { flush: "post" },
);
</script>

<template>
  <!-- Aucune sortie visible : le slot est toujours vide, il ne rend qu’un
       nœud commentaire (la règle vue/valid-template-root exige un enfant). -->
  <slot />
</template>

<style lang="sass">
// Règle de masquage de la source (_global.css l.234-238) : non scopée, elle vise
// les éléments portant `data-hide` où qu'ils soient dans la page (hide.ts l.19-21).
body .he_hidden
  display: none
</style>
