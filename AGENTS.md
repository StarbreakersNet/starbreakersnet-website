# AGENTS.md

Consignes communes à tous les agents de code (Claude, Codex, Copilot, Gemini…), et règles valables partout dans le front. `CLAUDE.md` et `GEMINI.md` importent ce fichier.

Site des Starbreakers : front Vue 3 + Vite (TypeScript, Pinia, Naive UI via les wrappers `h-*`, Tailwind préfixé `tw:`) et backend Supabase self-hosted. Installation, déploiement et organisation du dépôt : [`README.md`](README.md).

## Avant de modifier le front

Lire d'abord le fichier de [`docs/conventions/`](docs/conventions/README.md) qui correspond à ce qui est modifié. Les règles marquées **`lint`** y sont vérifiées par `yarn lint`.

| Ce qui est modifié | À lire |
|---|---|
| Un composant ou une vue (`.vue`) | [`composants.md`](docs/conventions/composants.md) |
| Un wrapper de `src/components/c/`, ou un composant Naive UI sans wrapper | [`wrappers.md`](docs/conventions/wrappers.md) |
| Des styles : classes Tailwind, bloc `<style>`, `src/assets/` | [`styles.md`](docs/conventions/styles.md) |
| Un store, un composable, `src/utils/`, ou un nouveau fichier | [`organisation.md`](docs/conventions/organisation.md) |

## Avant de rendre la main

- `yarn format`, `yarn lint` et `yarn type-check` : aucune nouvelle erreur ni nouvel avertissement dans les fichiers touchés.
- Si une règle de la charte semble inadaptée, le signaler plutôt que la contourner.

## Nommage

| Élément | Convention | Exemples |
|---|---|---|
| Composant | PascalCase, au moins deux mots | `UserMenu.vue`, `TimeClock.vue` |
| Vue | suffixe `View` | `AccountView.vue` |
| Wrapper | `hXxx.vue`, importé `HXxx`, balise `<h-xxx>` | `hButton.vue` |
| Variable, fonction | camelCase, en anglais | `pendingEmail`, `resetAccountForm` |
| Constante de module | UPPER_SNAKE_CASE | `EMAIL_CHANGE_DURATION` |
| Booléen | `isXxx`, `hasXxx`, `canXxx`, `showXxx` | `isReady`, `showDeleteModal` |
| Loader (`useLoader`) | L'action en cours, en *-ing* | `saving`, `deleting` |
| Gestionnaire d'événement | `handleXxx`, ou le verbe de son action ; jamais `onXxx` | `handleSubmit`, `addLink` |
| Ref de template | suffixe `Ref` | `formRef` |
| Type, interface | PascalCase ; `interface` pour un objet, `type` pour une union | `HFormInst`, `ThemeType` |
| Store | `useXxxStore`, fichier et id identiques | `stores/auth.ts`, `useAuthStore`, `"auth"` |
| Événement émis | camelCase, au participe passé | `registered`, `itemClick` |
| Classe CSS | kebab-case | `.app-container`, `.icon-wrapper` |

`yarn lint` vérifie ces noms, sauf ceux des booléens et des classes CSS, et le participe passé des événements. Pour les gestionnaires d'événement, il refuse seulement `onXxx`.

## Langue, textes et commentaires

- Identifiants en anglais. Textes affichés et commentaires en français, avec des guillemets droits : `"Retirer"`, pas `« Retirer »`. **`lint`**
- **Par défaut, pas de commentaire.** Un commentaire n'existe que si, sans lui, quelqu'un qui lit ou modifie le code mergé se tromperait : une contrainte qui ne se voit pas dans le code, un comportement surprenant de Supabase, de GoTrue ou du navigateur, un choix de sécurité. Par exemple, dans `LoginView.vue` : pas de bouton désactivé, parce que les champs remplis par le gestionnaire de mots de passe ne sont visibles du script qu'après une interaction.
- **Le test : servira-t-il dans six mois à quelqu'un qui découvre le fichier ?** Un commentaire qui n'a servi que pendant le développement ou le débogage est retiré avant la PR.
- **Jamais de commentaire pour** :
  - dire ce que fait le code, ou ce qu'est un champ ou une fonction dont le nom le dit déjà ;
  - rappeler le fonctionnement de Vue, de Naive UI ou du navigateur ;
  - raconter l'historique du développement : ce qui existait avant, ce qui a été essayé, pourquoi on n'a pas fait autrement ;
  - répéter une règle de la charte ou le message d'une règle de lint.
- Un commentaire tient en une ligne si possible.
- Pas de code commenté : l'historique git le garde.
- Pas de `console.log` oublié. **`lint`** `console.warn` et `console.error` restent pour un vrai diagnostic.

## À éviter

| À éviter | À la place |
|---|---|
| `defineProps({ size: { type: String as PropType<…> } })` | `defineProps<{ size?: … }>()` |
| `props.size` | `size`, déstructuré |
| `defineEmits(["connected"])` | `defineEmits<{ connected: [] }>()` |
| Prop `value` + émission `update:value` à la main | `defineModel` |
| `<n-button>` dans une vue ou un composant | `<h-button>`, ou un nouveau wrapper |
| Wrapper qui recopie chaque prop Naive | `extends /* @vue-ignore */ XxxProps` |
| Booléen Naive redéclaré sans défaut (`const { disabled } = …`) | `disabled = undefined` |
| `useAttrs()` lu dans un `computed` | `v-bind="$attrs"` dans le template |
| `class="tw:flex tw:flex-col tw:gap-2"` | `<h-flex vertical>` |
| Plus de 5 classes `tw:` sur un élément | Une classe nommée en SCSS scoped |
| `const formRef = ref()` pour une ref de template | `useTemplateRef("formRef")` |
| `const handleSubmit = () => {}` | `function handleSubmit() {}` |
| `if (!canSave) { return; }`, puis la suite | `if (canSave) { … }`, la suite dans le `if` |
| Quatre niveaux de blocs imbriqués | Une fonction nommée pour le bloc intérieur |
| `watch` qui recopie une valeur dérivée | `computed` |
| `Object.assign`, déstructuration ou `toRefs` sur un `reactive` | Un `ref` d'objet : `form.value = { … }` |
| `any` | Le type exact, ou `unknown` |
| `import … from "@/stores/auth.ts"` | `import … from "@/stores/auth"` |
| `@click="$router.push(…)"` | Une fonction qui appelle `router.push` |
| `supabase.from(…)` dans un composant | Une action de store |
| `useMessage()` ou `useNotification()` de `naive-ui` | `useAppMessage()` ou `useAppNotification()` |
| `const saving = ref(false)`, passé à `true` puis à `false` | `const saving = useLoader()` et `await saving.run(…)` |
| `_.find(items, …)` | `items.find(…)` |
| `<style scoped></style>` vide | Pas de bloc `<style>` |
