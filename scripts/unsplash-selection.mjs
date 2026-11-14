#!/usr/bin/env node
// Génère src/models/unsplashSelection.json, la sélection de photos Unsplash utilisée par Buroh
// sans clé d'accès. Outil de mainteneur, lancé seulement pour renouveler la sélection :
//
//   UNSPLASH_ACCESS_KEY=<clé> yarn unsplash:selection [--per-topic 12]

import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUT = join(ROOT, "src/models/unsplashSelection.json");

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

const key = process.env.UNSPLASH_ACCESS_KEY;

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

  // Photos gratuites seulement : Unsplash+ est sous licence payante
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

async function writeSelection() {
  const selection = {};

  for (const topic of TOPICS) {
    selection[topic] = await searchTopic(topic);
    console.log(`${topic} : ${selection[topic].length} photos`);
  }

  writeFileSync(OUTPUT, `${JSON.stringify(selection, null, 2)}\n`);
  console.log(`Sélection enregistrée dans ${OUTPUT.slice(ROOT.length + 1)}`);
}

if (key) {
  await writeSelection();
} else {
  console.error("UNSPLASH_ACCESS_KEY manquante");
  process.exitCode = 1;
}
