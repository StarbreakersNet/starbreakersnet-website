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

  // 3. Installation dans public/
  rmSync(target, { recursive: true, force: true });
  cpSync(join(work, "release/online"), target, { recursive: true });
  cpSync(join(work, "LICENSE.md"), join(target, "LICENSE.md"));
  cpSync(shim, join(target, "storage-shim.js"));

  // 4. Adaptations à l'intégration dans le site
  // Stockage cloisonné, chargé avant les scripts de Bonjourr (voir storage-shim.js)
  patch(
    join(target, "index.html"),
    '<script src="src/scripts/help-mode.js" defer></script>',
    '<script src="storage-shim.js"></script>\n        <script src="src/scripts/help-mode.js" defer></script>'
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

- index.html : chargement de storage-shim.js, qui préfixe les clés de localStorage et sessionStorage
- src/scripts/main.js : traductions chargées depuis _locales/ (relatif à index.html, et non à la
  racine du domaine) ; enregistrement du service worker supprimé
`
  );

  console.log(`Bonjourr ${BONJOURR_VERSION} installé dans public/apps/bonjourr`);
} finally {
  rmSync(work, { recursive: true, force: true });
}
