# Styles

Les règles marquées **`lint`** sont vérifiées par `yarn lint`.

Dans l'ordre de préférence :

1. **Un composant `h-*`** pour la mise en page : `<h-flex vertical>`, `<h-grid>`, plutôt que `class="tw:flex tw:flex-col"`.
2. **Des classes Tailwind** pour les ajustements ponctuels : marges, largeurs, alignement du texte (`tw:mt-3`, `tw:max-w-4xl`). Le préfixe `tw:` est obligatoire (`assets/tailwind.css`). **Au plus 5 classes par élément**, pour que le template reste lisible.
3. **Une classe nommée dans `<style lang="scss" scoped>`** pour tout le reste : au-delà de 5 classes, états (`:hover`), animations, `:deep()`, media queries.

Et :

- Valeurs du design (espacements, rayons, flous) : les variables de `assets/variables.scss`, avec `@use "@/assets/variables";` puis `variables.$sn-main-padding`. Une valeur qui revient devient une variable.
- Couleurs : celles du thème Naive UI (`useThemeVars()`) ou les variables globales. Pas de couleur en dur qui ne marche que dans le thème sombre.
- `scoped` toujours. Les classes partagées par plusieurs composants (`.apple-blurred`, `.apple-menu`) vivent dans `assets/main.scss`.
- Un `<style>` non scoped dans un composant ne sert qu'à cibler du contenu téléporté hors du composant (menu déroulant, modale), avec un commentaire qui le dit.
- `:deep()` sert dans les wrappers à ajuster l'intérieur d'un composant Naive UI. Ailleurs, c'est le signe qu'il manque une prop ou une variante au wrapper.
- Classes en kebab-case, imbriquées sous une classe racine au nom du composant (`.member-card .name`).
