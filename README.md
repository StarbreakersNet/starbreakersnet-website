# starbreakersnet-website

Site des Starbreakers : front **Vue 3 + Vite** (TypeScript, Pinia, vue-router, Naive UI, Tailwind) et backend **Supabase self-hosted** (Postgres, authentification GoTrue, API REST PostgREST, passerelle Kong, dashboard Studio).

Aucun service tiers : pas de Supabase Cloud, tout tourne dans `docker-compose.yml`.

## Sommaire

- [Prérequis](#prérequis)
- [Démarrage en local](#démarrage-en-local)
- [Variables d'environnement](#variables-denvironnement)
- [Base de données et migrations](#base-de-données-et-migrations)
- [Build de production](#build-de-production)
- [Déploiement (staging / prod)](#déploiement-staging--prod)

## Prérequis

- [Docker](https://docs.docker.com/get-started/) avec Docker Compose v2
- [Node.js](https://nodejs.org/) 22 avec Corepack (fourni avec Node). Le projet utilise **Yarn 4**, installé par Corepack d'après le champ `packageManager` de `package.json`. Les dépendances sont installées dans `node_modules` (`.yarnrc.yml`).

## Démarrage en local

En local, la stack Supabase, Caddy et Mailpit tournent dans Docker, et le front tourne directement sur la machine avec Vite.

1. Cloner le dépôt et installer les dépendances :
    ```bash
    git clone https://github.com/StarbreakersNet/starbreakersnet-website.git
    cd starbreakersnet-website
    corepack enable
    yarn install
    ```

2. Créer le `.env` et générer les secrets :
    ```bash
    cp .env.example .env
    node backend/generate-keys.js
    ```
    Reporter dans le `.env` les lignes affichées (`POSTGRES_PASSWORD`, `JWT_SECRET`, `ANON_KEY`, `SERVICE_ROLE_KEY`, `DASHBOARD_PASSWORD`, `PG_META_CRYPTO_KEY`) et choisir un `DASHBOARD_USERNAME`. Le service `migrations` refuse de démarrer tant qu'un secret vaut `change_me_…` ou est vide.

    > `POSTGRES_PASSWORD` n'est appliqué qu'à la création de la base (volume Docker `db-data`). Pour en changer ensuite en local, supprimer le volume : `docker volume rm starbreakersnet-website_db-data` (les données locales sont perdues).

3. Démarrer la stack (ou la run configuration IntelliJ **dev**) :
    ```bash
    docker compose --profile dev -f docker-compose.yml -f docker-compose.dev.yaml up -d
    ```
    Cela démarre Postgres (`db`), GoTrue (`auth`), PostgREST (`rest`), Studio (`studio` + `meta`), Caddy et Mailpit, applique les migrations (service one-shot `migrations`), puis démarre Kong. Kong attend la réussite de `migrations` : si un secret est invalide ou qu'une migration échoue, l'API ne démarre pas et `up` renvoie une erreur.

4. Démarrer le front :
    ```bash
    yarn dev
    ```

5. Faire confiance au certificat HTTPS local (une seule fois, voir [plus bas](#certificat-https-local)), puis ouvrir :

    | URL | Rôle |
    |---|---|
    | https://starbreakers.localhost | Front (Vite) |
    | https://api.starbreakers.localhost | API (Kong) : `/auth/v1`, `/rest/v1` |
    | https://api.starbreakers.localhost/ | Studio, identifiants `DASHBOARD_USERNAME` / `DASHBOARD_PASSWORD` |
    | https://mail.starbreakers.localhost | Mailpit : tous les mails envoyés par GoTrue (rien ne sort de la machine) |

6. Arrêter la stack :
    ```bash
    docker compose --profile dev -f docker-compose.yml -f docker-compose.dev.yaml down
    ```

Les ports de Caddy (80/443) et de Postgres (5432) sont liés à `127.0.0.1` dans `docker-compose.dev.yaml` : rien n'est joignable depuis le réseau local. Si votre navigateur résout `*.localhost` en IPv6 (`::1`) et que la connexion échoue, ajoutez les mêmes ports sur `[::1]` dans `docker-compose.dev.yaml`.

### Certificat HTTPS local

Caddy signe les certificats de `*.starbreakers.localhost` avec sa CA interne. Au démarrage, il exporte le certificat racine dans `caddy/local-ca/root.crt` (non versionné). Il reste valable tant que le volume `caddy_data` existe.

- **macOS** :
    ```bash
    sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain caddy/local-ca/root.crt
    ```
- **Windows** (PowerShell en admin) :
    ```powershell
    certutil -addstore -f "ROOT" caddy\local-ca\root.crt
    ```
- **Linux** (Debian/Ubuntu) :
    ```bash
    sudo cp caddy/local-ca/root.crt /usr/local/share/ca-certificates/starbreakers-local-ca.crt
    sudo update-ca-certificates
    ```
- **Linux** (Fedora/RHEL) :
    ```bash
    sudo cp caddy/local-ca/root.crt /etc/pki/ca-trust/source/anchors/starbreakers-local-ca.crt
    sudo update-ca-trust
    ```
- **Firefox** utilise son propre magasin : importer le certificat (`about:preferences#privacy` → Certificats → Importer), ou activer `security.enterprise_roots.enabled` dans `about:config`.

### Mails en local

`ENABLE_EMAIL_AUTOCONFIRM=true` (valeur par défaut du `.env.example`) évite de confirmer l'adresse à l'inscription. Les autres mails (mot de passe oublié, changement d'adresse) arrivent dans Mailpit.

Pour tester le parcours réel, passer `ENABLE_EMAIL_AUTOCONFIRM=false` et redémarrer `auth`. Avec l'autoconfirm, GoTrue n'impose pas non plus la double confirmation (ancienne et nouvelle adresse) lors d'un changement d'email.

## Variables d'environnement

Toutes les variables sont dans `.env` (modèle : `.env.example`). Les constantes internes (hôtes, ports, schémas, durée des JWT, règles de mot de passe…) sont écrites dans `docker-compose.yml`.

| Variable | Rôle |
|---|---|
| `APP_DOMAIN`, `API_DOMAIN` | Domaines du front et de l'API. Toutes les URL de la stack en dérivent (site URL de GoTrue, CORS de Kong, URL publique de Studio…). |
| `POSTGRES_PASSWORD`, `JWT_SECRET`, `ANON_KEY`, `SERVICE_ROLE_KEY`, `DASHBOARD_PASSWORD`, `PG_META_CRYPTO_KEY` | Secrets, générés par `node backend/generate-keys.js`, différents pour chaque environnement. `SERVICE_ROLE_KEY` peut rester vide. Avec un `JWT_SECRET` en argument, le script ne régénère que les clés API. |
| `DASHBOARD_USERNAME` | Identifiant du basic-auth de Studio. |
| `VITE_API_URL`, `VITE_API_ANON_KEY` | Seules variables lues par le front, déclarées après les secrets parce que les `${…}` sont résolues dans l'ordre du fichier. En production, elles sont intégrées au bundle au moment du build. |
| `ENABLE_EMAIL_AUTOCONFIRM` | `true` en local, `false` en staging/prod. |
| `GOTRUE_SMTP_*` | SMTP OVH (`ssl0.ovh.net`, port 465 SSL ou 587 STARTTLS, expéditeur `noreply@starbreakers.net`). En local, `docker-compose.dev.yaml` redirige tout vers Mailpit. |

## Base de données et migrations

Le schéma est géré par des migrations SQL dans `backend/migrations/`, appliquées par la [CLI Supabase](https://supabase.com/docs/guides/cli) (`supabase db push`). Le service one-shot `migrations` le fait automatiquement à chaque `docker compose up`, après avoir vérifié les secrets (`backend/check-secrets.sh`). Kong ne démarre qu'une fois ce service terminé avec succès.

Les données Postgres sont dans le volume Docker nommé `db-data`, pas dans le dépôt.

- **Une migration poussée sur GitHub est figée** : toute modification de schéma passe par une nouvelle migration.
- Créer une migration : ajouter un fichier `backend/migrations/<horodatage UTC AAAAMMJJHHMMSS>_<nom>.sql`, par exemple `20261107200033_user_settings.sql`. C'est ce que fait `supabase migration new`, mais la CLI attend un dossier nommé `supabase` et ne trouve pas `backend`.
- Appliquer les nouvelles migrations en local :
    ```bash
    docker compose -f docker-compose.yml -f docker-compose.dev.yaml run --rm migrations
    ```
- `backend/config.toml` est le gabarit de `supabase init`. Seule sa présence compte (sans lui, la CLI répond « up to date » sans rien appliquer), son contenu ne s'applique pas à la stack Docker. Ne pas le supprimer.
- Nouvelles tables du schéma `public` : activer la RLS, écrire les policies et donner des `grant` explicites à `authenticated` (voir `20261107200033_user_settings.sql`). Ne pas compter sur l'exposition automatique, que Supabase abandonne.

**Studio sert à administrer les données, jamais le schéma.** En staging et en prod, une table, colonne, policy ou fonction créée dans Studio n'existe pas dans le dépôt : l'environnement diverge. Toute modification de structure passe par une migration.

## Build de production

```bash
yarn build          # type-check + build Vite dans dist/
yarn preview        # sert dist/ en local
```

L'image Docker du front (`Dockerfile.prod`, service `app`, profil `default`) installe les dépendances avec `yarn install --immutable`, construit le front avec `VITE_API_URL` et `VITE_API_ANON_KEY` passées en build args (le `.env` n'entre pas dans l'image), puis le sert avec nginx (`nginx.conf`, fallback SPA vers `index.html`).

`docker-compose.yml` ne publie aucun port : en local, `app` n'est pas joignable. Pour tester l'image seule :

```bash
docker compose --profile default build app
docker run --rm -p 127.0.0.1:8080:80 starbreakersnet-website-app
```

## Déploiement (staging / prod)

Deux projets Dokploy sur le même serveur : `starbreakersnet-website-beta` (staging) et `starbreakersnet-website-live` (prod). Le reverse proxy HTTPS est **Ingressi** (basé sur Caddy), en dehors de ce dépôt.

### Configuration

- **Profil** : le service `app` est sous le profil `default`. Il doit être activé sur Dokploy (`COMPOSE_PROFILES=default` dans l'environnement, ou `--profile default` dans la commande), sinon le front ne démarre pas.
- **Isolated Deployments** activé sur les deux projets : chaque environnement a son propre réseau.
- **`.env`** rempli à la main dans Dokploy, avec des secrets générés pour cet environnement (`node backend/generate-keys.js`), `ENABLE_EMAIL_AUTOCONFIRM=false` et les identifiants SMTP OVH.
- **Aucun port publié** : `kong` et `app` ne sont joignables que par Ingressi. *(Rattachement au réseau d'Ingressi : configuration en cours de validation.)*
- **Données** : la base est dans le volume nommé `db-data`. Dokploy refait un `git clone` à chaque déploiement, ce qui vide le dossier du code : rien de persistant ne doit y être stocké. Ce volume peut être sauvegardé avec les Volume Backups de Dokploy.
- **Échec du déploiement** si un secret vaut encore `change_me_…` ou si une migration échoue : Kong ne démarre pas et `docker compose up` renvoie une erreur.

### Studio

Studio est servi par Kong sur `https://<API_DOMAIN>/` (toute route autre que `/auth/v1/*`, `/rest/v1/*` et `/pg/*`), derrière le basic-auth `DASHBOARD_USERNAME` / `DASHBOARD_PASSWORD`. C'est la configuration officielle de Supabase self-hosted.

- Joignable uniquement en HTTPS via Ingressi, jamais par un port publié.
- `DASHBOARD_PASSWORD` aléatoire et long (généré par le script).
- Données uniquement, jamais le schéma (voir plus haut).

### Vérifications après le premier déploiement d'un environnement

- [ ] Sur le serveur, aucun conteneur de la stack ne publie de port :
    ```bash
    docker ps --format '{{.Names}}\t{{.Ports}}' | grep 0.0.0.0
    ```
- [ ] Depuis une machine extérieure, les ports internes ne répondent pas (« timed out ») :
    ```bash
    for port in 5432 8000 8443 3000; do nc -vz -w 3 starbreakers.net $port; done
    ```
- [ ] `https://<API_DOMAIN>/` demande une authentification (Studio).
- [ ] `https://<API_DOMAIN>/rest/v1/` avec l'en-tête `apikey: <ANON_KEY>` répond normalement.
- [ ] `https://<API_DOMAIN>/auth/v1/health` avec la même clé répond `200`.
- [ ] Logs du service `migrations` : secrets acceptés et migrations appliquées.
- [ ] Inscription → mail de confirmation reçu → connexion → `/account` → mot de passe oublié.
