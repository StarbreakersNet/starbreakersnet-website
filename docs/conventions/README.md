# Conventions de code du front

Comment on écrit le front Vue du projet : structure d'un composant, syntaxes à préférer, pièges à éviter. Ces conventions s'appliquent à tout code écrit ou modifié, par un humain comme par un agent de code (Claude, Codex, Copilot, Gemini…). Les agents y arrivent par [`AGENTS.md`](../../AGENTS.md), à la racine du dépôt, qui contient les règles communes et dit quel fichier lire selon ce qu'on modifie.

Les règles marquées **`lint`** sont vérifiées par `yarn lint` (config dans `eslint.config.ts`, et `scripts/check-names.mjs` pour les noms de fichiers) : inutile de les surveiller en relecture. Les autres relèvent de la relecture. Pour faire évoluer une règle : une PR qui modifie ces fichiers (et le lint si besoin), comme pour le reste du code.

## Sommaire

- [Règles communes](../../AGENTS.md) : nommage, langue et commentaires, tableau « À éviter »
- [Écrire un composant](composants.md) : anatomie, script, chargements, template
- [Wrappers `components/c/`](wrappers.md)
- [Styles](styles.md)
- [Organisation du code](organisation.md) : dossiers de `src/`, stores, composables et `utils/`

## Outils

| Commande | Rôle |
|---|---|
| `yarn format` | Prettier sur `src/` : indentation, guillemets, retours à la ligne |
| `yarn lint` | oxlint et ESLint, avec correction automatique de ce qui peut l'être, puis les noms de fichiers |
| `yarn type-check` | `vue-tsc` sur tout le projet |

**Avant d'ouvrir une PR** : `yarn format`, `yarn lint` et `yarn type-check`, sans nouvelle erreur ni nouvel avertissement dans les fichiers touchés. La CI refait ces vérifications sur chaque PR, et toute erreur la fait échouer.

La mise en forme ne se discute pas en relecture : Prettier décide (`.prettierrc.yaml` : 2 espaces, guillemets doubles, points-virgules, 100 colonnes). Dans l'IDE :

- **WebStorm / IntelliJ** : *Settings › Languages & Frameworks › JavaScript › Prettier* : « Automatic configuration » et « Run on save » ; *› Code Quality Tools › ESLint* : « Automatic configuration » et « Run eslint --fix on save ».
- **VS Code** : extensions *Vue - Official*, *ESLint* et *Prettier*, avec « Format on save ».

`.editorconfig` donne les bons réglages de base (2 espaces, fin de ligne LF) aux éditeurs qui n'ont pas Prettier.
