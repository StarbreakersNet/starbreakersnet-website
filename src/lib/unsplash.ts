import type { UnsplashPhoto } from "@/types/Wallpaper";

// Photos Unsplash pour le fond d'écran de la page Bureau.
// - Avec une clé d'API (VITE_UNSPLASH_ACCESS_KEY, gratuite sur unsplash.com/developers) : photo au
//   hasard dans un thème ou une collection, par l'API officielle, avec le suivi de téléchargement
//   qu'elle demande.
// - Sans clé : photo au hasard parmi celles d'Unsplash reprises par Lorem Picsum (picsum.photos),
//   gratuit et sans clé, mais sans choix de thème.
// Dans les deux cas, l'image est affichée depuis le CDN d'origine et le photographe est crédité,
// comme le demandent les conditions d'Unsplash.

const ACCESS_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;
const API_URL = "https://api.unsplash.com";
const PICSUM_URL = "https://picsum.photos";
// Paramètres de suivi demandés par Unsplash sur les liens de crédit
const REFERRAL = "utm_source=starbreakersnet&utm_medium=referral";

export const hasUnsplashKey = Boolean(ACCESS_KEY);

// Largeur demandée : celle de l'écran en pixels réels, plafonnée
function screenWidth() {
  return Math.min(3840, Math.round(window.screen.width * (window.devicePixelRatio || 1)));
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
    url: `${photo.urls.raw}&w=${screenWidth()}&q=80&fm=jpg&fit=crop`,
    author: photo.user.name,
    photoUrl: photo.links.html,
    authorUrl: photo.user.links.html,
    fetchedAt: new Date().toISOString(),
  };
}

async function fromPicsum(): Promise<UnsplashPhoto> {
  // Une page au hasard de la liste, puis une photo en paysage au hasard dans cette page
  const page = 1 + Math.floor(Math.random() * 10);
  const response = await fetch(`${PICSUM_URL}/v2/list?page=${page}&limit=100`);
  if (!response.ok) throw new Error(`Lorem Picsum : ${response.status}`);

  const list = (await response.json()) as {
    id: string;
    author: string;
    width: number;
    height: number;
    url: string;
  }[];
  const landscapes = list.filter(item => item.width > item.height);
  const photo = landscapes[Math.floor(Math.random() * landscapes.length)];
  if (!photo) throw new Error("Lorem Picsum : aucune photo");

  const width = screenWidth();
  return {
    id: `picsum-${photo.id}`,
    url: `${PICSUM_URL}/id/${photo.id}/${width}/${Math.round((width * 9) / 16)}`,
    author: photo.author,
    photoUrl: photo.url,
    authorUrl: null,
    fetchedAt: new Date().toISOString(),
  };
}

export interface PhotoQuery {
  topic: string;
  collection: string;
}

export function fetchRandomPhoto(query: PhotoQuery): Promise<UnsplashPhoto> {
  return hasUnsplashKey ? fromApi(query) : fromPicsum();
}
