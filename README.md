# starbreakersnet-website

Site des Starbreakers : un **front Vue 3 + Vite** (TypeScript, Pinia, vue-router, Naive UI, Tailwind) et un backend **Supabase self-hosted**, installé selon la [procédure officielle](https://supabase.com/docs/guides/self-hosting/docker) : Postgres, comptes (Auth), API REST, temps réel, stockage de fichiers et Studio pour l'administration.

Aucun service tiers : tout tourne sur nos serveurs.

## Sommaire

- [Organisation du dépôt](#organisation-du-dépôt)
- [Prérequis](#prérequis)
- [Démarrage en local](#démarrage-en-local)
- [Base de données et migrations](#base-de-données-et-migrations)
- [Mettre à jour Supabase](#mettre-à-jour-supabase)
- [Build du front](#build-du-front)
- [Déploiement (staging / prod)](#déploiement-staging--prod)
- [Exploitation](#exploitation)

## Organisation du dépôt

| Chemin | Rôle |
|---|---|
| `src/`, `public/`… | Front Vue |
| `supabase/config.toml`, `supabase/migrations/` | Projet de la [CLI Supabase](https://supabase.com/docs/guides/cli) : le schéma de la base, en migrations SQL |
| `supabase/docker/` | Stack Supabase self-hosted : **copie du dossier [`docker/` officiel](https://github.com/supabase/supabase/tree/master/docker)**, version notée dans `.supabase-version` |
| `supabase/docker/docker-compose.starbreakers.yml` | Nos réglages, communs à tous les environnements (voir ci-dessous) |
| `supabase/docker/docker-compose.local.yml` | Local uniquement : Caddy (HTTPS), Mailpit, Postgres sur `127.0.0.1` |
| `supabase/docker/docker-compose.deploy.yml` | Staging/prod uniquement : réseau dédié partagé avec Ingressi |
| `supabase/docker/check-secrets.sh` | Garde-fou : refuse de démarrer avec des secrets d'exemple |
| `docker-compose.front.yml`, `Dockerfile.prod`, `nginx.conf` | Image du front (staging/prod) |
| `caddy/Caddyfile` | Proxy HTTPS local |

**Règle : on ne modifie pas les fichiers officiels de `supabase/docker/`.** Tout ce qui est propre au projet passe par le `.env` et par les trois fichiers d'override ci-dessus, pour que [`update.sh`](#mettre-à-jour-supabase) puisse mettre la stack à jour. Seule exception : les quatre lignes de `docker-compose.yml` activées par `utils/add-new-auth-keys.sh`, comme le fait l'installation officielle.

`docker-compose.starbreakers.yml` :
- **aucun port publié** : tout passe par le reverse proxy, comme dans les overrides de proxy officiels ;
- **pas de `container_name` fixe** : beta et live tournent sur le même serveur ;
- **données dans des volumes nommés** (`db-data`, `storage-data`, `studio-snippets`) : Dokploy vide le dossier du code à chaque déploiement ;
- **Edge Functions et Supavisor désactivés** : réactivables en retirant leurs lignes ;
- **règles de mot de passe** de GoTrue : 8 caractères minimum, avec minuscule, majuscule et chiffre, alignées avec `src/lib/validation.ts` ;
- **service `migrations`** : vérifie les secrets, puis applique `supabase/migrations`. La passerelle (et donc l'API et Studio) ne démarre que s'il réussit.

## Prérequis

- [Docker](https://docs.docker.com/get-started/) avec Docker Compose v2
- [Node.js](https://nodejs.org/) 22 avec Corepack. Le projet utilise **Yarn 4** (`packageManager` de `package.json`), avec les dépendances dans `node_modules` (`.yarnrc.yml`).
- `git` et `jq`, pour `update.sh`

## Démarrage en local

1. Cloner le dépôt et installer le front :
    ```bash
    git clone https://github.com/StarbreakersNet/starbreakersnet-website.git
    cd starbreakersnet-website
    corepack enable
    yarn install
    ```

2. Configurer la stack Supabase, avec les scripts officiels :
    ```bash
    cd supabase/docker
    cp .env.example .env
    sh utils/generate-keys.sh --update-env
    sh utils/add-new-auth-keys.sh --update-env
    sh run.sh config add starbreakers local
    ```
    Puis, dans `supabase/docker/.env`, mettre les valeurs locales :

    | Variable | Valeur locale |
    |---|---|
    | `SUPABASE_PUBLIC_URL` | `https://api.starbreakers.localhost` |
    | `API_EXTERNAL_URL` | `https://api.starbreakers.localhost/auth/v1` |
    | `SITE_URL` | `https://starbreakers.localhost` |
    | `ADDITIONAL_REDIRECT_URLS` | `https://starbreakers.localhost/**` |
    | `ENABLE_EMAIL_AUTOCONFIRM` | `true` |
    | `SMTP_HOST` / `SMTP_PORT` | `mailpit` / `1025` |
    | `SMTP_USER` / `SMTP_PASS` | vides |
    | `SMTP_ADMIN_EMAIL` | `noreply@starbreakers.localhost` |
    | `SMTP_SENDER_NAME` | `Starbreakers.net` |
    | `STUDIO_DEFAULT_ORGANIZATION` / `STUDIO_DEFAULT_PROJECT` | `Starbreakers.net` / `starbreakersnet-website` |

3. Démarrer la stack (depuis `supabase/docker`, ou avec la run configuration IntelliJ **dev**) :
    ```bash
    docker compose up -d
    ```
    `COMPOSE_FILE` (dans `.env`) ajoute nos overrides. Les migrations s'appliquent avant le démarrage de la passerelle.

4. Configurer et lancer le front (à la racine du dépôt) :
    ```bash
    cp .env.example .env    # VITE_SUPABASE_PUBLISHABLE_KEY = SUPABASE_PUBLISHABLE_KEY de supabase/docker/.env
    yarn dev
    ```

5. Faire confiance au certificat local (une fois, [voir plus bas](#certificat-https-local)), puis ouvrir :

    | URL | Rôle |
    |---|---|
    | https://starbreakers.localhost | Front (Vite) |
    | https://api.starbreakers.localhost | API : `/auth/v1`, `/rest/v1`, `/realtime/v1`, `/storage/v1` |
    | https://api.starbreakers.localhost/ | Studio, identifiants `DASHBOARD_USERNAME` / `DASHBOARD_PASSWORD` |
    | https://mail.starbreakers.localhost | Mailpit : tous les mails envoyés par Supabase (rien ne sort de la machine) |

6. Arrêter : `docker compose down` (depuis `supabase/docker`). Ajouter `-v` efface aussi les données locales.

Les seuls ports publiés en local (80/443 pour Caddy, 5432 pour Postgres) sont liés à `127.0.0.1`. Si votre navigateur résout `*.localhost` en IPv6 et que la connexion échoue, ajoutez les mêmes ports sur `[::1]` dans `docker-compose.local.yml`.

Avec `ENABLE_EMAIL_AUTOCONFIRM=true`, il n'y a pas de lien à cliquer à l'inscription, et GoTrue n'impose pas non plus la double confirmation lors d'un changement d'email. Pour tester le parcours réel, passer à `false` et relancer `docker compose up -d`.

### Certificat HTTPS local

Caddy signe les certificats de `*.starbreakers.localhost` avec sa CA interne, et exporte le certificat racine dans `caddy/local-ca/root.crt` (non versionné).

- **macOS** : `sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain caddy/local-ca/root.crt`
- **Windows** (PowerShell admin) : `certutil -addstore -f "ROOT" caddy\local-ca\root.crt`
- **Debian/Ubuntu** : `sudo cp caddy/local-ca/root.crt /usr/local/share/ca-certificates/starbreakers-local-ca.crt && sudo update-ca-certificates`
- **Fedora/RHEL** : `sudo cp caddy/local-ca/root.crt /etc/pki/ca-trust/source/anchors/starbreakers-local-ca.crt && sudo update-ca-trust`
- **Firefox** : importer le certificat (`about:preferences#privacy` → Certificats), ou activer `security.enterprise_roots.enabled`.

## Base de données et migrations

Le schéma est décrit par les migrations SQL de `supabase/migrations/`.

- **Créer une migration** (à la racine du dépôt) : `npx supabase migration new <nom>`.
- **L'appliquer en local** (depuis `supabase/docker`) : `docker compose run --rm migrations`. Elle est aussi appliquée à chaque `docker compose up`.
- **Une migration poussée sur GitHub est figée** : pour corriger, on écrit une nouvelle migration.
- **Une migration doit fonctionner avec le front déjà en ligne**, parce que le front et Supabase se déploient séparément. On ajoute d'abord (table, colonne facultative), on utilise ensuite. Supprimer ou renommer se fait en deux versions.
- **Nouvelles tables** : activer la RLS, écrire les policies, et donner des `grant` explicites (voir `20261107200033_user_settings.sql`).
- **Studio sert à administrer les données, jamais le schéma.** Une table ou une policy créée dans Studio n'existe pas dans le dépôt : l'environnement diverge.

## Mettre à jour Supabase

Avec le script officiel ([guide](https://supabase.com/docs/guides/self-hosting/updating)), en local, dans `supabase/docker` :

```bash
sh update.sh --dry-run    # aperçu
sh update.sh              # fusionne la nouvelle version officielle avec nos fichiers
docker compose pull && docker compose up -d
```

`update.sh` met à jour les fichiers officiels en gardant nos modifications, et signale les conflits et les changements cassants. Nos fichiers `docker-compose.starbreakers.yml`, `docker-compose.local.yml` et `docker-compose.deploy.yml` ne sont pas touchés : relire le [CHANGELOG](supabase/docker/CHANGELOG.md) pour vérifier qu'ils restent valables.

Ensuite : tester en local, commiter (y compris `.supabase-version`), puis déployer l'application Supabase sur beta, et enfin sur live. Sauvegarder la base avant chaque mise à jour.

> `.supabase-version` est versionné volontairement, même si le fichier dit « Do not commit » (le dossier officiel l'ignore parce qu'il s'attend à être installé hors de git). Ici, le dépôt est la source de chaque déploiement : `update.sh` a besoin de savoir de quelle version on part.

## Build du front

```bash
yarn build      # type-check + build Vite dans dist/
yarn preview    # sert dist/ en local
```

L'image (`Dockerfile.prod`) installe les dépendances avec `yarn install --immutable`, construit le front avec `VITE_SUPABASE_URL` et `VITE_SUPABASE_PUBLISHABLE_KEY` passées en build args (le `.env` n'entre pas dans l'image), puis le sert avec nginx (`nginx.conf`, fallback SPA). Pour la tester en local :

```bash
docker build -f Dockerfile.prod -t starbreakersnet-front \
  --build-arg VITE_SUPABASE_URL=https://api.starbreakers.localhost \
  --build-arg VITE_SUPABASE_PUBLISHABLE_KEY=<clé> .
docker run --rm -p 127.0.0.1:8080:80 starbreakersnet-front
```

## Déploiement (staging / prod)

Chaque environnement (beta depuis `develop`, live depuis `master`) a **deux applications Dokploy** dans le projet StarbreakersNet : **Supabase**, déployée rarement, et **Front**, déployée à chaque évolution du site. Le reverse proxy HTTPS est **Ingressi**, en dehors de ce dépôt.

### Une fois par environnement, sur le serveur

```bash
docker network create sbn-beta-edge    # sbn-live-edge pour la prod
```

Ce réseau ne doit contenir que la passerelle Supabase, le front et Ingressi : Ingressi le rejoint depuis son propre compose. Aucun autre conteneur du serveur ne peut ainsi joindre l'API sans passer par Ingressi.

### Application « Supabase » (type Compose)

- **Compose Path** : `supabase/docker/docker-compose.yml`
- **Advanced → Command** (remplace la commande par défaut ; `<appName>` est le nom Dokploy de l'application) :
    ```
    compose -p <appName> -f supabase/docker/docker-compose.yml -f supabase/docker/docker-compose.starbreakers.yml -f supabase/docker/docker-compose.deploy.yml up -d --remove-orphans
    ```
    Pas de `--force-recreate` : avec, une migration en échec couperait l'API au lieu de la laisser tourner sur l'ancien schéma.
- **Environment** : un `.env` complet, généré pour cet environnement avec les scripts officiels (`generate-keys.sh`, puis `add-new-auth-keys.sh`, dans une copie de `supabase/docker`), avec :
    - `STACK_NAME=sbn-beta` (ou `sbn-live`) ;
    - `SUPABASE_PUBLIC_URL=https://<domaine de l'API>` et `API_EXTERNAL_URL=https://<domaine de l'API>/auth/v1` ;
    - `SITE_URL=https://<domaine du site>` et `ADDITIONAL_REDIRECT_URLS=https://<domaine du site>/**` ;
    - `ENABLE_EMAIL_AUTOCONFIRM=false` ;
    - SMTP OVH : `SMTP_HOST=ssl0.ovh.net`, `SMTP_PORT=465` (SSL) ou `587` (STARTTLS), identifiants de la boîte, `SMTP_ADMIN_EMAIL=noreply@starbreakers.net`, `SMTP_SENDER_NAME=Starbreakers.net`.
- **Watch Paths** : `supabase/**`
- **Isolated Deployments** : activé
- **Volume Backups** : `db-data` (et `storage-data` pour les fichiers)

Si un secret vaut encore sa valeur d'exemple, ou si une migration échoue, la passerelle ne démarre pas et le déploiement apparaît en échec dans Dokploy.

Le dossier du code étant re-cloné à chaque déploiement, les conteneurs déjà démarrés gardent l'ancienne version des fichiers de config montés depuis le dépôt (`volumes/api/envoy/*`…). Si une mise à jour de Supabase change ces fichiers sans changer l'image, redémarrer le service concerné.

### Application « Front » (type Compose)

- **Compose Path** : `docker-compose.front.yml` (commande par défaut)
- **Environment** : `STACK_NAME`, `VITE_SUPABASE_URL` (le domaine de l'API), `VITE_SUPABASE_PUBLISHABLE_KEY` (celle de l'application Supabase du même environnement)
- **Watch Paths** : `src/**`, `public/**`, `index.html`, `package.json`, `yarn.lock`, `.yarnrc.yml`, `vite.config.ts`, `tsconfig*.json`, `env.d.ts`, `Dockerfile.prod`, `nginx.conf`, `docker-compose.front.yml`

### Ingressi

| Proxy host | Upstream |
|---|---|
| Domaine du site | `http://sbn-beta-front:80` (ou `sbn-live-front`) |
| Domaine de l'API | `http://sbn-beta-api:8000` (ou `sbn-live-api`) |

Studio est servi sur `https://<domaine de l'API>/`, derrière le basic-auth `DASHBOARD_USERNAME` / `DASHBOARD_PASSWORD` de la passerelle officielle. Protection recommandée en plus : le portail **Forward Auth** d'Ingressi sur le domaine de l'API, avec en **Excluded Paths** les routes publiques de l'API : `/auth/v1/*, /rest/v1/*, /realtime/v1/*, /storage/v1/*` (le `*` final est obligatoire). Le temps réel passe par des WebSockets (`/realtime/v1/websocket`), qu'Ingressi (Caddy) relaie nativement.

### Vérifications après le premier déploiement d'un environnement

- [ ] Sur le serveur, aucun conteneur de la stack ne publie de port :
    ```bash
    docker ps --format '{{.Names}}\t{{.Ports}}' | grep 0.0.0.0
    ```
- [ ] Depuis une machine extérieure, les ports internes ne répondent pas (« timed out ») :
    ```bash
    for port in 5432 6543 8000 3000; do nc -vz -w 3 starbreakers.net $port; done
    ```
- [ ] `https://<domaine de l'API>/` demande une authentification (Studio).
- [ ] `https://<domaine de l'API>/auth/v1/health` avec l'en-tête `apikey: <SUPABASE_PUBLISHABLE_KEY>` répond `200`.
- [ ] Logs du service `migrations` : secrets acceptés, migrations appliquées.
- [ ] Inscription → mail de confirmation reçu → connexion → `/account` → mot de passe oublié.

## Exploitation

| Besoin | Commande (dans `supabase/docker`, ou onglets Logs / Advanced de Dokploy) |
|---|---|
| État des services | `docker compose ps` |
| Logs d'un service | `docker compose logs -f auth` |
| Redémarrer un service | `docker compose restart auth` |
| Sauvegarde ponctuelle de la base | `docker compose exec db pg_dump -U postgres postgres > sauvegarde.sql` |
| Sauvegardes régulières | Volume Backups de Dokploy sur `db-data` et `storage-data` |
| Changer le mot de passe Postgres | `sh utils/db-passwd.sh` (script officiel) |
| Renouveler les clés d'API | `sh utils/rotate-new-api-keys.sh` (script officiel), puis rebuild du front |

Services actifs : `db`, `auth`, `rest`, `realtime`, `storage`, `imgproxy`, `meta`, `studio`, `api-gw` (Envoy), plus `migrations` à chaque démarrage. Désactivés : `functions`, `supavisor`. Les logs centralisés (`docker-compose.logs.yml`) ne sont pas activés.
