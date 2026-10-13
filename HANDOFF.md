STATUT: TERMINE — les 23 cases de PLAN.md sont `[x]`, chacune avec sa ligne « Mesure », le 17/10/2026.

RELEVE AUTOMATIQUE DU HARNAIS (session 1) : la liste des fichiers touches, des dernieres commandes et des dernieres erreurs est dans .harnais/releve-session-precedente.md. Ne l'ouvre que si ce relais ne suffit pas ; pour une question precise sur ce qui a ete fait, la skill `recall` cherche dans l'historique.
<!-- fin de la note du harnais -->

# HANDOFF — STARBREAKERSNET-WEBSITE (relais final)

## Ce que le disque prouve

- `PLAN.md` : 23 cases `[x]`, chacune suivie de sa ligne « Mesure » (rouge vu, nombres de tests, mutations, références source).
- Chaîne verte finale rejouée ce jour, sorties sur le disque : `npm run test` = « Test Files 16 passed (16) », « Tests 226 passed (226) » (exit 0, `test-run.log`) ; `npm run lint` exit 0 (`lint-run.log`) ; `npm run build` = « ✓ built in 8.14s » exit 0 (`build-run.log`). Les `*.log` sont ignorés par le .gitignore (`*.log` l.3).
- `journal-de-bord.md` : sections d'arbitrages des cases 1 à 22, rien en attente.
- `launch.json` à la racine : type url, label « Ouvrir STARBREAKERSNET-WEBSITE », target `http://localhost:5173`, start `npm run dev` — conforme à la case 8, JSON validé.
- Docker (case 22) : service `bonjourr` dans `docker-compose.yml` (profil `bonjourr`, build `context: ./Bonjourr` + `dockerfile: docker/Dockerfile`, montage `src`/`_locales` reconstruit au démarrage, port `8000:8000`). Preuves : `build-bonjourr.log` (« naming to docker.io/library/starbreakersnet-website-bonjourr:latest »), conteneur `starbreakersnet-website-bonjourr-1` Up avec `0.0.0.0:8000->8000/tcp`, logs « online built in: 642ms » + « Listening on http://0.0.0.0:8000/ », `curl http://localhost:8000/` → HTTP 200 (162 301 octets, `<title>New tab</title>`), `/src/scripts/main.js` → HTTP 200 (548 312 octets). Rouge fait et consigné : bloc retiré, `docker compose --profile bonjourr config --services` ne renvoie rien ; rétabli, il renvoie `bonjourr`.
- Le bouton « Bonjourr » et la page Bonjourr (spécifications `affichage_bonjourr.png`, `bouton_bonjourr.png`) sont en place depuis les cases 13-21, testés.

## À lire dans l'ordre

1. `PLAN.md` — les cases et leurs mesures, dans l'ordre.
2. `journal-de-bord.md` — les arbitrages, y compris les écarts assumés avec la source (pas de type `files` pour les fonds, favicon URL acceptée en plus de l'emoji, pas d'éditeur de liens façon source, phrase « À propos » non traduite).
3. `Bonjourr/` en lecture seule : sa référence de contrat avec citations « fichier l.lignes » ; son `AGENTS.md` Deno ne s'applique pas au fork (npm/vitest).

## Si on reprend le projet

- Portes : `npm run test`, `npm run lint`, `npm run build`. Pas de `vue-tsc`/`tsc --noEmit` : ils typecheckent `Bonjourr/`.
- Le conteneur bonjourr tourne encore (`docker compose --profile bonjourr ps`) ; `down` suffit à l'arrêter. Le service reconstruit le source monté à chaque montée.
- Pièges de tests éprouvés : `mount(C, { global: { plugins: [pinia] } })` en tableaux ; `mountPanel()` **puis** `useBonjourrStore()` ; lire le DOM après `await flushPromises()` ; `attachTo: document.body` pour ce qui consulte `document` ; `:title="t(&quot;Apostrophe''&quot;)"` dans les attributs ; `join(process.cwd(), …)` et non `import.meta.url` pour lire un fichier de test ; `structuredClone` refuse les proxies Vue.
- Aucune commande git de commit n'a été lancée du projet ; le .gitignore tient (`Bonjourr/` en bloc l.37, `*.log`, node_modules/dist/coverage).
