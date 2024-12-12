# starbreakersnet-website

Ce projet est un site web développé avec **Vue 3** et **Vite**, et inclut un **backoffice** géré avec **Directus** (un CMS Headless). Le front-end permet d'afficher des données dynamiques provenant du CMS via une API. Vous pouvez configurer un environnement de développement de deux manières : en utilisant **Docker Compose** ou directement avec **npm**.

## Prérequis

Avant de commencer, assurez-vous d'avoir les outils suivants installés sur votre machine :

### Pour l'installation via Docker Compose

- [Docker](https://www.docker.com/get-started) version 20.10 ou supérieure
- [Docker Compose](https://docs.docker.com/compose/) version 1.29 ou supérieure

### Pour l'installation avec npm

- [Node.js](https://nodejs.org/) version 20 ou supérieure
- [npm](https://www.npmjs.com/) (généralement installé avec Node.js)

## Configuration du fichier `.env`

Avant de démarrer l'application, vous devez configurer les variables d'environnement. Un fichier d'exemple `.env.example` est fourni pour vous guider.

1. Dupliquez le fichier `.env.example` et renommez-le en `.env` :
    ```bash
    cp .env.example .env
    ```

2. Ouvrez le fichier `.env` et configurez les variables selon vos besoins. Voici un exemple des variables que vous pourriez y trouver :
    ```env
    APP_PORT=8081
    APP_URL=example.com
    VITE_API_URL=api.example.com
    DIRECTUS_PORT=8055
    DIRECTUS_ADMIN_EMAIL=admin@example.com
    DIRECTUS_ADMIN_PASSWORD=your_admin_password
    DIRECTUS_ADMIN_TOKEN=your_super_admin_secret_token
    ```

    - **APP_PORT** : Le port que l'application doit utiliser.
    - **APP_URL** : L'url du site pour établire le CORS de Directus
    - **VITE_API_URL** : L'url que le front va utiliser pour les requêtes à l'api
    - **DIRECTUS_PORT** : Le port que le backoffice va utiliser.
    - **DIRECTUS_ADMIN_EMAIL** : L'identifiant du compte admin du backoffice.
    - **DIRECTUS_ADMIN_PASSWORD** : Le mot de passe du compte admin du backoffice.
    - **DIRECTUS_ADMIN_TOKEN** : La clé API pour authentifier les requêtes.

Assurez-vous que les valeurs dans le fichier `.env` sont correctes avant de continuer.

## Installation et Configuration

### Option 1 : Utilisation de Docker Compose

Cette méthode permet de configurer et de lancer l'environnement de développement à l'aide de **Docker Compose**, ce qui rend le projet indépendant de l'environnement de votre machine.

1. Clonez le dépôt sur votre machine locale :
    ```bash
    git clone https://gitlab.com/starbreakersdevteam/starbreakersnet-website.git
    cd ton-projet
    ```

2. Construisez et démarrez les conteneurs Docker :
    ```bash
    docker-compose --profile dev up --build
    ```

3. Accédez à l'application dans votre navigateur à l'URL suivante :
    ```
    http://localhost:8081 (ou celui défini dans le .env)
    ```

4. Pour arrêter les conteneurs :
    ```bash
    docker-compose down
    ```

### Option 2 : Utilisation de npm

Si vous préférez ne pas utiliser Docker, vous pouvez également configurer l'environnement de développement en utilisant directement **npm**.

1. Clonez le dépôt sur votre machine locale :
    ```bash
    git clone https://gitlab.com/starbreakersdevteam/starbreakersnet-website.git
    cd ton-projet
    ```

2. Installez les dépendances du projet :
    ```bash
    npm install
    ```

3. Démarrez le serveur de développement :
    ```bash
    npm run dev
    ```

4. Accédez à l'application dans votre navigateur à l'URL suivante :
    ```
    http://localhost:5174 (ou celui défini dans le .env)
    ```

5. Pour arrêter le serveur de développement, utilisez `Ctrl + C` dans le terminal.

## Compilation pour la Production

Que vous utilisiez Docker ou npm, vous pouvez créer une version optimisée de votre application pour la production en suivant ces étapes :

### Avec Docker Compose

1. Construisez l'image pour la production :
    ```bash
    docker-compose --profile default up --build
    ```

2. Votre application sera accessible via Docker à l'URL configurée dans votre fichier `.env`.

### Avec npm

1. Compilez et minifiez le code pour la production :
    ```bash
    npm run build
    ```

2. Les fichiers de production seront générés dans le dossier `dist/`.


