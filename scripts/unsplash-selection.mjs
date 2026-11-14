#!/usr/bin/env node
// Génère la sélection de photos Unsplash de Buroh (src/models/unsplashSelection.json) : quelques
// photos en paysage par thème, prises par l'API officielle d'Unsplash. Elle sert de fond d'écran
// sans clé d'API, et de secours quand l'API ne répond pas (limite de requêtes atteinte, panne).
//
//   yarn unsplash:selection [--per-topic 12]
//
// Derrière un proxy (HTTPS_PROXY) : NODE_USE_ENV_PROXY=1 yarn unsplash:selection
//
// Demande VITE_UNSPLASH_ACCESS_KEY, dans l'environnement ou dans le .env du front. À relancer
// seulement pour renouveler la sélection, puis relire et enregistrer le fichier généré.
//
// Aucune dépendance : Node 22.

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUT = join(ROOT, "src/models/unsplashSelection.json");

// Mêmes valeurs que UNSPLASH_TOPICS (src/models/wallpapers.ts)
const TOPICS = [
  "nature",
  "landscape",
  "mountains",
  "ocean",
  "space",
  "city night",
  "architecture",
  "abstract",
];

const { values } = parseArgs({
  options: { "per-topic": { type: "string", default: "12" } },
});
const perTopic = Math.min(30, Math.max(1, Number(values["per-topic"]) || 12));

function readKey() {
  if (process.env.VITE_UNSPLASH_ACCESS_KEY) return process.env.VITE_UNSPLASH_ACCESS_KEY;

  const envFile = join(ROOT, ".env");
  if (!existsSync(envFile)) return "";

  const line = readFileSync(envFile, "utf8")
    .split("\n")
    .find(item => item.startsWith("VITE_UNSPLASH_ACCESS_KEY="));

  return (
    line
      ?.slice("VITE_UNSPLASH_ACCESS_KEY=".length)
      .trim()
      .replace(/^["']|["']$/g, "") ?? ""
  );
}

const key = readKey();

if (!key) {
  console.error("VITE_UNSPLASH_ACCESS_KEY manquante (environnement ou .env du front)");
  process.exit(1);
}

async function searchTopic(topic) {
  const params = new URLSearchParams({
    query: topic,
    orientation: "landscape",
    content_filter: "high",
    order_by: "relevant",
    per_page: String(perTopic),
  });
  const response = await fetch(`https://api.unsplash.com/search/photos?${params}`, {
    headers: { "Authorization": `Client-ID ${key}`, "Accept-Version": "v1" },
  });

  if (!response.ok) {
    throw new Error(`Unsplash (${topic}) : ${response.status} ${await response.text()}`);
  }

  const { results } = await response.json();

  // Photos gratuites en paysage (pas d'Unsplash+, sous licence payante), avec les seuls champs utiles
  // au fond d'écran et au crédit du photographe
  return results
    .filter(photo => photo.width > photo.height && !photo.premium && !photo.plus)
    .filter(photo => new URL(photo.urls.raw).hostname === "images.unsplash.com")
    .map(photo => ({
      id: photo.id,
      raw: photo.urls.raw,
      author: photo.user.name,
      username: photo.user.username,
    }));
}

const selection = {};

for (const topic of TOPICS) {
  selection[topic] = await searchTopic(topic);
  console.log(`${topic} : ${selection[topic].length} photos`);
}

writeFileSync(OUTPUT, `${JSON.stringify(selection, null, 2)}\n`);
console.log(`Sélection enregistrée dans ${OUTPUT.slice(ROOT.length + 1)}`);
