# starbreakersnet-website

Site web de StarbreakersNet, développé avec **Vue 3** et **Vite**, avec un
**backoffice** géré par **Directus** (CMS headless) : le front affiche des
données dynamiques du CMS via son API. Le site héberge aussi **Bonjourr**, une
page d'accueil de navigateur réécrite en natif dans le site (route `/bonjourr`,
voir plus bas). Deux environnements de développement : **Docker Compose** ou
**npm**.

## Prérequis

### Pour l'installation via Docker Compose

- [Docker](https://www.docker.com/get-started) version 20.10 ou supérieure
- [Docker Compose](https://docs.docker.com/compose/) (la sous-commande `docker compose` des Docker récents)

### Pour l'installation avec npm

- [Node.js](https://nodejs.org/) version 20 ou supérieure
- [npm](https://www.npmjs.com/) (généralement installé avec Node.js)

## Configuration du fichier `.env`

Avant de démarrer, configurez les variables d'environnement. Le fichier
d'exemple `.env.example` est fourni :

1. Dupliquez-le sous le nom `.env` :
    ```bash
    cp .env.example .env
    ```

2. Ajustez les valeurs. Le fichier complet :
    ```env
    # Front-end
    APP_PORT=8081
    VITE_PORT=5173

    # Variables pour Directus
    DIRECTUS_KEY=your_super_secret_key

    # Port directus local
    DB_PORT=5432
    DIRECTUS_PORT=8055
    DIRECTUS_ADMIN_EMAIL=admin@example.com
    DIRECTUS_ADMIN_PASSWORD=your_admin_password
    DIRECTUS_ADMIN_TOKEN=your_super_admin_secret_token
    ```

    - **APP_PORT** : port publié par le conteneur de production (le front en
      build, servi par nginx).
    - **VITE_PORT** : port publié par le conteneur de développement (serveur
      Vite à l'intérieur, même port que `npm run dev` sur votre machine).
    - **DIRECTUS_KEY** : secret du backoffice Directus.
    - **DB_PORT** : port de la base PostgreSQL/PostGIS.
    - **DIRECTUS_PORT** : port du backoffice Directus.
    - **DIRECTUS_ADMIN_EMAIL** / **DIRECTUS_ADMIN_PASSWORD** : compte admin du
      backoffice.
    - **DIRECTUS_ADMIN_TOKEN** : jeton API statique pour authentifier les
      requêtes du front.

## Installation et Configuration

### Option 1 : Utilisation de Docker Compose

Le compose définit deux profils : `default` (production : front buildé servi
par nginx) et `dev` (serveur Vite avec rechargement à chaud). Tous deux
démarrent la base de données et Directus.

1. Clonez le dépôt sur votre machine locale :
    ```bash
    git clone https://github.com/StarbreakersNet/starbreakersnet-website.git
    cd starbreakersnet-website
    ```

2. Démarrez l'environnement de développement :
    ```bash
    docker compose --profile dev up --build
    ```

3. Accédez aux applications :
    ```
    http://localhost:5173        le site (Vite, rechargement à chaud)
    http://localhost:8055/admin  le backoffice Directus
    ```

4. Pour arrêter les conteneurs :
    ```bash
    docker compose down
    ```

### Option 2 : Utilisation de npm

Si vous préférez ne pas utiliser Docker pour le front :

1. Clonez le dépôt sur votre machine locale :
    ```bash
    git clone https://github.com/StarbreakersNet/starbreakersnet-website.git
    cd starbreakersnet-website
    ```

2. Installez les dépendances du projet :
    ```bash
    npm install
    ```

3. Démarrez le serveur de développement :
    ```bash
    npm run dev
    ```

4. Accédez à l'application dans votre navigateur (le port est celui de
   `vite.config.js`, 5173 par défaut) :
    ```
    http://localhost:5173
    ```

   Le backoffice Directus tourne à côté : les deux profils Docker (`dev` et
   `default`) démarrent la base et Directus ; sans Docker, lancez votre propre
   instance Directus — le dossier `backend/` du dépôt porte les volumes
   montés (base, extensions, migrations, snapshots, uploads).

5. Pour arrêter le serveur de développement, utilisez `Ctrl + C` dans le
   terminal.

## Scripts disponibles

Tous les scripts du projet, à lancer à la racine :

| Script | Rôle |
| --- | --- |
| `npm run dev` | serveur de développement Vite (`http://localhost:5173`) |
| `npm run build` | build de production dans `dist/` |
| `npm run preview` | sert le `dist/` construit (`http://localhost:4173`) |
| `npm run test` | tests unitaires (vitest + happy-dom, dans `tests/`) |
| `npm run lint` | ESLint avec correction automatique |
| `npm run format` | Prettier sur `src/` |

Des scénarios bout-en-bout (Playwright, sans framework de test) complètent les
vérifications sur le build : `node tests/e2e-menu.mjs`,
`node tests/e2e-reglages.mjs` après `npm run build` et un
`npm run preview` — ils exigent une base Chromium installée
(`npx playwright install chromium`).

## Compilation pour la Production

### Avec Docker Compose

1. Construisez et démarrez la pile de production (front buildé + Directus) :
    ```bash
    docker compose --profile default up --build
    ```

2. Votre application sera accessible sur le port `APP_PORT` de votre `.env`
   (`http://localhost:8081` par défaut).

### Avec npm

1. Compilez et minifiez le code pour la production :
    ```bash
    npm run build
    ```

2. Les fichiers de production seront générés dans le dossier `dist/`, que
   `npm run preview` sert en local pour vérification avant déploiement.

## Intégrations

### Bonjourr

Bonjourr est une page d'accueil pour votre navigateur Internet inspirée par
l'apparence d'iOS. Le fork du site n'est **pas une iframe ni un serveur
séparé** : c'est une page **native du site**, montée sur la route
`/bonjourr`, atteignable par le bouton « Bonjourr » du menu, affichée dans
l'encadré de la page. La copie d'origine de Bonjourr (victrme, en Deno) est
conservée sous `Bonjourr/` comme source de référence en lecture seule.

Réglées par l'engrenage en bas à droite (qui se masque et se réaffiche selon
vos réglages, `Échap` ouvrant et fermant le panneau), les fonctionnalités
implémentées sont :

- 🕰 Horloge 12 h/24 h avec secondes, cadran analogique et salutation par
  période avec votre prénom
- 🌤 Météo en français (proxy d'origine `weather.bonjourr.fr`, ville
  personnalisable, ressenti, maximum du jour)
- 🔎 Barre de recherche (moteurs d'origine, saisie d'une URL aller-simple)
- 🔗 Liens rapides (ajout/édition/suppression, favicons automatiques)
- 📝 Notes en markdown léger et 📜 citations (classiques, personnalisées,
  par file d'attente)
- 🍅 Pomodoro (anneau SVG, enchaînement des modes, bip de fin)
- 🏞 Fonds d'écran par collection, URLs personnalisées ou couleur unie, avec
  flou, luminosité, fondus et crédits photo
- 🌘 Mode sombre, police et taille de texte personnalisées, ombre du texte,
  CSS personnalisé, favicon emoji et titre d'onglet
- 🌎 Interface française et anglaise ; réglages persistés en `localStorage`
  avec export/import JSON

Écarts assumés avec l'original (contexte d'une page de site, pas d'extension
navigateur) : pas de dossiers de liens ni glisser-déposer, pas de fonds vidéo
ni d'upload local avec EXIF, pas de placement libre des widgets.
