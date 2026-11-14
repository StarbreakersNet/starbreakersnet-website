import SELECTION from "@/models/unsplashSelection.json";
import type { UnsplashPhoto } from "@/types/Wallpaper";

// Photos Unsplash pour le fond d'écran de Buroh.
// - Avec une clé d'API (VITE_UNSPLASH_ACCESS_KEY, gratuite sur unsplash.com/developers) : photo au
//   hasard dans un thème ou une collection, par l'API officielle, avec le suivi de téléchargement
//   qu'elle demande.
// - Sans clé, ou quand l'API ne répond pas (limite de requêtes atteinte, panne) : photo au hasard
//   dans la sélection intégrée au site, par thème (src/models/unsplashSelection.json, générée par
//   `yarn unsplash:selection`).
// Dans les deux cas, l'image est affichée depuis le CDN d'Unsplash et le photographe est crédité,
// comme le demandent les conditions d'Unsplash.

const ACCESS_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;
const API_URL = "https://api.unsplash.com";
const SITE_URL = "https://unsplash.com";
// Paramètres de suivi demandés par Unsplash sur les liens de crédit
const REFERRAL = "utm_source=starbreakersnet&utm_medium=referral";

export const hasUnsplashKey = Boolean(ACCESS_KEY);

interface SelectionPhoto {
  id: string;
  // Adresse « raw » du CDN d'Unsplash, à compléter par la taille voulue
  raw: string;
  author: string;
  username: string;
}

const selection: Record<string, SelectionPhoto[]> = SELECTION;

// Largeur demandée : celle de l'écran en pixels réels, plafonnée
function screenWidth() {
  return Math.min(3840, Math.round(window.screen.width * (window.devicePixelRatio || 1)));
}

// Image du CDN d'Unsplash à la largeur de l'écran
function imageUrl(raw: string) {
  const separator = raw.includes("?") ? "&" : "?";

  return `${raw}${separator}w=${screenWidth()}&q=80&fm=jpg&fit=crop`;
}

export function withReferral(url: string) {
  return `${url}${url.includes("?") ? "&" : "?"}${REFERRAL}`;
}

// Photo au hasard d'une collection si elle est donnée, sinon du thème
async function fromApi({ topic, collection }: PhotoQuery): Promise<UnsplashPhoto> {
  const params = new URLSearchParams({ orientation: "landscape", content_filter: "high" });
  if (collection) {
    params.set("collections", collection);
  } else {
    params.set("query", topic);
  }
  const headers = { "Authorization": `Client-ID ${ACCESS_KEY}`, "Accept-Version": "v1" };
  const response = await fetch(`${API_URL}/photos/random?${params}`, { headers });
  if (!response.ok) throw new Error(`Unsplash : ${response.status}`);

  const photo = await response.json();
  // Signalement d'utilisation de la photo, exigé par les conditions de l'API
  fetch(photo.links.download_location, { headers }).catch(() => {});

  return {
    id: photo.id,
    url: imageUrl(photo.urls.raw),
    author: photo.user.name,
    photoUrl: photo.links.html,
    authorUrl: photo.user.links.html,
    fetchedAt: new Date().toISOString(),
  };
}

// Photo au hasard de la sélection du thème (toute la sélection si le thème n'y est pas), autre que
// la photo affichée
function fromSelection({ topic, photo }: PhotoQuery): UnsplashPhoto {
  const all = Object.values(selection).flat();
  const pool = selection[topic]?.length ? selection[topic] : all;
  const others = pool.filter(item => item.id !== photo?.id);
  const choices = others.length ? others : pool;
  const picked = choices[Math.floor(Math.random() * choices.length)];
  if (!picked) throw new Error("Sélection Unsplash vide");

  return {
    id: picked.id,
    url: imageUrl(picked.raw),
    author: picked.author,
    photoUrl: `${SITE_URL}/photos/${picked.id}`,
    authorUrl: `${SITE_URL}/@${picked.username}`,
    fetchedAt: new Date().toISOString(),
  };
}

export interface PhotoQuery {
  topic: string;
  collection: string;
  // Photo affichée, pour en proposer une autre
  photo?: { id: string } | null;
}

export async function fetchRandomPhoto(query: PhotoQuery): Promise<UnsplashPhoto> {
  if (hasUnsplashKey) {
    try {
      return await fromApi(query);
    } catch (error) {
      console.warn("API Unsplash indisponible, photo de la sélection intégrée", error);
    }
  }

  return fromSelection(query);
}
