// Construit Bonjourr (https://github.com/victrme/Bonjourr, GPL-3.0) depuis ses sources et l'installe
// dans public/apps/bonjourr, servi par le site lui-même (page /bonjourr, voir ViewerBonjourr.vue).
//
// Usage : yarn bonjourr:update
// Pour changer de version : modifier BONJOURR_COMMIT et BONJOURR_VERSION, puis relancer le script
// et committer le contenu de public/apps/bonjourr.
//
// Prérequis : git et npx (Node). Deno, l'outil de build de Bonjourr, est lancé via npx.

import { execFileSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const BONJOURR_REPO = "https://github.com/victrme/Bonjourr.git";
const BONJOURR_COMMIT = "80a8f266a44ad98a2785da08afe66192dec7f2a1";
const BONJOURR_VERSION = "22.3.0";
const DENO_VERSION = "2.9.6";

const root = fileURLToPath(new URL("../..", import.meta.url));
const target = join(root, "public/apps/bonjourr");
const shim = join(root, "scripts/bonjourr/storage-shim.js");
const siteSync = join(root, "scripts/bonjourr/site-sync.js");

function run(cmd, args, cwd) {
  execFileSync(cmd, args, { cwd, stdio: "inherit" });
}

// Remplace exactement une occurrence, et échoue si Bonjourr a changé (le correctif est alors à revoir)
function patch(file, search, replacement) {
  const content = readFileSync(file, "utf8");
  const count = content.split(search).length - 1;
  if (count !== 1) {
    throw new Error(`${file} : ${count} occurrence(s) de « ${search} » au lieu d'une`);
  }
  writeFileSync(file, content.replace(search, replacement));
}

// site-sync.js (intégration dans la page du site) s'appuie sur des éléments internes de Bonjourr,
// sans modifier son code. Si une nouvelle version les change, l'intégration cesserait sans erreur :
// on refuse donc la mise à jour, en expliquant quoi corriger dans site-sync.js.
// Chaque élément est vérifié par « search » (texte présent dans le fichier) ou par « check ».
const SITE_SYNC_REQUIREMENTS = [
  {
    file: "src/scripts/main.js",
    search: "document.documentElement.dataset.theme = theme;",
    what: "Bonjourr ne pose plus son thème dans l'attribut data-theme de <html> (fonction darkmode)",
    impact: "Bonjourr ne suivrait plus le thème du site",
    fix: "retrouver comment Bonjourr applique son thème (fonction darkmode de main.js) et adapter applyTheme",
  },
  {
    file: "src/styles/style.css",
    search: "[data-theme=dark]",
    what: "Le CSS de Bonjourr ne s'appuie plus sur [data-theme=dark]",
    impact: "le thème recopié par site-sync.js n'aurait plus d'effet sur l'affichage",
    fix: "retrouver le sélecteur du thème sombre dans style.css et adapter applyTheme",
  },
  {
    file: "index.html",
    search:
      'le bloc <div class="as as_visuals dropdown">, jusqu\'à class="settingshide wrapper", ' +
      "avec pour seuls réglages i_dark, i_favicon et i_tabtitle",
    check(html) {
      const start = html.indexOf('<div class="as as_visuals dropdown">');
      const end = html.indexOf('class="settingshide wrapper"', start);
      if (start === -1 || end === -1) return false;
      const ids = [...html.slice(start, end).matchAll(/id="(i_[^"]+)"/g)].map(match => match[1]);
      return ids.sort().join(",") === "i_dark,i_favicon,i_tabtitle";
    },
    what: "Le bloc « as_visuals » des réglages, masqué par site-sync.js, a changé (il ne doit contenir que « Mode sombre » et « Onglet »)",
    impact:
      "un nouveau réglage de ce bloc serait masqué sans raison, ou « Mode sombre » et « Onglet » réapparaîtraient sans effet",
    fix: "regarder le contenu de ce bloc dans index.html et adapter la règle CSS de site-sync.js pour ne masquer que « Mode sombre » et « Onglet »",
  },
  {
    file: "src/scripts/main.js",
    search: 'globalThis.open(url, "_self");',
    what: "La barre de recherche de Bonjourr n'ouvre plus ses résultats avec globalThis.open(url, \"_self\") (fonction submitSearch)",
    impact:
      "avec « Ouvrir dans un nouvel onglet » désactivé, les recherches pourraient s'ouvrir dans l'iframe, où la plupart des sites refusent de s'afficher",
    fix: "retrouver comment submitSearch (main.js) ouvre les résultats et adapter le remplacement de window.open dans site-sync.js",
  },
  {
    file: "src/scripts/main.js",
    search: 'anchor.removeAttribute("target");',
    what: "Les liens rapides ne sont plus de simples liens sans cible quand « Ouvrir dans un nouvel onglet » est désactivé (fonction setOpenInNewTab)",
    impact: "les liens rapides pourraient s'ouvrir dans l'iframe, où la plupart des sites refusent de s'afficher",
    fix: "retrouver comment setOpenInNewTab et les liens rapides (main.js) ouvrent les pages et adapter l'écouteur de clic de site-sync.js",
  },
];

function checkSiteSync(release) {
  const broken = SITE_SYNC_REQUIREMENTS.filter(({ file, search, check }) => {
    const content = readFileSync(join(release, file), "utf8");
    return check ? !check(content) : !content.includes(search);
  });
  if (broken.length === 0) return;

  const details = broken
    .map(
      ({ file, search, what, impact, fix }, index) =>
        `${index + 1}. ${what}.\n` +
        `   Attendu dans ${file} : ${search}\n` +
        `   Conséquence : ${impact}.\n` +
        `   À faire : ${fix}.`
    )
    .join("\n\n");

  throw new Error(
    `Bonjourr ${BONJOURR_VERSION} (commit ${BONJOURR_COMMIT}) n'est pas compatible avec ` +
      `scripts/bonjourr/site-sync.js (intégration dans la page du site).\n\n${details}\n\n` +
      `Rien n'a été installé : public/apps/bonjourr contient toujours la version précédente.\n` +
      `Corriger site-sync.js, puis mettre à jour SITE_SYNC_REQUIREMENTS dans ce script et relancer ` +
      `yarn bonjourr:update.`
  );
}

const work = mkdtempSync(join(tmpdir(), "bonjourr-"));

try {
  // 1. Sources, à la révision fixée
  run("git", ["init", "--quiet"], work);
  run("git", ["fetch", "--quiet", "--depth", "1", BONJOURR_REPO, BONJOURR_COMMIT], work);
  run("git", ["checkout", "--quiet", "FETCH_HEAD"], work);

  const manifest = JSON.parse(readFileSync(join(work, "src/manifests/chrome.json"), "utf8"));
  if (manifest.version !== BONJOURR_VERSION) {
    throw new Error(`Version ${manifest.version} trouvée, ${BONJOURR_VERSION} attendue`);
  }

  // 2. Build officiel, version web (« online ») de production : release/online
  run("npx", ["--yes", `deno@${DENO_VERSION}`, "task", "build", "online"], work);
  const release = join(work, "release/online");

  // Ce dont dépend site-sync.js, vérifié avant d'installer quoi que ce soit : en cas d'échec,
  // le build actuel de public/apps/bonjourr reste en place
  checkSiteSync(release);

  // 3. Installation dans public/
  rmSync(target, { recursive: true, force: true });
  cpSync(release, target, { recursive: true });
  cpSync(join(work, "LICENSE.md"), join(target, "LICENSE.md"));
  cpSync(shim, join(target, "storage-shim.js"));
  cpSync(siteSync, join(target, "site-sync.js"));

  // 4. Adaptations à l'intégration dans le site
  // Stockage cloisonné et réglages communs avec le site, chargés avant les scripts de Bonjourr
  // (voir storage-shim.js et site-sync.js)
  patch(
    join(target, "index.html"),
    '<script src="src/scripts/help-mode.js" defer></script>',
    '<script src="storage-shim.js"></script>\n        <script src="site-sync.js"></script>\n        <script src="src/scripts/help-mode.js" defer></script>'
  );
  // Traductions : chemin prévu pour un Bonjourr servi à la racine du domaine (online.bonjourr.fr)
  patch(
    join(target, "src/scripts/main.js"),
    "fetch(`../../_locales/${lang}/translations.json`)",
    "fetch(`_locales/${lang}/translations.json`)"
  );
  // Pas de service worker : Bonjourr n'est pas installé comme application, et les mises à jour du site
  // doivent être prises en compte sans cache supplémentaire
  patch(
    join(target, "src/scripts/main.js"),
    'navigator.serviceWorker.register("service-worker.js");',
    "/* Service worker désactivé par StarBreakers (scripts/bonjourr/update.mjs) */"
  );
  rmSync(join(target, "src/scripts/service-worker.js"));

  // 5. Provenance et modifications (GPL-3.0, section 5)
  writeFileSync(
    join(target, "SOURCE.md"),
    `# Bonjourr ${BONJOURR_VERSION}

Construit par scripts/bonjourr/update.mjs depuis ${BONJOURR_REPO.replace(/\.git$/, "")}
(commit ${BONJOURR_COMMIT}), avec \`deno task build online\`.

Licence : GNU GPL v3 (LICENSE.md). Modifications apportées au build :

- index.html : chargement de storage-shim.js, qui préfixe les clés de localStorage et sessionStorage,
  et de site-sync.js, qui intègre Bonjourr à la page du site : thème du site appliqué, options
  « Mode sombre » et « Onglet » masquées, liens et recherche ouverts dans l'onglet plutôt que dans l'iframe
- src/scripts/main.js : traductions chargées depuis _locales/ (relatif à index.html, et non à la
  racine du domaine) ; enregistrement du service worker supprimé
`
  );

  console.log(`Bonjourr ${BONJOURR_VERSION} installé dans public/apps/bonjourr`);
} finally {
  rmSync(work, { recursive: true, force: true });
}
