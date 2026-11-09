#!/usr/bin/env node
// Génère les .env de la stack Supabase et du front, avec les scripts officiels de Supabase
// (utils/generate-keys.sh, utils/add-new-auth-keys.sh) pour les secrets.
//
//   yarn env:local [--https-port 8443] [--http-port 8080] [--db-port 54322]
//       supabase/docker/.env et .env (front) pour le poste de développement.
//       Relançable : les secrets existants sont conservés, seules les valeurs locales sont réécrites.
//
//   yarn env:deploy <beta|live|…> --api-domain <domaine> --site-domain <domaine> --api-port <port> --front-port <port>
//       [--shared project|environment]
//       supabase/docker/.env.<nom> et .env.<nom> (applications Dokploy Supabase et Front), à copier
//       dans Dokploy puis à supprimer du poste. Nouveaux secrets à chaque génération.
//       Avec --shared : valeurs communes dans .env.<nom>.shared (variables partagées du projet ou de
//       l'environnement Dokploy), et références (${{project.NOM}}) dans les deux applications.
//
// Aucune dépendance : Node 22, sh, openssl (requis par les scripts officiels).

import { execFileSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SUPABASE_DIR = join(ROOT, "supabase", "docker");

// --- Lecture / écriture de variables dans un .env, sans toucher au reste du fichier

function getVar(content, name) {
  const match = content.match(new RegExp(`^${name}=(.*)$`, "m"));
  return match ? match[1] : undefined;
}

function setVars(content, vars) {
  let result = content;
  for (const [name, value] of Object.entries(vars)) {
    const line = `${name}=${value}`;
    const pattern = new RegExp(`^${name}=.*$`, "m");
    if (pattern.test(result)) {
      result = result.replace(pattern, () => line);
    } else {
      result = `${result.replace(/\n*$/, "\n")}${line}\n`;
    }
  }
  return result;
}

function updateFile(path, vars) {
  writeFileSync(path, setVars(readFileSync(path, "utf8"), vars));
}

// --- Secrets : scripts officiels, lancés dans le dossier qui contient .env et docker-compose.yml

function run(command, args, cwd) {
  execFileSync(command, args, { cwd, stdio: ["ignore", "ignore", "inherit"] });
}

function generateSecrets(dir) {
  run("sh", [join(SUPABASE_DIR, "utils", "generate-keys.sh"), "--update-env"], dir);
  run("sh", [join(SUPABASE_DIR, "utils", "add-new-auth-keys.sh"), "--update-env"], dir);
  // Copies de sauvegarde laissées par les scripts (sed -i.old)
  rmSync(join(dir, ".env.old"), { force: true });
  rmSync(join(dir, "docker-compose.yml.old"), { force: true });
}

// --- Valeurs propres au projet

const PROJECT_VALUES = {
  STUDIO_DEFAULT_ORGANIZATION: "StarbreakersNet",
  STUDIO_DEFAULT_PROJECT: "starbreakersnet-website",
  SMTP_SENDER_NAME: "StarbreakersNet",
};

function frontEnv(path, vars) {
  if (!existsSync(path)) {
    copyFileSync(join(ROOT, ".env.example"), path);
  }
  updateFile(path, vars);
}

function fail(message) {
  console.error(`ERREUR : ${message}`);
  process.exit(1);
}

function portOption(value, name) {
  if (value === undefined) return undefined;
  if (!/^\d+$/.test(value) || Number(value) < 1 || Number(value) > 65535) {
    fail(`--${name} doit être un numéro de port (1-65535), reçu « ${value} ».`);
  }
  return value;
}

function dbVolumeExists() {
  try {
    execFileSync("docker", ["volume", "inspect", "supabase_db-data"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

// --- Poste de développement

function setupLocal(options) {
  const supabaseEnv = join(SUPABASE_DIR, ".env");
  const created = !existsSync(supabaseEnv);

  if (created) {
    if (dbVolumeExists()) {
      console.warn(
        "ATTENTION : le volume supabase_db-data existe déjà. La base a été initialisée avec les anciens secrets :\n" +
          "  supprimez-le (docker compose down -v, depuis supabase/docker) avant de démarrer, sinon les services ne s'y connecteront pas.\n"
      );
    }
    copyFileSync(join(SUPABASE_DIR, ".env.example"), supabaseEnv);
    generateSecrets(SUPABASE_DIR);
  }

  // Ports locaux : ceux passés en option, sinon ceux déjà enregistrés dans .env
  const current = readFileSync(supabaseEnv, "utf8");
  const ports = {
    LOCAL_HTTPS_PORT:
      portOption(options["https-port"], "https-port") ?? getVar(current, "LOCAL_HTTPS_PORT"),
    LOCAL_HTTP_PORT:
      portOption(options["http-port"], "http-port") ?? getVar(current, "LOCAL_HTTP_PORT"),
    LOCAL_DB_PORT: portOption(options["db-port"], "db-port") ?? getVar(current, "LOCAL_DB_PORT"),
  };
  const httpsPort =
    ports.LOCAL_HTTPS_PORT && ports.LOCAL_HTTPS_PORT !== "443" ? `:${ports.LOCAL_HTTPS_PORT}` : "";
  const apiUrl = `https://api.starbreakers.localhost${httpsPort}`;
  const siteUrl = `https://starbreakers.localhost${httpsPort}`;

  updateFile(supabaseEnv, {
    SUPABASE_PUBLIC_URL: apiUrl,
    API_EXTERNAL_URL: `${apiUrl}/auth/v1`,
    SITE_URL: siteUrl,
    ADDITIONAL_REDIRECT_URLS: `${siteUrl}/**`,
    ENABLE_EMAIL_AUTOCONFIRM: "true",
    SMTP_HOST: "mailpit",
    SMTP_PORT: "1025",
    SMTP_USER: "",
    SMTP_PASS: "",
    SMTP_ADMIN_EMAIL: "noreply@starbreakers.localhost",
    ...PROJECT_VALUES,
    ...Object.fromEntries(Object.entries(ports).filter(([, value]) => value !== undefined)),
  });

  // Overrides du projet (sans doublon si déjà présents)
  run("sh", ["run.sh", "config", "add", "starbreakers", "local"], SUPABASE_DIR);

  const content = readFileSync(supabaseEnv, "utf8");
  const frontPath = join(ROOT, ".env");
  frontEnv(frontPath, {
    VITE_SUPABASE_URL: apiUrl,
    VITE_SUPABASE_PUBLISHABLE_KEY: getVar(content, "SUPABASE_PUBLISHABLE_KEY"),
  });

  console.log(`
${created ? "Créé" : "Mis à jour (secrets conservés)"} : supabase/docker/.env
Mis à jour : .env (front)

  Front   ${siteUrl}
  Studio  ${apiUrl}  (${getVar(content, "DASHBOARD_USERNAME")} / ${getVar(content, "DASHBOARD_PASSWORD")})
  Mails   https://mail.starbreakers.localhost${httpsPort}

Ensuite : cd supabase/docker && docker compose up -d, puis yarn dev à la racine.`);
}

// --- Staging / prod

function setupDeploy(name, options) {
  if (!name || !/^[a-z0-9-]+$/.test(name)) {
    fail(
      "indiquez le nom de l'environnement (minuscules, chiffres, tirets), par ex. : yarn env:deploy beta …"
    );
  }
  for (const option of ["api-domain", "site-domain", "api-port", "front-port"]) {
    if (!options[option]) fail(`--${option} est obligatoire.`);
  }
  for (const option of ["api-domain", "site-domain"]) {
    if (!/^[a-z0-9.-]+$/.test(options[option])) {
      fail(
        `--${option} doit être un nom de domaine, sans https:// ni chemin, reçu « ${options[option]} ».`
      );
    }
  }
  const apiPort = portOption(options["api-port"], "api-port");
  const frontPort = portOption(options["front-port"], "front-port");
  if (apiPort === frontPort) fail("--api-port et --front-port doivent être différents.");

  // Valeurs communes aux deux applications. Avec --shared (Dokploy >= 0.12 pour « project »,
  // environnements Dokploy pour « environment »), elles vont dans les variables partagées et les
  // applications y font référence (${{project.NOM}}) ; sinon, elles sont écrites dans chaque fichier.
  const scope = options.shared;
  if (scope !== undefined && scope !== "project" && scope !== "environment") {
    fail(`--shared vaut « project » ou « environment », reçu « ${scope} ».`);
  }
  const shared = {
    API_DOMAIN: options["api-domain"],
    SITE_DOMAIN: options["site-domain"],
    SUPABASE_PUBLISHABLE_KEY: "",
    API_GW_HTTP_PORT: apiPort,
    FRONT_HTTP_PORT: frontPort,
  };
  const ref = variable => (scope ? `\${{${scope}.${variable}}}` : shared[variable]);

  const sharedOut = join(ROOT, `.env.${name}.shared`);
  const supabaseOut = join(SUPABASE_DIR, `.env.${name}`);
  const frontOut = join(ROOT, `.env.${name}`);
  for (const path of scope ? [sharedOut, supabaseOut, frontOut] : [supabaseOut, frontOut]) {
    if (existsSync(path) && !options.force) {
      fail(
        `${relative(ROOT, path)} existe déjà. Supprimez-le, ou relancez avec --force pour générer de nouveaux secrets.`
      );
    }
  }

  // Génération dans un dossier temporaire : supabase/docker/.env (local) n'est pas touché
  const workDir = mkdtempSync(join(tmpdir(), "starbreakers-env-"));
  try {
    copyFileSync(join(SUPABASE_DIR, ".env.example"), join(workDir, ".env"));
    copyFileSync(join(SUPABASE_DIR, "docker-compose.yml"), join(workDir, "docker-compose.yml"));
    generateSecrets(workDir);

    shared.SUPABASE_PUBLISHABLE_KEY = getVar(
      readFileSync(join(workDir, ".env"), "utf8"),
      "SUPABASE_PUBLISHABLE_KEY"
    );
    updateFile(join(workDir, ".env"), {
      SUPABASE_PUBLIC_URL: `https://${ref("API_DOMAIN")}`,
      API_EXTERNAL_URL: `https://${ref("API_DOMAIN")}/auth/v1`,
      SITE_URL: `https://${ref("SITE_DOMAIN")}`,
      ADDITIONAL_REDIRECT_URLS: `https://${ref("SITE_DOMAIN")}/**`,
      SUPABASE_PUBLISHABLE_KEY: ref("SUPABASE_PUBLISHABLE_KEY"),
      API_GW_HTTP_PORT: ref("API_GW_HTTP_PORT"),
      ENABLE_EMAIL_AUTOCONFIRM: "false",
      DASHBOARD_USERNAME: "admin",
      SMTP_HOST: "ssl0.ovh.net",
      SMTP_PORT: "465",
      SMTP_USER: "",
      SMTP_PASS: "",
      SMTP_ADMIN_EMAIL: "noreply@starbreakers.net",
      ...PROJECT_VALUES,
    });
    copyFileSync(join(workDir, ".env"), supabaseOut);
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }

  if (scope) {
    writeFileSync(
      sharedOut,
      `# Variables partagées (${scope}) de Dokploy pour « ${name} »\n` +
        Object.entries(shared)
          .map(([key, value]) => `${key}=${value}\n`)
          .join("")
    );
  } else {
    rmSync(sharedOut, { force: true });
  }
  writeFileSync(
    frontOut,
    `# Application Dokploy « Front » (${name})
VITE_SUPABASE_URL=https://${ref("API_DOMAIN")}
VITE_SUPABASE_PUBLISHABLE_KEY=${ref("SUPABASE_PUBLISHABLE_KEY")}
FRONT_HTTP_PORT=${ref("FRONT_HTTP_PORT")}
`
  );

  const content = readFileSync(supabaseOut, "utf8");
  console.log(`
Créés (non versionnés), à coller dans Dokploy :${
    scope ? `\n  ${relative(ROOT, sharedOut)}  → variables partagées (${scope})` : ""
  }
  ${relative(ROOT, supabaseOut)}  → Environment de l'application « Supabase »
  ${relative(ROOT, frontOut)}  → Environment de l'application « Front »

À compléter dans l'application Supabase : SMTP_USER et SMTP_PASS (boîte mail OVH).
Studio : admin / ${getVar(content, "DASHBOARD_PASSWORD")}  (à ranger dans le gestionnaire de mots de passe)

Une fois copiés dans Dokploy, supprimez ces fichiers du poste.`);
}

// --- Point d'entrée

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    "https-port": { type: "string" },
    "http-port": { type: "string" },
    "db-port": { type: "string" },
    "api-domain": { type: "string" },
    "site-domain": { type: "string" },
    "api-port": { type: "string" },
    "front-port": { type: "string" },
    "shared": { type: "string" },
    "force": { type: "boolean" },
  },
});

const [mode, name] = positionals;
if (mode === "local") {
  setupLocal(values);
} else if (mode === "deploy") {
  setupDeploy(name, values);
} else {
  fail(
    "usage : yarn env:local [--https-port 8443 …] | yarn env:deploy <nom> --api-domain … --site-domain … --api-port … --front-port …"
  );
}
