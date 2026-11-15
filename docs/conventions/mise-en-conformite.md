# Mise en conformité de l'existant

Les règles ont été adoptées en novembre 2026. Le formatage (Prettier), l'ordre des blocs et des macros, les `<style>` vides et les extensions `.ts` des imports sont déjà appliqués partout, `useLoader` est corrigé et le lint ne relève plus aucune erreur. Le reste se fait dans une PR dédiée. D'ici là, le lint signale ces écarts en **avertissement** :

- [x] Props typées et déstructurées : 56 composants (`vue/define-props-declaration`, `vue/define-props-destructuring`)
- [x] Événements typés : 26 composants (`vue/define-emits-declaration`)
- [x] Wrappers : `extends /* @vue-ignore */`, `inheritAttrs: false`, relais générique des slots, `defineSlots` quand Naive exporte le type. `hButton` en particulier : il lit `attrs` dans un `computed` et ignore la prop `themeOverrides` du parent. Sa nouvelle version est déjà validée (typage, lint, rendu) : l'exemple « Wrapper avec props maison » de [wrappers.md](wrappers.md), plus `tooltip`, `tooltipPosition`, `target` et l'interception du `click`, avec l'infobulle en `v-if` / `v-else`. Reste à essayer le clic et l'infobulle dans le navigateur
- [x] Composants `n-*` hors wrappers dans 12 fichiers (`vue/no-undef-components`). Il faudra créer les wrappers qui manquent : `n-a`, `n-spin`, `n-h1`/`n-h4`, `n-ul`/`n-li`, `n-descriptions`/`n-descriptions-item`, `n-result`, `n-carousel`, `n-float-button`/`n-float-button-group`
- [x] Indicateurs de chargement : remplacer par `useLoader()` et `run()` les 13 `ref(false)` passés à `true` puis à `false` : 7 dans les vues (`AccountView`, `ForgotPasswordView`, `LoginView`, `RegisterView`, `ResetPasswordView`) et 6 dans les widgets (`WallpaperModal`, `WeatherSettingsForm`)
- [x] `useTemplateRef` (7), refs inutilisées (3), fonctions fléchées (4)
- [x] Sorties anticipées : 10 `return;` vides dans `AccountView`, `LoginView`, `composables/useFitContent.ts`, `stores/auth.ts` et `stores/settings.ts` (`no-restricted-syntax`), et 2 `continue` dans `models/widgets.ts` (`no-continue`). Dans `hForm`, `computeIsValidSilently` a un `continue` et 5 niveaux d'imbrication (`no-continue`, `max-depth`)
- [x] JavaScript vers TypeScript : `main.js` et `router/index.js`
- [x] Rangement : supprimer `stores/counter.js` (reste du scaffold Vue) ; déplacer `stores/MimicBackend.ts` (pas un store), `composables/appUtils.ts` et `composables/fontAwesomeUtils.ts` (pas des composables) dans `utils/`, en découpant `appUtils.ts` par sujet ; remplacer lodash par le natif
- [x] `composables/useNotification.ts` : l'adresse de support affichée vient d'un autre projet
- [x] Commentaires : relire ceux de l'existant avec la règle de [Langue, textes et commentaires](../../AGENTS.md#langue-textes-et-commentaires), et passer en guillemets droits les `« »` de 26 commentaires

Une fois la liste terminée : passer les avertissements de `eslint.config.ts` en erreurs, puis supprimer ce fichier et son lien dans le sommaire.
