# Organisation du code

Les règles marquées **`lint`** sont vérifiées par `yarn lint`.

## Dossiers de `src/`

| Dossier | Contenu | Nommage |
|---|---|---|
| `components/c/` | Wrappers des composants Naive UI, réduits au minimum : seulement ce qu'ils ajoutent ou modifient ([voir wrappers.md](wrappers.md)). Aucune logique métier | `hXxx.vue`, importé `HXxx`, utilisé `<h-xxx>` |
| `components/` | Composants de l'application | PascalCase, au moins deux mots : `UserMenu.vue`, `TimeClock.vue` |
| `views/` | Pages routées et contenus de modale (`LoginView` dans la modale de connexion) | `XxxView.vue` |
| `stores/` | Stores Pinia, seuls à parler à Supabase | `auth.ts` → `useAuthStore()`, id `"auth"` |
| `composables/` | Fonctions `useXxx()` liées à l'application en cours : état, service (messages, notifications), réactivité ou cycle de vie de Vue | `useXxx.ts` |
| `utils/` | Fonctions et constantes TypeScript indépendantes de l'application en cours (calculs, formats, constantes), clients (Supabase). Un fichier par sujet | camelCase, au nom du sujet : `userTag.ts`, jamais `utils.ts` ni `helpers.ts` |
| `types/` | Types partagés ; `types/components/` pour les types publics des composants (`HFormInst`) | PascalCase : `User.ts` |
| `models/` | Données statiques et leur type (menus, carrousel, fonds d'écran, définitions des widgets). Pas de fonction : elles vont dans `utils/` **`lint`** | PascalCase, au nom du type : `MenuItem.ts`. Constantes en UPPER_SNAKE_CASE : `MENU_ITEMS` **`lint`** |
| `assets/` | Styles globaux (`variables.scss`, `main.scss`), thèmes Naive UI | |
| `router/` | Routes et garde de navigation | |

Les noms de fichiers de ces dossiers sont vérifiés par `yarn lint` (`scripts/check-names.mjs`). **`lint`**

## Stores, composables et `utils/`

- **Stores** : Pinia en mode setup (`defineStore("auth", () => { … })`), avec un `return` qui liste explicitement ce qui est public. Dans un composant : `const auth = useAuthStore()`. On ne déstructure pas un store (on perdrait la réactivité), sauf avec `storeToRefs`.
- **Supabase ne s'appelle que depuis les stores.** **`lint`** Une action de store affiche elle-même son message d'erreur et renvoie un booléen ou un code de résultat (`LoginResult`). Le composant décide seulement de ce qu'il change à l'écran.
- **Messages et notifications à l'utilisateur** : `useAppMessage()` et `useAppNotification()` de `@/composables/`, qui appliquent les réglages du projet et marchent aussi dans les stores. Jamais le `useMessage` ni le `useNotification` de Naive UI : seul `AppLayout`, placé sous leurs providers, les appelle pour transmettre leur API aux composables. **`lint`**
- **Composable** : une fonction `useXxx()` qui donne à un composant ou à un store ce dont il a besoin : un état (`useLoader`), un service de l'application (`useAppMessage`) ou un comportement lié au cycle de vie de Vue (`useFitContent`). Une fonction qui calcule seulement un résultat à partir de ses paramètres va dans `utils/`.
- **Natif d'abord** : `Array.prototype.find`, `some`, `structuredClone`… plutôt que lodash. Lodash reste pour ce qui demanderait du code maison (`debounce`, `isEqual`, `cloneDeep` d'objets non sérialisables). **`lint`**
