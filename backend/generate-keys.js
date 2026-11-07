#!/usr/bin/env node
// Génère les secrets de la stack Supabase, au format du .env (à copier-coller).
//
// Usage :
//   node backend/generate-keys.js               -> génère tous les secrets
//   node backend/generate-keys.js <JWT_SECRET>  -> régénère ANON_KEY et SERVICE_ROLE_KEY
//                                                  à partir d'un JWT_SECRET existant
//
// Un jeu de secrets différent par environnement (local, staging, prod).
// Attention : POSTGRES_PASSWORD n'est appliqué qu'à l'initialisation de la base. Le changer
// ensuite dans le .env ne modifie pas les mots de passe déjà enregistrés dans Postgres.

import crypto from "node:crypto";

// Hexadécimal : utilisable tel quel dans une URL de connexion Postgres et dans kong.yml
const randomHex = bytes => crypto.randomBytes(bytes).toString("hex");

const base64url = obj => Buffer.from(JSON.stringify(obj)).toString("base64url");

// Clés API legacy : JWT HS256 signés avec JWT_SECRET
function signJWT(role, secret) {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    role,
    iss: "supabase",
    iat: now,
    exp: now + 10 * 365 * 24 * 60 * 60, // 10 ans - clé API long-lived, pas un token de session
  };
  const data = `${base64url(header)}.${base64url(payload)}`;
  const signature = crypto.createHmac("sha256", secret).update(data).digest("base64url");
  return `${data}.${signature}`;
}

const providedSecret = process.argv[2];

if (providedSecret && providedSecret.length < 32) {
  console.error("JWT_SECRET doit contenir au moins 32 caractères.");
  process.exit(1);
}

const jwtSecret = providedSecret ?? randomHex(32);
const lines = [];

if (!providedSecret) {
  lines.push(`POSTGRES_PASSWORD=${randomHex(24)}`, `JWT_SECRET=${jwtSecret}`);
}

lines.push(
  `ANON_KEY=${signJWT("anon", jwtSecret)}`,
  `SERVICE_ROLE_KEY=${signJWT("service_role", jwtSecret)}`
);

if (!providedSecret) {
  lines.push(`DASHBOARD_PASSWORD=${randomHex(24)}`, `PG_META_CRYPTO_KEY=${randomHex(32)}`);
}

console.log(lines.join("\n"));
