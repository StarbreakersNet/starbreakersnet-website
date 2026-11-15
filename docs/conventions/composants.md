# Écrire un composant

Les règles marquées **`lint`** sont vérifiées par `yarn lint`.

## Anatomie d'un composant

Un composant complet, conforme à toutes les règles qui suivent :

```vue
<script setup lang="ts">
import { computed } from "vue";
import HButton from "@/components/c/hButton.vue";
import HCard from "@/components/c/hCard.vue";
import HFlex from "@/components/c/hFlex.vue";
import { useLoader } from "@/composables/useLoader";
import { formatUserTag } from "@/utils/userTag";
import { useMembersStore } from "@/stores/members";
import type { UserType } from "@/types/User";

const expanded = defineModel<boolean>("expanded", { default: false });

const { member, removable = false } = defineProps<{
  member: UserType;
  /** Affiche le bouton "Retirer" */
  removable?: boolean;
}>();

const emit = defineEmits<{
  removed: [member: UserType];
}>();

const members = useMembersStore();

const removing = useLoader();

const fullName = computed(() => [member.firstName, member.lastName].filter(Boolean).join(" "));

async function handleRemove() {
  if (await removing.run(() => members.remove(member))) {
    emit("removed", member);
  }
}
</script>

<template>
  <h-card class="member-card" size="small">
    <h-flex justify="space-between">
      <span>{{ member.username }}{{ formatUserTag(member.tag) }}</span>
      <h-flex>
        <h-button quaternary size="small" @click="expanded = !expanded">Détails</h-button>
        <h-button
          v-if="removable"
          :loading="removing.loading"
          size="small"
          type="error"
          @click="handleRemove()">
          Retirer
        </h-button>
      </h-flex>
    </h-flex>
    <p v-if="expanded && fullName" class="tw:mt-2">{{ fullName }}</p>
  </h-card>
</template>

<style lang="scss" scoped>
@use "@/assets/variables";

.member-card {
  border-radius: variables.$sn-apple-border-radius;
}
</style>
```

- **Ordre des blocs** : `<script setup lang="ts">`, puis `<template>`, puis `<style lang="scss" scoped>`. **`lint`**
- **Pas de bloc vide** : un composant sans style n'a pas de `<style>`. **`lint`**
- **Ordre dans le script** :
  1. imports **`lint`** ;
  2. types locaux (`interface Props`…) ;
  3. macros, dans l'ordre `defineOptions`, `defineModel`, `defineProps`, `defineEmits`, `defineSlots` **`lint`** ;
  4. constantes du module (`EMAIL_CHANGE_TEXT`) ;
  5. stores, router et composables (`const auth = useAuthStore()`) ;
  6. état (`ref`, `reactive`) et valeurs dérivées (`computed`) ;
  7. fonctions ;
  8. `watch` ;
  9. hooks de cycle de vie (`onMounted`…) ;
  10. `defineExpose` **`lint`**.

  Dans un composant long, on regroupe plutôt par fonctionnalité (état, `computed` et fonctions de la modale de suppression ensemble), avec un commentaire en tête de groupe.

## Script

### TypeScript

- Toujours `<script setup lang="ts">` : ni Options API, ni `<script>` classique, ni JavaScript. **`lint`**
- Pas de `any` **`lint`** : on prend le type exact (Naive UI exporte les siens : `ButtonProps`, `FormRules`…) ou `unknown` qu'on affine ensuite.
- `import type` pour ce qui n'est qu'un type (imposé par `verbatimModuleSyntax`, `yarn type-check` le signale).
- Imports internes par l'alias `@/`, sans extension `.ts` : `@/stores/auth`. **`lint`**
- Ordre des imports conseillé : `vue` et bibliothèques, puis composants `@/components/…`, puis le reste de `@/…`, puis les `import type`.

### Props

Props **typées** et **déstructurées** (syntaxe Vue 3.5). **`lint`**

```ts
const { size = "medium", disabled = false, tooltip } = defineProps<{
  size?: ButtonProps["size"];
  disabled?: boolean;
  /** Texte de l'infobulle, sans infobulle si vide */
  tooltip?: string;
}>();
```

- Le type est la seule source de vérité : pas de `PropType`. Le compilateur génère la déclaration runtime.
- Les **valeurs par défaut** s'écrivent dans la déstructuration. Une prop obligatoire n'a pas de `?`.
- Au-delà de quelques props, ou pour étendre un type, on déclare une `interface Props` au-dessus des macros.
- Un commentaire `/** … */` sur chaque prop dont le nom ne suffit pas : l'IDE l'affiche au survol, côté parent.
- Les props s'utilisent **directement**, dans le script comme dans le template : `size`, jamais `props.size`. Les variables déstructurées restent réactives.
- Pour un `watch` ou un composable, on passe un getter : `watch(() => size, …)`. Écrire `watch(size, …)` provoque une erreur de compilation.
- **Booléens** : une prop booléenne absente vaut `false`. Pour qu'elle reste `undefined` (wrapper qui laisse Naive UI décider), on écrit `disabled = undefined` dans la déstructuration. Écrire `boolean | undefined` dans le type ne suffit pas.
- On ne modifie jamais une prop. **`lint`** On émet un événement ou on utilise `defineModel`.
- **Dans un wrapper**, on ne redéclare pas les props Naive : on ne déclare que ce que le wrapper ajoute ou modifie, et le reste passe par `$attrs`, typé. Voir [wrappers.md](wrappers.md).

### Événements

```ts
const emit = defineEmits<{
  connected: [];
  select: [key: string];
}>();
```

- Déclaration typée, avec la syntaxe en tuples nommés ci-dessus. **`lint`**
- Le nom dit ce qui s'est passé, pas ce que le parent doit faire : `registered`, `sent`, `removed`.
- Noms en camelCase dans le script (`emit("itemClick")`), écoutés en kebab-case dans le template (`@item-click`). **`lint`**
- On émet avec la constante `emit`, y compris dans le template, plutôt qu'avec `$emit`. **`lint`**
- **Dans un wrapper**, on ne redéclare pas les événements Naive : ils passent par `$attrs`, typés. `defineEmits` ne sert qu'aux événements que le wrapper ajoute ou intercepte. Voir [wrappers.md](wrappers.md).

### v-model

- `defineModel` plutôt qu'une prop et un événement `update:xxx` écrits à la main. **`lint`**
- Composant de l'application : `defineModel()` donne `v-model`, `defineModel("expanded")` donne `v-model:expanded`.
- Dans un wrapper, v-model passe tout seul par `$attrs` ([voir wrappers.md](wrappers.md)). On ne déclare `defineModel("value")` que si le wrapper doit lire ou modifier la valeur, et on garde alors le nom de Naive UI (`value`, `show`, `checked`).

### État et réactivité

- `reactive` pour une **collection** de valeurs liées :
  - un objet qui les regroupe : modèle de formulaire passé à `<h-form :model>`, filtres, options d'affichage ;
  - une liste qu'on modifie sur place, avec `push` ou `splice`.
- `ref` pour une valeur seule (booléen, texte, nombre, élément sélectionné), et pour une liste qu'on remplace d'un bloc (`items.value = await …`).
- Un `reactive` se modifie **champ par champ, et seulement comme ça** : ni `Object.assign` **`lint`**, ni déstructuration, ni `toRefs` **`lint`**. Si on a besoin de le remplacer d'un bloc (valeurs rechargées depuis le serveur, remise à zéro) ou d'en extraire des morceaux, c'est qu'il fallait un `ref` d'objet : `const filters = ref({ … })`, puis `filters.value = { … }`.
- Une valeur qui se déduit d'une autre est un `computed`, jamais un `watch` qui recopie.
- Un `watch` qui doit aussi s'exécuter au montage prend `{ immediate: true }` : on ne recopie pas son code dans `onMounted`.
- Refs de template : `useTemplateRef<Type>("formRef")` **`lint`**, avec un nom qui finit par `Ref` **`lint`**. Un `ref="…"` inutilisé est retiré. **`lint`**
- Tout ce qui est démarré au montage (`setInterval`, écouteur sur `window`) est arrêté dans `onBeforeUnmount` (voir `composables/useCurrentTime.ts`).
- Pas d'état partagé dans une variable de module (`let x` hors du composant) : c'est le rôle d'un store.

### Fonctions

- Déclarées avec `function` **`lint`**. Les fonctions fléchées restent pour les callbacks en ligne (`items.filter(item => …)`).
- Gestionnaires d'événements : `handleXxx` (`handleSubmit`, `handleSelect`). Pour une modale : `openXxx` et `closeXxx`.
- `async` / `await`, pas `.then()` **`lint`**. Les indicateurs de chargement passent par `useLoader()` (voir [Chargements](#chargements)).
- **Courtes et unitaires** : une fonction fait une seule chose, et son nom dit laquelle (`areFormsValid`, `saveAccount`). Un gestionnaire `handleXxx` se lit comme un résumé : il vérifie les conditions et confie le travail à des fonctions nommées.
- **Conditions en positif, et le code qui en dépend dans le `if`** : l'indentation montre ce qui ne s'exécute qu'à cette condition. Pas de sortie anticipée : ni `return;` vide **`lint`**, ni `continue` dans une boucle **`lint`**.
- **Au plus trois niveaux de blocs imbriqués** **`lint`**. Tous les blocs comptent (`if`, `for`, `switch`, `try`…), mais `else` et `else if` n'ajoutent pas de niveau, et un callback (`.some(item => …)`, `saving.run(async () => …)`) repart de zéro. Au-delà, on extrait une fonction nommée : l'imbrication qui grandit est le signal qu'une fonction fait trop de choses.
- **Deux autres signaux qu'il faut extraire** : un nom de fonction qui demanderait un « et », ou un bloc qu'on voudrait précéder d'un commentaire pour dire ce qu'il fait. Le bloc devient une fonction, et le commentaire son nom.
- **`return valeur`** dès que le résultat est connu, y compris dans chaque `case` d'un `switch` (`getAuthErrorMessage`) et dans la branche d'erreur d'une action de store (`return false`). Dans une fonction qui ne renvoie rien, chaque `case` se termine par `break`. **`lint`**

Le `handleSubmit` de `AccountView`, une fois découpé :

```ts
// Valide les deux formulaires, pour que chacun affiche ses erreurs
async function areFormsValid() {
  const accountValid = await isValid(accountFormRef.value);
  const passwordValid = !wantsPasswordChange.value || (await isValid(passwordFormRef.value));

  return accountValid && passwordValid;
}

function hasChanges() {
  return isProfileChanged() || isEmailChanged() || wantsPasswordChange.value;
}

async function handleSubmit() {
  if (!saving.loading && user.infos.me && (await areFormsValid())) {
    if (hasChanges()) {
      await saving.run(saveAccount);
    } else {
      message.info("Aucune modification à enregistrer");
    }
  }
}
```

### Chargements

Un indicateur de chargement est un `useLoader()` de `@/composables/useLoader`, jamais un `ref(false)` qu'on passe à `true` puis à `false`.

```ts
const deleting = useLoader();

async function handleDelete() {
  const deleted = await deleting.run(() => auth.deleteAccount(deleteForm.password));

  if (deleted) {
    showDeleteModal.value = false;
  }
}
```

```vue
<h-button :loading="deleting.loading" type="error" @click="handleDelete()">Supprimer</h-button>
```

- **`run()` par défaut** : le loader reste actif le temps de la tâche et s'arrête même si elle lève une exception. `run()` renvoie le résultat de la tâche, typé. On écrit toujours `await` devant. **`lint`**
- Pour plusieurs `await` à la suite : `await saving.run(async () => { … })`.
- **Appels qui se chevauchent** : le loader compte les appels en cours, et il reste actif jusqu'à la fin du dernier.
- `saving.loading` (booléen) et `saving.count` (nombre) se lisent **sans `.value`**, dans le script comme dans le template. Le loader est un objet `reactive` : on ne le déstructure pas. **`lint`**
- **`start()` / `stop()`** seulement pour un chargement réparti sur plusieurs fonctions ou événements (démarré au clic, arrêté dans un `@load`). `stop()` va alors dans un `finally` dès que c'est possible.
- Plusieurs loaders à surveiller ensemble : `const busy = computed(() => isAnyLoading(saving, deleting))`. Pour une collection de loaders (un par élément d'une liste…) : `isAnyLoading(...Object.values(loaders))`.
- Nom du loader : l'action en cours, en *-ing* : `saving`, `deleting`, `sending`. **`lint`**

## Template

- Balises en kebab-case : `<h-button>`, `<user-menu>`, `<register-view>`. **`lint`**
- **Jamais de composant Naive UI (`n-*`) hors de `components/c/`** **`lint`**. On utilise le wrapper `h-*`. S'il n'existe pas, on le crée ([voir wrappers.md](wrappers.md)) : ça prépare le terrain pour un comportement maison. Seule exception : les providers de `App.vue`.
- Attributs en kebab-case (`:mask-closable`) **`lint`**. Booléen vrai en raccourci (`ghost`, pas `:ghost="true"`) **`lint`**. Le raccourci de même nom est permis : `:maintenance-mode` pour `:maintenance-mode="maintenanceMode"`.
- Expressions courtes : au-delà d'une comparaison ou d'un ternaire, on passe par un `computed` ou une fonction. Un ternaire imbriqué est refusé. **`lint`**
- Événements :
  - avec un gestionnaire nommé, appelé avec parenthèses : `@click="handleSubmit()"` **`lint`** ;
  - le code en ligne est réservé aux affectations simples : `@click="showModal = true"` ;
  - pas de `$router` dans le template : la navigation se fait dans une fonction du script. **`lint`**
- `v-for` toujours avec une `:key` stable, tirée de la donnée (id, nom), pas de l'index. **`lint`** Jamais de `v-if` sur le même élément qu'un `v-for`. **`lint`**
- `v-show` pour ce qui s'affiche et se masque souvent. `v-if` pour le reste.
- Quand un composant reçoit plusieurs slots, chacun a son `<template #nom>`, y compris `#default`.
