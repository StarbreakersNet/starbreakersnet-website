#!/usr/bin/env node
// Génère ANON_KEY et SERVICE_ROLE_KEY (JWT HS256 legacy) à partir de JWT_SECRET.
// Usage : node generate-keys.js VOTRE_JWT_SECRET

import crypto from "node:crypto";

const secret = process.argv[2];
if (!secret) {
  console.error("Usage: node generate-keys.js <JWT_SECRET>");
  process.exit(1);
}

const base64url = obj => Buffer.from(JSON.stringify(obj)).toString("base64url");

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

console.log("ANON_KEY=" + signJWT("anon", secret));
console.log("SERVICE_ROLE_KEY=" + signJWT("service_role", secret));
