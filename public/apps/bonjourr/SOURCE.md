# Bonjourr 22.3.0

Construit par scripts/bonjourr/update.mjs depuis https://github.com/victrme/Bonjourr
(commit 80a8f266a44ad98a2785da08afe66192dec7f2a1), avec `deno task build online`.

Licence : GNU GPL v3 (LICENSE.md). Modifications apportées au build :

- index.html : chargement de storage-shim.js, qui préfixe les clés de localStorage et sessionStorage,
  et de site-sync.js, qui applique le thème du site et masque l'option « Mode sombre »
- src/scripts/main.js : traductions chargées depuis _locales/ (relatif à index.html, et non à la
  racine du domaine) ; enregistrement du service worker supprimé
