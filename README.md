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
| `supabase/templates/` | Modèles des mails d'authentification, en français et en anglais (voir [son README](supabase/templates/README.md)) |
| `supabase/docker/` | Stack Supabase self-hosted : **copie du dossier [`docker/` officiel](https://github.com/supabase/supabase/tree/master/docker)**, version notée dans `.supabase-version` |
| `supabase/docker/docker-compose.starbreakers.yml` | Nos réglages, communs à tous les environnements (voir ci-dessous) |
| `supabase/docker/docker-compose.local.yml` | Local uniquement : Caddy (HTTPS), Mailpit, Postgres sur `127.0.0.1` |
| `supabase/docker/docker-compose.deploy.yml` | Staging/prod uniquement : passerelle publiée sur l'IP du bridge Docker, pour Ingressi |
| `supabase/docker/check-secrets.sh` | Garde-fou : refuse de démarrer avec des secrets d'exemple |
| `docker-compose.front.yml`, `Dockerfile.prod`, `nginx.conf` | Image du front (staging/prod) |
| `scripts/setup-env.mjs` | Génération des `.env` (`yarn env:local`, `yarn env:deploy`) |
| `caddy/Caddyfile` | Proxy HTTPS local |

**Règle : on ne modifie pas les fichiers officiels de `supabase/docker/`.** Tout ce qui est propre au projet passe par le `.env` et par les trois fichiers d'override ci-dessus, pour que [`update.sh`](#mettre-à-jour-supabase) puisse mettre la stack à jour. Seule exception : les quatre lignes de `docker-compose.yml` activées par `utils/add-new-auth-keys.sh`, comme le fait l'installation officielle.

`docker-compose.starbreakers.yml` :
- **aucun port publié** : tout passe par le reverse proxy, comme dans les overrides de proxy officiels (en staging/prod, `docker-compose.deploy.yml` publie seulement la passerelle sur l'IP du bridge Docker) ;
- **pas de `container_name` fixe** : beta et live tournent sur le même serveur ;
- **données dans des volumes nommés** (`db-data`, `storage-data`, `studio-snippets`) : Dokploy vide le dossier du code à chaque déploiement ;
- **Edge Functions et Supavisor désactivés** : réactivables en retirant leurs lignes ;
- **règles de mot de passe** de GoTrue : 8 caractères minimum, avec minuscule, majuscule et chiffre, alignées avec `src/utils/validation.ts` ;
- **mails d'authentification en français** (ou en anglais selon `user_metadata.locale`) : modèles de `supabase/templates`, servis à GoTrue par le service interne `mail-templates` (image nginx reconstruite à chaque `up`), et objets des mails ;
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

2. Générer les deux `.env` (stack Supabase et front) :
    ```bash
    yarn env:local
    ```
    Le script (`scripts/setup-env.mjs`, sans dépendance) :
    - crée `supabase/docker/.env` depuis `.env.example` et génère tous les secrets avec les scripts officiels (`utils/generate-keys.sh`, puis `utils/add-new-auth-keys.sh`) ;
    - y écrit les valeurs locales ci-dessous, et active nos overrides (`sh run.sh config add starbreakers local`, qui renseigne `COMPOSE_FILE`) ;
    - crée `.env` (front) avec l'URL de l'API et la clé `SUPABASE_PUBLISHABLE_KEY` ;
    - affiche les adresses et les identifiants de Studio.

    Il peut être relancé sans risque : les secrets existants sont conservés, seules les valeurs locales sont réécrites. Pour repartir de zéro : `docker compose down -v` (depuis `supabase/docker`), supprimer `supabase/docker/.env`, puis relancer.

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
    | `SMTP_SENDER_NAME` | `StarbreakersNet` |
    | `STUDIO_DEFAULT_ORGANIZATION` / `STUDIO_DEFAULT_PROJECT` | `StarbreakersNet` / `starbreakersnet-website` |

3. Démarrer la stack (depuis `supabase/docker`, ou avec la run configuration IntelliJ **dev**) :
    ```bash
    cd supabase/docker
    docker compose up -d
    ```
    `COMPOSE_FILE` (dans `.env`) ajoute nos overrides. Les migrations s'appliquent avant le démarrage de la passerelle.

4. Lancer le front (à la racine du dépôt) :
    ```bash
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

### Ports déjà utilisés sur le poste

Si `docker compose up` répond `address already in use` (autre conteneur web, autre Postgres…) :

1. Relancer le script avec d'autres ports. Il les enregistre dans `supabase/docker/.env` (`LOCAL_*`) et ajoute le port HTTPS à toutes les URL locales, front compris :
    ```bash
    yarn env:local --https-port 8443 --http-port 8080 --db-port 54322
    ```
    Les ports restent mémorisés aux lancements suivants. Pour revenir aux ports par défaut : `yarn env:local --https-port 443 --http-port 80 --db-port 5432`.
2. Recréer les services concernés (depuis `supabase/docker`) : `docker compose up -d`.
3. Relancer `yarn dev`, puis ouvrir directement les adresses en HTTPS avec le port : https://starbreakers.localhost:8443, https://api.starbreakers.localhost:8443, https://mail.starbreakers.localhost:8443. La redirection automatique depuis `http://…:8080` renvoie vers le port 443 et ne fonctionne donc pas.

Pour savoir qui occupe un port : `docker ps --format '{{.Names}}\t{{.Ports}}' | grep ':443->'`, ou `lsof -nP -iTCP:443 -sTCP:LISTEN`.

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

L'image (`Dockerfile.prod`) installe les dépendances avec `yarn install --immutable`, construit le front avec `VITE_SUPABASE_URL` et `VITE_SUPABASE_PUBLISHABLE_KEY` passées en build args (le `.env` n'entre pas dans l'image), puis le sert avec nginx. `nginx.conf` est un modèle traité au démarrage du conteneur : fallback SPA, compression gzip, cache d'un an sur `/assets/` (fichiers nommés d'après leur contenu) et revalidation d'`index.html`, et en-tête `X-Robots-Tag` pris dans la variable `ROBOTS_TAG` (vide en prod : pas d'en-tête). Pour la tester en local :

```bash
docker build -f Dockerfile.prod -t starbreakersnet-front \
  --build-arg VITE_SUPABASE_URL=https://api.starbreakers.localhost \
  --build-arg VITE_SUPABASE_PUBLISHABLE_KEY=<clé> .
docker run --rm -p 127.0.0.1:8080:80 starbreakersnet-front
```

## Déploiement (staging / prod)

### Branches et mises en production

Une seule branche de référence, `main` :

```
feature/xxx ──PR──▶ main   ──push──▶ beta (staging), en continu
                       └──tag X.Y.Z───▶ live (production), une fois la beta validée
```

- **`main` doit toujours être livrable** : on n'y fusionne (par PR) que des fonctionnalités terminées. La beta reflète `main` en permanence.
- **Mise en production** : un tag `X.Y.Z` (sans « v », comme les tags existants) sur un commit déjà validé en beta. Les migrations SQL passent donc toujours par la beta avant la prod.
- **Correctif urgent** quand `main` contient un travail pas prêt : branche depuis le tag en prod (`git checkout -b hotfix/xyz X.Y.Z`), correctif, nouveau tag `X.Y.(Z+1)`, puis PR de la branche vers `main`.

### Environnements Dokploy

Le projet Dokploy « StarbreakersNet Website » a un environnement Dokploy par environnement du site : `staging` (beta) et `production` (live). Chacun a **deux applications** : **Supabase**, déployée rarement, et **Front**, déployée à chaque évolution du site. Le reverse proxy HTTPS est **Ingressi**, en dehors de ce dépôt.

Comme les autres sites du serveur, la passerelle Supabase et le front publient chacun un port **uniquement sur l'IP du bridge Docker de l'hôte** (`172.17.0.1`). Ingressi les joint via `http://host.docker.internal:<port>`, et Internet ne les voit pas. Chaque port doit être propre à l'environnement et libre sur le serveur (AMP en utilise aussi) :

| | beta | live |
|---|---|---|
| Passerelle Supabase (`API_GW_HTTP_PORT`) | 9056 | 9055 |
| Front (`FRONT_HTTP_PORT`) | 9081 | 9080 |

> Ces ports sont joignables depuis **tous les conteneurs du serveur** (instances AMP comprises), sans passer par Ingressi. Ils y trouvent les mêmes protections que depuis Internet : clés et RLS pour l'API, basic-auth pour Studio (voir [Studio](#studio)). La base, elle, n'est jamais publiée.

### Générer les `.env` d'un environnement

Depuis la racine du dépôt, une fois par environnement (ici beta, avec les ports du tableau) :
```bash
yarn env:deploy beta --api-domain api.beta.starbreakers.net --site-domain beta.starbreakers.net --api-port 9056 --front-port 9081 --shared environment
```
Le script génère de nouveaux secrets avec les scripts officiels, dans un dossier temporaire (le `.env` local n'est pas touché), et écrit trois fichiers non versionnés :

| Fichier | Contenu | À copier dans |
|---|---|---|
| `.env.beta.shared` | `API_DOMAIN`, `SITE_DOMAIN`, `SUPABASE_PUBLISHABLE_KEY`, `API_GW_HTTP_PORT`, `FRONT_HTTP_PORT` (aucun secret) | [Variables de l'environnement Dokploy](https://docs.dokploy.com/docs/core/variables) (icône à droite du sélecteur d'environnement, **pas** « Project Environment », partagé avec la prod) |
| `supabase/docker/.env.beta` | Secrets, `ENABLE_EMAIL_AUTOCONFIRM=false`, SMTP OVH (`ssl0.ovh.net:465`, expéditeur `noreply@starbreakers.net`), `DASHBOARD_USERNAME=admin`, et les valeurs communes par référence (`${{environment.API_DOMAIN}}`…) | Application « Supabase », Environment |
| `.env.beta` | `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `FRONT_HTTP_PORT` par référence, et `ROBOTS_TAG` (`noindex, nofollow` partout sauf sur `live`, pour que seule la prod soit indexée) | Application « Front », Environment |

La clé publique et les domaines ne sont écrits qu'une fois par environnement : le front et la stack ne peuvent pas diverger. Les éditeurs signalent `${{…}}` comme une erreur de syntaxe `.env` : c'est la syntaxe de Dokploy, remplacée avant l'écriture du vrai `.env` sur le serveur. Sans `--shared`, les valeurs sont écrites directement dans les deux fichiers ; `--shared project` utilise les variables du projet (`${{project.…}}`).

Ensuite : compléter `SMTP_USER` et `SMTP_PASS` dans l'application Supabase, ranger le mot de passe de Studio affiché dans le gestionnaire de mots de passe, puis **supprimer ces fichiers du poste**. Le script refuse d'écraser un fichier existant ; `--force` génère de nouveaux secrets, à ne faire que sur un environnement neuf (la base est initialisée avec les secrets du premier démarrage).

### Application « Supabase » (type Compose)

- **Source** : branche `main`. Déclenchement : **On Push** en staging, **On Tag** en production (à vérifier au premier tag : commit déployé et tags qui déclenchent ; à défaut, déploiement manuel)
- **Compose Path** : `./supabase/docker/docker-compose.yml`
- **Advanced → Command** (remplace la commande par défaut, et Dokploy ajoute `docker` devant ; `<appName>` est le nom technique de l'application, affiché sous son titre) :
    ```
    compose -p <appName> -f supabase/docker/docker-compose.yml -f supabase/docker/docker-compose.starbreakers.yml -f supabase/docker/docker-compose.deploy.yml up -d --remove-orphans
    ```
    Pas de `--force-recreate` : avec, une migration en échec couperait l'API au lieu de la laisser tourner sur l'ancien schéma.
- **Environment** : le contenu de `supabase/docker/.env.<env>`, généré par `yarn env:deploy` (voir [Générer les `.env` d'un environnement](#générer-les-env-dun-environnement)), complété de `SMTP_USER` et `SMTP_PASS` (boîte OVH).
- **Watch Paths** : `supabase/**`
- **Isolated Deployments** : activé
- **Volume Backups** : `db-data` (et `storage-data` pour les fichiers)

Si un secret vaut encore sa valeur d'exemple, ou si une migration échoue, la passerelle ne démarre pas et le déploiement apparaît en échec dans Dokploy.

Le dossier du code étant re-cloné à chaque déploiement, les conteneurs déjà démarrés gardent l'ancienne version des fichiers de config montés depuis le dépôt (`volumes/api/envoy/*`…). Si une mise à jour de Supabase change ces fichiers sans changer l'image, redémarrer le service concerné.

### Application « Front » (type Compose)

- **Source** : branche `main`, même déclenchement que l'application Supabase de l'environnement
- **Compose Path** : `./docker-compose.front.yml` (commande par défaut)
- **Environment** : le contenu de `.env.<env>`, généré en même temps
- **Watch Paths** : `src/**`, `public/**`, `index.html`, `package.json`, `yarn.lock`, `.yarnrc.yml`, `vite.config.ts`, `tsconfig*.json`, `env.d.ts`, `Dockerfile.prod`, `nginx.conf`, `docker-compose.front.yml`

### Ingressi

| Proxy host | Upstream |
|---|---|
| Domaine du site | `http://host.docker.internal:<FRONT_HTTP_PORT>` |
| Domaine de l'API | `http://host.docker.internal:<API_GW_HTTP_PORT>` |

Pas de portail ni de chemin exclu à régler. Le temps réel passe par des WebSockets (`/realtime/v1/websocket`), qu'Ingressi (Caddy) relaie nativement.

### Studio

Studio est servi sur `https://<domaine de l'API>/`, derrière le basic-auth `DASHBOARD_USERNAME` / `DASHBOARD_PASSWORD` de la passerelle officielle : c'est la configuration prévue par Supabase. La passerelle vérifie le mot de passe avant Studio, quelle que soit l'origine de la requête (Ingressi ou autre conteneur du serveur).

Sa solidité repose sur le secret, comme pour les clés de l'API (`SERVICE_ROLE_KEY`, `SUPABASE_SECRET_KEY`), dont la fuite serait au moins aussi grave :

- `DASHBOARD_PASSWORD` est généré par `generate-keys.sh` (128 bits aléatoires) : impossible à deviner, aucune limite d'essais n'est nécessaire. Ne jamais le remplacer par un mot de passe choisi.
- Un mot de passe par environnement (local, beta, live), rangé dans un gestionnaire de mots de passe, jamais réutilisé ni partagé.
- Le régénérer au moindre doute (partage, départ d'une personne qui le connaissait), puis redéployer.
- `DASHBOARD_USERNAME` : préférer une autre valeur que `supabase`, celle par défaut.
- Dokploy contient tous les secrets en clair : la double authentification y est indispensable.
- Option, si l'IP d'administration est fixe : restreindre dans Ingressi l'accès au domaine de l'API à cette IP, sauf pour les routes publiques de l'API.
- Garder la stack à jour (`update.sh`) : la passerelle (Envoy) est la seule barrière devant Studio.

Studio n'a pas de connexion à lui : le navigateur garde les identifiants jusqu'à sa fermeture.

### Vérifications après le premier déploiement d'un environnement

- [ ] Sur le serveur, la passerelle et le front ne publient que sur `172.17.0.1`, jamais sur `0.0.0.0` :
    ```bash
    docker ps --format '{{.Names}}\t{{.Ports}}' | grep -E 'api-gw|front'
    ```
- [ ] Depuis une machine extérieure, ces ports et les ports internes ne répondent pas (« timed out ») :
    ```bash
    for port in 9055 9056 9080 9081 5432 6543 8000 8055 3000; do nc -vz -w 3 starbreakers.net $port; done
    ```
- [ ] `https://<domaine de l'API>/` demande une authentification (Studio), et `DASHBOARD_PASSWORD` est bien celui généré pour cet environnement.
- [ ] La double authentification est active sur Dokploy.
- [ ] `https://<domaine de l'API>/auth/v1/health` avec l'en-tête `apikey: <SUPABASE_PUBLISHABLE_KEY>` répond `200`.
- [ ] Logs du service `migrations` : secrets acceptés, migrations appliquées.
- [ ] Inscription → mail de confirmation reçu, en français et hors spam → connexion → `/account` → mot de passe oublié.
- [ ] Source brute d'un mail reçu : `spf=pass`, `dkim=pass` et `dmarc=pass` dans `Authentication-Results`.

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

## Intégrations

### Buroh (`/buroh`)

Buroh est la page d'accueil personnelle à widgets du site, dans l'esprit des widgets de macOS, avec un style « Liquid Glass ». Elle remplace l'ancienne intégration de Bonjourr. Code : `src/views/BurohView.vue` (route `buroh`) et `src/components/widgets/`.

- **Grille libre** ([gridstack.js](https://gridstackjs.com), `src/components/widgets/WidgetGrid.vue`) : en mode « Modifier les widgets », on ajoute un widget depuis la galerie (type et taille : petit, moyen, grand), on le déplace par glisser-déposer, à la souris ou au doigt, on le règle ou on le supprime. Au toucher, un widget se saisit par un appui long (300 ms) : un doigt qui glisse aussitôt fait défiler la page.
- **Mobile** (moins de 720 px de large) : grille de 4 colonnes (deux petits widgets par ligne, les autres sur toute la largeur), réordonnable comme l'écran d'accueil d'un téléphone. Sa disposition est enregistrée à part (`mobile` sur chaque widget) et ne change pas celle de l'ordinateur ; tant qu'on n'a rien déplacé sur mobile, les widgets suivent l'ordre de lecture de l'ordinateur. La galerie s'ouvre avec le bouton « + ».
- **Widgets** : Horloge, Note (texte enregistré en Markdown, édité et affiché avec [TipTap](https://tiptap.dev), qui n'en garde que les balises connues de l'éditeur), Liens (icônes DuckDuckGo), Météo ([Open-Meteo](https://open-meteo.com), sans clé), Compte à rebours, Calendrier. Idées reprises de [Homarr](https://github.com/homarr-labs/homarr), code écrit pour le site.
- **Pas d'ascenseur dans les widgets** : les widgets à contenu fixe (horloge, météo, calendrier, compte à rebours) sont dimensionnés en unités `cqh`, relatives à la hauteur du cadre. Les widgets à contenu libre (note, liens) réduisent leur contenu juste assez pour tenir (`useFitContent`) ; si on le modifie et qu'il ne tient plus qu'en devenant trop petit, le widget passe à la taille du dessus. Au-delà de la plus grande taille, la fin s'estompe.
- **Liquid Glass sans surcoût** (`src/assets/glass.scss`) : pas de `backdrop-filter` sur les widgets, qui reposent sur un fond en dégradé que le flou ne changerait presque pas. L'effet vient du remplissage translucide, du reflet spéculaire (ombres internes), d'un éclat courbe (dégradé radial) et d'une ombre douce. Seuls la barre d'outils et la galerie, posées au-dessus des widgets, gardent un flou. Les réglages « Réduire la transparence » et « Augmenter le contraste » du système sont respectés.
- **Barre d'outils discrète** : « Fond d'écran » et « Modifier les widgets » s'effacent après 1,5 seconde sans activité, et reviennent au moindre mouvement de souris, appui sur une touche ou toucher. Clic droit sur le Buroh : menu « Modifier les widgets » / « Changer le fond d'écran… », comme sur macOS.
- **Fond d'écran** (`src/models/wallpapers.ts`, `BurohWallpaper.vue`, `WallpaperModal.vue`) :
  - dégradés, avec une variante pour chaque thème ;
  - photos Unsplash ou vidéos de la sélection du site, avec les mêmes options : renouvelées à chaque visite, toutes les heures, chaque jour, ou fixes, avec leur crédit. L'API Unsplash ne propose pas de vidéos : la sélection est une liste choisie pour le site (`WALLPAPER_VIDEOS` dans `src/models/wallpapers.ts`). Pour ajouter une vidéo : déposer le fichier dans `public/` (boucle courte, WebM ou MP4, 20 Mo au plus de préférence) ou utiliser l'adresse d'une vidéo libre de droits, puis l'ajouter à la liste avec son crédit.
  - photos Unsplash, par thème, renouvelées selon le rythme choisi : sans clé, depuis une sélection intégrée au site (`src/models/unsplashSelection.json`, à renouveler avec `UNSPLASH_ACCESS_KEY=<clé> yarn unsplash:selection`) ; avec la clé d'accès Unsplash de l'utilisateur (gratuite sur [unsplash.com/developers](https://unsplash.com/developers)), saisie dans la fenêtre Fond d'écran et enregistrée avec son Buroh, par l'API officielle, avec en plus le choix d'une collection ; si l'API ne répond pas (panne, limite de 50 requêtes par heure d'une clé de démonstration), photo de la sélection ;
  - image ou vidéo par son adresse, ou fichier de l'ordinateur (100 Mo au maximum), gardé dans le navigateur (IndexedDB) sans être envoyé au serveur ;
  - vidéos lues en boucle et sans son ; avec « Réduire les animations », seule la première image s'affiche.
- **Verre sur une photo** : une miniature floue du fond est calculée une seule fois (`src/utils/backdrop.ts`) et affichée derrière chaque widget, alignée sur le fond (`background-attachment: fixed`) : effet de verre dépoli sans `backdrop-filter`. Sur une vidéo, ou une image d'un site qui en interdit la lecture (CORS), le verre est simplement plus couvrant.
- **Enregistrement** : dans le navigateur pour les visiteurs, et sur le compte pour les membres connectés (colonne `user_settings.widgets`, fond d'écran compris), comme le thème. Voir `src/stores/widgets.ts`.
- **Ajouter un type de widget** : le déclarer dans `src/types/Widget.ts` et `src/models/widgets.ts` (métadonnées, tailles, réglages par défaut, validation), puis ajouter son affichage et son formulaire de réglages dans `src/components/widgets/registry.ts`. Son contenu doit tenir sans ascenseur : tailles en `cqh`, ou `useFitContent`.
