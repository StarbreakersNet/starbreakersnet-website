# starbreakersnet-website

Ce projet est un site web développé avec **Vue 3** et **Vite**, et inclut un **backoffice** propulsé par **Supabase** self-hosted (Postgres, authentification, API REST auto-générée et dashboard admin Studio). Le front-end permet d'afficher des données dynamiques et de gérer l'authentification des utilisateurs. Vous pouvez configurer un environnement de développement de deux manières : en utilisant **Docker Compose** ou directement avec **npm**.

## Prérequis

Avant de commencer, assurez-vous d'avoir les outils suivants installés sur votre machine :

### Pour l'installation via Docker Compose

- [Docker](https://www.docker.com/get-started) version 20.10 ou supérieure
- [Docker Compose](https://docs.docker.com/compose/) version 1.29 ou supérieure

### Pour l'installation avec npm

- [Node.js](https://nodejs.org/) version 20 ou supérieure
- [npm](https://www.npmjs.com/) (généralement installé avec Node.js)

### Pour les migrations de base de données

- [Supabase CLI](https://supabase.com/docs/guides/cli) — les migrations de schéma (`supabase/migrations`) sont appliquées avec `supabase db push`, pas de script maison.

## Configuration du fichier `.env`

Avant de démarrer l'application, vous devez configurer les variables d'environnement. Un fichier d'exemple `.env.example` est fourni pour vous guider.

1. Dupliquez le fichier `.env.example` et renommez-le en `.env` :
    ```bash
    cp .env.example .env
    ```

2. Ouvrez le fichier `.env` et configurez les variables selon vos besoins :

    - **APP_PORT** : Le port que l'application doit utiliser (build de production).
    - **VITE_PORT** : Le port du serveur de développement Vite.
    - **VITE_API_URL** / **VITE_SUPABASE_URL** : L'URL que le front va utiliser pour les requêtes à l'API Supabase (Kong).
    - **VITE_SUPABASE_ANON_KEY** : La clé publique `anon` de Supabase (voir `ANON_KEY` ci-dessous).
    - **POSTGRES_PASSWORD**, **JWT_SECRET**, **ANON_KEY**, **SERVICE_ROLE_KEY**, **DASHBOARD_USERNAME**, **DASHBOARD_PASSWORD**, **PG_META_CRYPTO_KEY** : secrets de la stack Supabase. **Générez des valeurs propres à chaque environnement, ne gardez jamais les exemples.**
    - **API_EXTERNAL_URL** / **SUPABASE_PUBLIC_URL** : l'URL publique de l'API (Kong).
    - **GOTRUE_SITE_URL** / **GOTRUE_URI_ALLOW_LIST** : l'URL du front, utilisée pour construire les liens de confirmation d'email.
    - **ENABLE_EMAIL_AUTOCONFIRM** : `true` en local (pas de SMTP disponible), `false` en Staging/Prod (SMTP branché sur le serveur mail OVH, voir les variables `GOTRUE_SMTP_*`).
    - **CORS_ALLOWED_ORIGIN** : l'origine autorisée par Kong pour les appels du front.

    Pour générer `JWT_SECRET`, `ANON_KEY` et `SERVICE_ROLE_KEY` propres à votre environnement, utilisez le générateur officiel : https://supabase.com/docs/guides/self-hosting/docker#securing-your-services (section _Generate API Keys_), ou la commande `openssl rand -base64 40` pour un secret aléatoire suivi de la génération des JWT `anon`/`service_role` signés avec ce secret.

Assurez-vous que les valeurs dans le fichier `.env` sont correctes avant de continuer.

## Installation et Configuration

### Option 1 : Utilisation de Docker Compose

Cette méthode permet de configurer et de lancer l'environnement de développement à l'aide de **Docker Compose**, ce qui rend le projet indépendant de l'environnement de votre machine.

1. Clonez le dépôt sur votre machine locale :
    ```bash
    git clone https://gitlab.com/starbreakersdevteam/starbreakersnet-website.git
    cd ton-projet
    ```

2. Démarrez la stack Supabase et le reverse proxy Caddy :
    ```bash
    docker compose --profile dev up --build
    ```
   Cela démarre Postgres, l'authentification (`auth`), l'API REST (`rest`), la passerelle (`kong`), le dashboard admin (`studio` + `meta`) et Caddy.

3. Démarrez le serveur de développement du front directement sur votre machine (voir Option 2 ci-dessous) — le front n'est pas conteneurisé en local pour éviter les contraintes d'IDE/sync.

4. Faites confiance au certificat HTTPS local généré par Caddy (une seule fois, voir section suivante), puis accédez à :
    ```
    https://starbreakers.localhost         (front)
    https://api.starbreakers.localhost     (API)
    https://studio.starbreakers.localhost  (dashboard admin, identifiants DASHBOARD_USERNAME/DASHBOARD_PASSWORD)
    ```

5. Pour arrêter les conteneurs :
    ```bash
    docker compose down
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
   Ou, si la stack Supabase/Caddy tourne (Option 1), via `https://starbreakers.localhost`.

5. Pour arrêter le serveur de développement, utilisez `Ctrl + C` dans le terminal.

## Faire confiance au certificat HTTPS local (Caddy)

Caddy détecte que les domaines `*.starbreakers.localhost` ne sont pas publics et génère/signe automatiquement des certificats via sa **CA interne** (pas besoin de mkcert). Cette CA est générée à l'intérieur du conteneur, donc invisible du magasin de certificats de la machine hôte tant qu'elle n'a pas été extraite et ajoutée manuellement — **une seule fois**, tant que le volume `caddy_data` persiste (ne pas le supprimer sous peine de devoir refaire cette opération).

1. Démarrez la stack (`docker compose --profile dev up -d`), puis extrayez le certificat de la CA interne (identique sur les trois OS) :
    ```bash
    docker compose exec caddy cat /data/caddy/pki/authorities/local/root.crt > local-ca.crt
    ```

2. Ajoutez ce certificat au magasin de confiance de votre système :

    **macOS** :
    ```bash
    sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain local-ca.crt
    ```

    **Windows** (PowerShell en admin) :
    ```powershell
    certutil -addstore -f "ROOT" local-ca.crt
    ```

    **Linux** (Debian/Ubuntu) :
    ```bash
    sudo cp local-ca.crt /usr/local/share/ca-certificates/local-ca.crt
    sudo update-ca-certificates
    ```

    **Linux** (Fedora/RHEL) :
    ```bash
    sudo cp local-ca.crt /etc/pki/ca-trust/source/anchors/
    sudo update-ca-trust
    ```

3. **Cas particulier Firefox** (tous OS) : Firefox utilise son propre magasin de certificats (NSS), indépendant du système — l'étape précédente ne suffit pas pour lui. Deux options :
    - Importer le certificat manuellement : `about:preferences#privacy` → Certificates → View Certificates → Import → sélectionner `local-ca.crt`.
    - Ou activer `security.enterprise_roots.enabled` dans `about:config` pour que Firefox utilise le magasin de confiance du système.

> `.localhost` résout automatiquement vers `127.0.0.1` sur la plupart des OS/navigateurs modernes (RFC 6761). Si ce n'est pas le cas dans votre environnement, ajoutez les domaines à votre fichier `hosts`.

## Base de données — migrations

Les migrations de schéma sont gérées avec la CLI Supabase, pas de script maison. La stack étant self-hosted (pas un projet supabase.com), on cible directement l'URL de connexion Postgres de l'environnement visé plutôt que `supabase link` :

```bash
supabase db push --db-url postgresql://postgres:<POSTGRES_PASSWORD>@<host>:<POSTGRES_PORT>/postgres
```

Pour créer une nouvelle migration :

```bash
supabase migration new nom_de_la_migration
```

À appliquer avec `supabase db push` contre chaque environnement (dev, staging, prod) — pas d'application automatique au démarrage des conteneurs.

## Compilation pour la Production

Que vous utilisiez Docker ou npm, vous pouvez créer une version optimisée de votre application pour la production en suivant ces étapes :

### Avec Docker Compose

1. Construisez l'image pour la production :
    ```bash
    docker compose --profile default up --build
    ```

2. Votre application sera accessible via Docker à l'URL configurée dans votre fichier `.env`.

### Avec npm

1. Compilez et minifiez le code pour la production :
    ```bash
    npm run build
    ```

2. Les fichiers de production seront générés dans le dossier `dist/`.
