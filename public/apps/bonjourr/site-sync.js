/*
 * Réglages communs entre le site et Bonjourr (chargé avant ses scripts, voir scripts/bonjourr/update.mjs).
 *
 * Le site est la seule source : ses réglages s'appliquent à Bonjourr, et les options équivalentes
 * sont masquées dans les réglages de Bonjourr pour qu'on ne les change qu'à un seul endroit.
 *
 * - Thème : celui du site (menu utilisateur, enregistré sur le compte), lu sur l'attribut
 *   data-theme de la page parente (posé par App.vue). Bonjourr utilise le même attribut sur sa
 *   propre page : on le recopie, y compris en direct quand le thème du site change, et on le
 *   rétablit si Bonjourr le modifie (démarrage, mode « Système » ou « La nuit »).
 *
 * Sans page parente (Bonjourr ouvert directement), rien n'est modifié.
 *
 * Ce fichier s'appuie sur des éléments internes de Bonjourr (attribut data-theme, classe du bloc
 * « Mode sombre ») : yarn bonjourr:update refuse une version qui ne les a plus, et indique quoi
 * corriger ici (SITE_SYNC_REQUIREMENTS dans scripts/bonjourr/update.mjs).
 */
(function () {
  "use strict";

  var site;
  try {
    site = window.parent !== window ? window.parent.document.documentElement : null;
  } catch (_) {
    // Page parente d'une autre origine : pas de synchronisation
    site = null;
  }
  if (!site) return;

  var page = document.documentElement;

  function siteTheme() {
    var theme = site.dataset.theme;
    return theme === "dark" || theme === "light" ? theme : null;
  }

  function applyTheme() {
    var theme = siteTheme();
    if (theme && page.dataset.theme !== theme) {
      page.dataset.theme = theme;
    }
  }

  applyTheme();
  new MutationObserver(applyTheme).observe(site, { attributes: true, attributeFilter: ["data-theme"] });
  new MutationObserver(applyTheme).observe(page, { attributes: true, attributeFilter: ["data-theme"] });

  // Option « Mode sombre » de Bonjourr (et son séparateur) : remplacée par le thème du site
  var style = document.createElement("style");
  style.textContent = ".darkmode.wrapper, .darkmode.wrapper + hr { display: none !important; }";
  document.head.appendChild(style);
})();
