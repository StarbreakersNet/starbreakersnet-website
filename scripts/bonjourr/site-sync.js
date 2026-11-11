/*
 * Intégration de Bonjourr dans la page du site (chargé avant ses scripts, voir scripts/bonjourr/update.mjs).
 *
 * Bonjourr est conçu pour être la page d'un onglet ; ici il est affiché dans une iframe du site.
 *
 * - Thème : le site est la seule source. Celui du site (menu utilisateur, enregistré sur le compte)
 *   est lu sur l'attribut data-theme de la page parente (posé par App.vue). Bonjourr utilise le même
 *   attribut sur sa propre page : on le recopie au chargement, et on le rétablit si Bonjourr le
 *   modifie (démarrage, mode « Système » ou « La nuit »). Quand le thème du site change, la page
 *   du site recharge Bonjourr (ViewerBonjourr.vue), dont une partie de l'affichage n'est calculée
 *   qu'au démarrage.
 *
 * - Réglages sans effet dans une iframe, masqués : bloc « as_visuals » des réglages, qui ne contient
 *   que « Mode sombre » (remplacé par le thème du site) et « Onglet » (titre et icône de la page de
 *   Bonjourr, invisibles puisque l'onglet affiche ceux du site).
 *
 * - Liens et recherche : avec « Ouvrir dans un nouvel onglet » désactivé, Bonjourr ouvre la page
 *   dans sa propre fenêtre, c'est-à-dire dans l'iframe, où la plupart des sites refusent de
 *   s'afficher. On les ouvre à la place dans l'onglet courant (_top), ce que l'option promet.
 *
 * Sans page parente (Bonjourr ouvert directement), rien n'est modifié.
 *
 * Ce fichier s'appuie sur des éléments internes de Bonjourr : yarn bonjourr:update refuse une
 * version qui ne les a plus, et indique quoi corriger ici (SITE_SYNC_REQUIREMENTS dans
 * scripts/bonjourr/update.mjs).
 */
(function () {
  "use strict";

  var site;
  try {
    site = window.parent !== window ? window.parent.document.documentElement : null;
  } catch (_) {
    // Page parente d'une autre origine : pas d'intégration
    site = null;
  }
  if (!site) return;

  var page = document.documentElement;

  // --- Thème

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
  new MutationObserver(applyTheme).observe(page, { attributes: true, attributeFilter: ["data-theme"] });

  // --- Réglages sans effet dans une iframe : « Mode sombre » et « Onglet »

  var style = document.createElement("style");
  style.textContent = ".as_visuals { display: none !important; }";
  document.head.appendChild(style);

  // --- Liens et recherche ouverts dans l'onglet courant plutôt que dans l'iframe

  function isExternal(url) {
    try {
      var target = new URL(url, location.href);
      return /^https?:$/.test(target.protocol) && target.origin !== location.origin;
    } catch (_) {
      return false;
    }
  }

  // Liens rapides (et tout autre lien externe) sans cible : avant l'action du clic, qui lit target
  document.addEventListener(
    "click",
    function (event) {
      var anchor = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!anchor || !isExternal(anchor.href)) return;
      var target = anchor.getAttribute("target");
      if (!target || target === "_self") {
        anchor.setAttribute("target", "_top");
      }
    },
    true
  );

  // Barre de recherche : globalThis.open(url, "_self")
  var open = window.open;
  window.open = function (url, target, features) {
    if ((!target || target === "_self") && isExternal(url)) {
      target = "_top";
    }
    return open.call(window, url, target, features);
  };
})();
