# Fonctionnalités Bonjourr — cartographie original → fork STARBREAKERSNET

Source de vérité : `Bonjourr/` (victrme/Bonjourr v22.3.0, cf. `Bonjourr/src/scripts/defaults.ts` CURRENT_VERSION).
Modèle de config : `Sync` (Bonjourr/src/types/sync.ts) + `Local` (types/local.ts). Ce document liste, pour chaque
domaine : la source d'origine, les clés de réglage, le module cible du fork Vue, et les écarts ASSUMÉS.
Règle du fork : mêmes fonctions utilisateur, code natif Vue 3 + TS + Vite ; APIs distantes de l'original conservées
(`https://services.bonjourr.fr`, `https://weather.bonjourr.fr`) avec repli silencieux hors-ligne ; tests sur fixtures.

## 1. Horloge et salutation

- Sources : `features/clock/{index,clock,date,greetings,world,helpers}.ts`, clés `time`, `clock.*`, `analogstyle`, `worldclocks`, `dateformat`, `greeting`, `greetingsize`, `greetingsmode`, `greetingscustom`.
- Réglages originaux : affichage on/off (`time`), taille (`clock.size`), 12h avec `ampm` (+ label et position du suffixe), secondes, cadran analogique (`clock.analog`, style analogstyle : face none|number|roman|marks|swiss|braun, hands modern|swiss|classic|braun|apple, forme round|square|rectangle, bordure/fond), fuseau `clock.timezone` (auto ou liste IANA), heures du monde (`clock.worldclocks` + `worldclocks[] {region, timezone}`), format de date `dateformat` auto|eu|us|cn, prénom `greeting`, salutations personnalisées par période (morning/afternoon/evening/night, placeholder `$name`), périodes : 0–3 soir, 3–5 nuit, 5–12 matin, 12–18 après-midi, 18–24 soir (greetings.ts l.24-34).
- Fork : `src/bonjourr/clock.ts` (formatTime: 12/24h, secondes, fuseau via Intl, worldclocks ; formatFrenchDate + dateformat eu/us/cn) ; `src/bonjourr/greeting.ts` (périodes + custom + prénom) ; composant cadran SVG analogique (faces number/roman/marks, formes, couleurs).
- Écarts : faces swiss/braun/hands exotiques réduites à number/roman/marks + 3 styles de mains ; pas de « greetingsize » multi-niveaux fin (taille relative ok).

## 2. Météo

- Sources : `features/weather/{index,request,display,settings}.ts`, clés `weather.*` + `hide.weatherdesc|weathericon`, cache `lastWeather` (local, 1 h).
- API d'origine : proxy `https://weather.bonjourr.fr/?provider=auto&data=simple&lang&unit=C|F` + `lat/lon` (géoloc précise) ou sans coordonnees (approximation IP) ou `query=<ville>` (geolocation off, ville par defaut « Paris »). Reponse `SimpleWeather` : `now {icon,temp,feels,description}`, `daily [{time,high,low}]`, `sun {rise:[h,m],set:[h,m]}`, `geo {city,country}`, `meta.url`.
- Phrase d'affichage (display.ts) : « Description. Il fait actuellement N° [et ressenti N°] » + « avec un maximum de M° aujourd'hui/demain » selon `forecast` auto|always|never et heure de coucher ; `temperature` actual|feelslike|both ; `unit` metric|imperial (°C/°F) ; icone jour/nuit via lever/coucher ; `moreinfo` none|msnw|yhw|windy|accu|custom → lien sur le bloc.
- Fork : `src/bonjourr/weather.ts` etendu (memes endpoints/parametres que request.ts, modeles SimpleWeather/LastWeather, conversion d'unites, phrase FR, moreinfo, ville personnalisee + recherche via le proxy).
- Ecarts : pas de cache IndexedDB 1 h (cache memoire/session suffit) ; « provider » direct (cle OpenWeatherMap) non porte — le proxy d'origine gere deja accuweather/foreca en `provider=auto`.

## 3. Barre de recherche

- Sources : `features/searchbar.ts`, cles `searchbar.{on,opacity,newtab,suggestions,engine,request,placeholder,width,background}`.
- Moteurs (defaults.ts SEARCHBAR_ENGINES + urls searchbar.ts l.182-195, gabarit `%s`) : default (recherche du navigateur, indisponible en web → google), google, ddg, startpage, qwant, yahoo, bing, brave, ecosia, lilo, baidu, custom (URL utilisateur DOIT contenir `%s`, valide 512 car. max). Si la saisie est une URL valide → navigation directe (l.244) ; newtab → `_blank`. Suggestions : websocket `wss://services.bonjourr.fr/suggest`.
- Fork : `src/bonjourr/search.ts` (table des moteurs reprise telle quelle, createSearchUrl, isValidUrl, defaut→google) + composant ; suggestions via le websocket d'origine si `suggestions` (repli : aucune).
- Ecarts : reglage `width`/fond de la barre non expose (CSS suffit).

## 4. Liens rapides

- Sources : `features/links/{index,edit,drag,groups,folders,helpers,bookmarks,fileicons}.ts`, cles `quicklinks`, `linkstyle` small|medium|big|large, `linktitles`, `linkbackgrounds`, `linknewtab`, `linksrow`, `linkiconradius`, `linkgroups {on,selected,groups,pinned,synced}`, modele `LinkElem {_id,parent,order,title,url,icon{type,value}}` + `LinkFolder`.
- Favicon : `https://services.bonjourr.fr/favicon/blob/<url>` (helpers.ts l.10-13), erreur → `/favicon/blob/error`.
- Fork : `src/bonjourr/links.ts` (modele LinkElem sans dossiers, CRUD, ordre, favicon auto, persistance) + overlay d'edition (titre/url) comme l'original (clic engrenage → mode edition : tuiles modifiables/supprimables/ajout).
- Ecarts ASSUMES : dossiers/groupes de liens, glisser-deposer multi-select, import des favoris du navigateur, icones SVG personalizees — non portes (contexte page web d'un site, pas page d'accueil du navigateur) ; tuiles + CRUD + favicon + style/_taille/rangee conserves.

## 5. Notes

- Sources : `features/notes.ts`, cles `notes {on,width,opacity,align,text,background}`. Editeur markdown leger (pocket-editor), largeur en em (`--notes-width`), alignement left|center|right, fond #RRGGBBAA.
- Fork : `src/bonjourr/notes.ts` + composant — textarea persistee + rendu markdown leger (titres/listes/checkbox), memes reglages.
- Ecart : pas le pocket-editor (dependance npm etrangere) — editeur textarea + rendu md maison.

## 6. Citations

- Sources : `features/quotes.ts`, cles `quotes {on,author,type,frequency,last,userlist,url}` ; API `GET services.bonjourr.fr/quotes/<type>/<lang>` (classic par langue, kaamelott, inspirobot, stoic, hitokoto, office) renvoie `Quote[] {author,content}` ; file d'attente locale (`quotesCache`), frequence day|hour|pause ; types user (CSV) et url (JSON/CSV).
- Fork : `src/bonjourr/quotes.ts` (fetch + file + frequence + repli hors-ligne sur cache) ; types classic + user + url.
- Ecart : types exotiques (kaamelott, inspirobot, stoic, hitokoto, office) non exposes dans le panneau (API identique si l'utilisateur les renseigne).

## 7. Pomodoro

- Sources : `features/pomodoro.ts`, cles `pomodoro {on,mode,pause,end,timeFor{pomodoro:1500,break:300,longbreak:1200},focus,sound,alarm,volume,history}` ; modes pomodoro|break|longbreak, anneau SVG, mode focus = masque les autres widgets, historique des sessions.
- Fork : `src/bonjourr/pomodoro.ts` (logique pure : etats, durees, pause/reprise, enchainement auto des modes, historique) + UI anneau ; bipeur WebAudio a la fin (alarme optionnelle).
- Ecart : alarmes sonores nommees (marimba…) remplacees par un bip synthetique.

## 8. Fonds d'ecran

- Sources : `features/backgrounds/{index,providers,urls,local,textures,credits,VideoLooper}.ts`, cles `backgrounds {type files|urls|images|videos|color, frequency hour|day|pause, fadein, blur, bright, color, urls, images, videos, mute, queries, texture}` ; collection par defaut `bonjourr-images-daylight` → `GET https://services.bonjourr.fr/backgrounds/bonjourr/images/daylight?h&w` → `Background[] {format:'image', urls{full,small}, credit{title,author,url}}` ; rotation par frequence + « changer de fond » ; proxy CORS `services.bonjourr.fr/backgrounds/proxy/<url>` pour les URLs ; credits affiches en bas a gauche ( deja fait session 1 : « Photo par … »).
- Fork : `src/bonjourr/backgrounds.ts` (types images(collection), urls, color ; rotation frequence ; suivant manuel ; credits ; blur/bright/fadein appliques via le store) ; repli : fond local par defaut (session 1) si hors-ligne.
- Ecarts ASSUMES : upload de fichiers locaux avec EXIF (IndexedDB), videos (loop/mute), textures SVG, « paused » par frequence pause — non portes ; collection/urls/couleur suffises pour la page du site.

## 9. Visuel global

- Sources : `features/{others,css,csseditor,fonts,hide}.ts`, `features/move/*` ; cles `dark` auto|system|enable|disable, `font {family,size,weight,color,system}` (liste polices : `GET services.bonjourr.fr/fonts`, fontsource), `pagegap`, `pagewidth`, `textShadow`, `css`, `hide {clock,date,greetings,weatherdesc,weathericon,settingsicon}`, `favicon` (emoji → data-URI SVG, others.ts l.9-29), `tabtitle`, `showall`, `advanced {altMode, escKey}`.
- Fork : `src/bonjourr/visuals.ts` (classes/variables CSS : theme sombre, police via CDN polices (fonts.bunny.net, equivalent libre de fontsource), taille/graisse/couleur, pagegap/pagewidth, ombre ; injection du CSS personnalise ; masquage par classes ; favicon emoji en data-URI SVG + <title>).
- Ecarts ASSUMES : editeur « move » (placement libre des widgets par triple-clic), coloration syntaxique du CSS, selection de graisses par police (input libre), aidons/notifications — non portes.

## 10. Donnees, langue, onglet

- Sources : `settings.ts` (export/import JSON via fichier), `storage.ts` (sync navigateur/gist/url), `langs.ts` (langues UI), `features/synchronization/*`.
- Fork : export/import JSON (telechargement + import fichier, validation par fusion avec les defauts) ; i18n FR/EN du fork (lang par defaut fr) ; cle localStorage unique.
- Ecarts ASSUMES : chrome.storage, synchronisation GitHub Gist et URL distante, compte/tabs tracking — specifiques a l'extension, non portes.

## 11. Hors perimetre (rappelle ici pour etre net)

Extensions navigateur (manifeste, webstore), mode aide (help-mode), service worker, menu contextuel (contextmenu.ts),
notifications supporters (kofi.bonjourr.fr), popups d'avis/major (popup.ts), suivi d'onglets, compatibilite vieux
navigateurs (compatibility/*). Le fork reste une page du site starbreakers : route /bonjourr + bouton du menu (session 1).

## 12. Docker

`Bonjourr/docker/{Dockerfile,compose.yaml}` : build deno (deno task build) + `deno task serve` sur le port 8000.
Le service « bonjourr » du docker-compose racine (profil bonjourr) doit monter `./Bonjourr` et publier 8000 pour que
l'utilisateur lance l'original a cote du fork (consigne du 14/10).
