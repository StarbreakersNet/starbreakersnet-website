# Wrappers `components/c/`

Les règles marquées **`lint`** sont vérifiées par `yarn lint`.

Un wrapper `hXxx.vue` est la seule porte d'entrée vers un composant Naive UI `NXxx`. Il porte les valeurs par défaut du projet et les props maison (`glass`, `tooltip`…). C'est aussi le seul endroit à modifier si un composant Naive change ou est remplacé.

## Principe : le minimum, seulement ce que le wrapper ajoute ou modifie

Un wrapper ne contient que ce qu'il ajoute au composant Naive ou ce qu'il y change : props maison, valeurs par défaut du projet, comportements en plus. Tout le reste (props, événements, `v-model`, slots) passe tel quel, sans être recopié.

Toute prop Naive que le wrapper ne déclare pas passe telle quelle au composant Naive, par `$attrs`. Naive applique alors son propre comportement :
- ses valeurs par défaut ;
- sa gestion des booléens ;
- l'héritage de `size` ou `disabled` depuis un `h-form-item`.

Côté parent, le typage est **celui de Naive**, grâce à `/* @vue-ignore */`. Ce commentaire dit au compilateur Vue de ne pas générer de props runtime, mais TypeScript et l'IDE voient toujours le type complet. Au survol, `size` sur `<h-button>` affiche donc le même type que sur `<n-button>`, et l'autocomplétion propose les mêmes valeurs.

| La prop est… | On écrit |
|---|---|
| Une prop Naive que le wrapper ne touche pas | Rien : elle passe par `$attrs` |
| Une prop maison (`glass`, `tooltip`) | Déclarée dans `Props`, avec un commentaire `/** … */` |
| Une prop Naive que le wrapper lit dans son script | Redéclarée, puis repassée explicitement au composant Naive. Un booléen s'écrit `disabled?: boolean`, avec `= undefined` par défaut. Une autre prop prend le type de Naive : `themeOverrides?: ButtonProps["themeOverrides"]` |
| Une prop Naive dont le projet change la valeur par défaut | Redéclarée avec le défaut du projet (`wrap = false` dans `hFlex`), puis repassée |

**Pourquoi `= undefined` pour un booléen redéclaré.** Vue donne `false` à une prop booléenne absente, et ce `false` écrase le comportement de Naive. Par exemple, un `h-input` qui déclare `disabled?: boolean` sans défaut ne se désactive plus dans un `h-form` désactivé. Avec `disabled = undefined`, Naive décide comme s'il était utilisé directement.

**Pourquoi `boolean` plutôt que `ButtonProps["disabled"]`.** Avec le type indexé, Vue ne génère aucun type runtime. Dans le script du wrapper, `<h-button disabled>` vaudrait alors `""` (faux) au lieu de `true`.

## Wrapper sans prop maison

C'est le cas le plus simple : trois macros, et tout le reste vient de Naive.

```vue
<script setup lang="ts">
import { NInput, type InputProps, type InputSlots } from "naive-ui";

defineOptions({ inheritAttrs: false });

defineProps</* @vue-ignore */ InputProps>();

defineSlots<InputSlots>();
</script>

<template>
  <n-input v-bind="$attrs">
    <template v-for="(_, name) in $slots" #[name]="slotProps">
      <slot :name="name as keyof InputSlots" v-bind="slotProps ?? {}" />
    </template>
  </n-input>
</template>
```

## Wrapper avec props maison

Version courte de `hButton`. La version complète ajoute l'infobulle, l'interception du `click` sur un lien et le reste du style en verre.

```vue
<script setup lang="ts">
import { NButton, type ButtonProps, type ButtonSlots } from "naive-ui";
import { computed } from "vue";

interface Props extends /* @vue-ignore */ ButtonProps {
  /** Bouton en verre (glass.scss) : fond translucide, arrondi et sans bordure */
  glass?: boolean;
  /** Fait du bouton un lien `<a>` */
  href?: string;
  disabled?: boolean;
  themeOverrides?: ButtonProps["themeOverrides"];
}

defineOptions({ inheritAttrs: false });

const { glass = false, href, disabled = undefined, themeOverrides } = defineProps<Props>();

defineSlots<ButtonSlots>();

const GLASS_THEME_OVERRIDES: ButtonProps["themeOverrides"] = {
  color: "var(--glass-control)",
  textColor: "var(--glass-text)",
};

const mergedThemeOverrides = computed<ButtonProps["themeOverrides"]>(() => ({
  ...themeOverrides,
  ...(glass && GLASS_THEME_OVERRIDES),
}));
</script>

<template>
  <n-button
    :class="{ 'h-button--glass': glass }"
    :disabled="disabled"
    :href="disabled ? undefined : href"
    :tag="href ? 'a' : undefined"
    :theme-overrides="mergedThemeOverrides"
    v-bind="$attrs">
    <template v-for="(_, name) in $slots" #[name]="slotProps">
      <slot :name="name as keyof ButtonSlots" v-bind="slotProps ?? {}" />
    </template>
  </n-button>
</template>
```

## Règles

- **Sans prop maison : `defineProps</* @vue-ignore */ XxxProps>()`.** Une `interface` vide qui ne fait qu'étendre est refusée par le lint. **`lint`**
- **`defineOptions({ inheritAttrs: false })` et `v-bind="$attrs"` sur le composant Naive** : attributs, `class`, écouteurs et `v-model` arrivent sur le composant Naive, même quand la racine du wrapper est un autre composant qui n'ajoute pas de boîte autour (l'infobulle de `hButton`).
- **Racine qui est un élément du wrapper** : quand le wrapper entoure le composant Naive d'un élément à lui, c'est cet élément racine qui occupe la place dans la mise en page du parent. `class` et `style` vont donc sur l'élément racine, pour que les classes de mise en page (`tw:mt-2`, `tw:flex-1`) s'appliquent à toute la boîte. Le reste de `$attrs` va au composant Naive. Naive fait de même : `NInput` pose la classe sur sa racine, et `inputProps` atteint le `<input>` intérieur.

  Pour cela, on déclare `class` et `style` comme props : déclarées, elles sortent de `$attrs`, et `v-bind="$attrs"` n'envoie plus que le reste au composant Naive.

  ```vue
  <script setup lang="ts">
  import { NXxx, type XxxProps, type XxxSlots } from "naive-ui";
  import type { HTMLAttributes } from "vue";

  interface Props extends /* @vue-ignore */ XxxProps {
    // Déclarées pour sortir de $attrs : elles vont sur l'élément racine
    class?: HTMLAttributes["class"];
    style?: HTMLAttributes["style"];
  }

  defineOptions({ inheritAttrs: false });

  const { class: rootClass, style: rootStyle } = defineProps<Props>();

  defineSlots<XxxSlots>();
  </script>

  <template>
    <div :class="rootClass" :style="rootStyle" class="h-xxx">
      <n-xxx v-bind="$attrs">…</n-xxx>
    </div>
  </template>
  ```

  Les types de `HTMLAttributes` sont ceux que Vue donne à `class` et `style` sur un élément : le parent peut passer une chaîne, un objet ou un tableau. Pour poser d'autres attributs sur l'élément racine (`id`, `data-*`), on ajoute une prop dédiée (`rootProps`), seulement le jour où le besoin existe.
- **`v-bind="$attrs"` en dernier.** Les valeurs calculées par le wrapper servent alors de défaut, et ce que le parent passe explicitement l'emporte : `<h-button tag="div">` reste une `div`. Les props déclarées ne sont pas dans `$attrs`, le wrapper en garde donc le contrôle.
- **Un composant qui ne sert que dans certains cas n'est créé que dans ces cas.** Par exemple, l'infobulle de `hButton` n'existe que si `tooltip` est rempli : on écrit `v-if` / `v-else`, quitte à répéter le composant Naive dans les deux branches, plutôt qu'une infobulle toujours présente et désactivée.
- **Jamais `useAttrs()` dans un `computed`.** L'objet `attrs` n'est pas réactif, et le `computed` garderait une valeur périmée. On lie `$attrs` dans le template.
- **Pas de réémission des événements Naive** : ils passent par `$attrs`, typés. `defineEmits` sert aux événements maison, ou à ceux que le wrapper intercepte. Déclarer `click` retire `onClick` de `$attrs` : le wrapper doit alors l'émettre lui-même.
- **Slots relayés tous à la fois** par la boucle sur `$slots`. Seuls les slots fournis par le parent sont relayés. C'est important : Naive change son rendu dès qu'un slot existe, même vide (place réservée à une icône…).
- **Un slot que le wrapper rend lui-même** (titre enveloppé dans une `div`, contenu ajouté au slot par défaut) est écrit à part et retiré de la boucle : `v-for="(_, name) in slotsExcept($slots, 'title')"`, avec `slotsExcept` de `@/utils/slots`. Un slot qui n'a qu'un contenu par défaut maison (l'icône de `hImage` en cas d'erreur) n'a pas besoin d'être retiré : le slot du parent, relayé par la boucle, remplace celui du wrapper.
- **Slots typés quand Naive exporte leur type** : `defineSlots<XxxSlots>()`, et `name as keyof XxxSlots` dans la boucle. C'est le cas de `Alert`, `AnchorLink`, `Button`, `Card`, `Collapse`, `CollapseItem`, `DatePicker`, `Ellipsis`, `Image`, `Input`, `List`, `ListItem`, `Modal`, `Popconfirm`, `Popover`, `Select`, `Switch`, `TabPane`, `Tabs`, `Tag`, `Thing` et `Tooltip`. Sinon, on garde la boucle sans `defineSlots`. Un nom de slot inconnu n'est pas signalé, c'est une limite de Vue.
- **Méthodes de l'instance Naive** (`focus`, `validate`…) : exposées avec `defineExpose`, et leur type public décrit dans `types/components/c/hXxx.ts` (voir `HFormInst`).
- **Aucune logique métier** : ni store, ni router, ni Supabase.

Cette stratégie a été vérifiée en novembre 2026 avec Naive UI 2.43.1 et Vue 3.5.22.
- **Typage** : `size`, `ghost`, `type`, `disabled`, `themeOverrides`, `onClick`, `value` et `onUpdate:value` ont strictement le même type sur le wrapper et sur le composant Naive.
- **Rendu** : classes, `type="submit"`, `tag`, slots, héritage de `size` et de `disabled` depuis un `n-form-item` sont identiques au composant Naive. Avec un élément racine, `class` et `style` arrivent sur la racine, et les props Naive (`size`, `value`, `placeholder`) sur le composant Naive.

À revérifier après une mise à jour majeure de l'un ou de l'autre.
