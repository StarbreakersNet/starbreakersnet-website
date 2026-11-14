import SELECTION from "@/models/unsplashSelection.json";
import type { UnsplashPhoto } from "@/types/Wallpaper";

// Photos Unsplash du fond d'écran de Buroh : par l'API officielle avec la clé d'accès de
// l'utilisateur, sinon (ou si l'API ne répond pas) dans la sélection intégrée au site
// (models/unsplashSelection.json, générée par `yarn unsplash:selection`).

const API_URL = "https://api.unsplash.com";
const SITE_URL = "https://unsplash.com";
const REFERRAL = "utm_source=starbreakersnet&utm_medium=referral";

interface SelectionPhoto {
  id: string;
  raw: string;
  author: string;
  username: string;
}

const selection: Record<string, SelectionPhoto[]> = SELECTION;

function screenWidth() {
  return Math.min(3840, Math.round(window.screen.width * (window.devicePixelRatio || 1)));
}

function imageUrl(raw: string) {
  const separator = raw.includes("?") ? "&" : "?";

  return `${raw}${separator}w=${screenWidth()}&q=80&fm=jpg&fit=crop`;
}

function apiHeaders(key: string) {
  return { "Authorization": `Client-ID ${key}`, "Accept-Version": "v1" };
}

export function withReferral(url: string) {
  return `${url}${url.includes("?") ? "&" : "?"}${REFERRAL}`;
}

export interface PhotoQuery {
  topic: string;
  collection: string;
  photo?: { id: string } | null;
}

async function fromApi({ topic, collection }: PhotoQuery, key: string): Promise<UnsplashPhoto> {
  const params = new URLSearchParams({ orientation: "landscape", content_filter: "high" });

  if (collection) {
    params.set("collections", collection);
  } else {
    params.set("query", topic);
  }

  const headers = apiHeaders(key);
  const response = await fetch(`${API_URL}/photos/random?${params}`, { headers });

  if (!response.ok) {
    throw new Error(`Unsplash : ${response.status}`);
  }

  const photo = await response.json();

  // Signalement d'utilisation, exigé par les conditions de l'API
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

function fromSelection({ topic, photo }: PhotoQuery): UnsplashPhoto {
  const pool = selection[topic]?.length ? selection[topic] : Object.values(selection).flat();
  const others = pool.filter(item => item.id !== photo?.id);
  const choices = others.length ? others : pool;
  const picked = choices[Math.floor(Math.random() * choices.length)]!;

  return {
    id: picked.id,
    url: imageUrl(picked.raw),
    author: picked.author,
    photoUrl: `${SITE_URL}/photos/${picked.id}`,
    authorUrl: `${SITE_URL}/@${picked.username}`,
    fetchedAt: new Date().toISOString(),
  };
}

export async function fetchRandomPhoto(query: PhotoQuery, key: string): Promise<UnsplashPhoto> {
  let photo: UnsplashPhoto | null = null;

  if (key) {
    photo = await fromApi(query, key).catch(() => null);
  }

  return photo ?? fromSelection(query);
}

// « invalid » : clé refusée par Unsplash ; « unavailable » : pas de réponse, ou limite atteinte
export async function checkUnsplashKey(key: string): Promise<"ok" | "invalid" | "unavailable"> {
  let result: "ok" | "invalid" | "unavailable" = "unavailable";

  try {
    const response = await fetch(`${API_URL}/photos/random`, { headers: apiHeaders(key) });

    if (response.ok) {
      result = "ok";
    }

    if (response.status === 401) {
      result = "invalid";
    }
  } catch {
    result = "unavailable";
  }

  return result;
}
