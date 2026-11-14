import type { UnsplashPhoto, UnsplashTopic } from "@/types/Wallpaper";

// Photos Unsplash du fond d'écran de Buroh, par l'API officielle avec la clé d'accès de l'utilisateur

const API_URL = "https://api.unsplash.com";
const REFERRAL = "utm_source=starbreakersnet&utm_medium=referral";

function screenWidth() {
  return Math.min(3840, Math.round(window.screen.width * (window.devicePixelRatio || 1)));
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
}

export async function fetchRandomPhoto(
  { topic, collection }: PhotoQuery,
  key: string
): Promise<UnsplashPhoto> {
  const params = new URLSearchParams({ orientation: "landscape", content_filter: "high" });

  if (collection) {
    params.set("collections", collection);
  }

  if (topic && !collection) {
    params.set("topics", topic);
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
    url: `${photo.urls.raw}&w=${screenWidth()}&q=80&fm=jpg&fit=crop`,
    author: photo.user.name,
    photoUrl: photo.links.html,
    authorUrl: photo.user.links.html,
    fetchedAt: new Date().toISOString(),
  };
}

// Thèmes constitués par Unsplash, dans l'ordre où Unsplash les met en avant
export async function fetchTopics(key: string): Promise<UnsplashTopic[]> {
  const params = new URLSearchParams({ per_page: "30", order_by: "featured" });
  const response = await fetch(`${API_URL}/topics?${params}`, { headers: apiHeaders(key) });

  if (!response.ok) {
    throw new Error(`Unsplash : ${response.status}`);
  }

  const topics: { id: string; title: string }[] = await response.json();

  return topics.map(({ id, title }) => ({ id, title }));
}

// « invalid » : clé refusée par Unsplash ; « unavailable » : pas de réponse, ou limite atteinte
export async function checkUnsplashKey(key: string): Promise<"ok" | "invalid" | "unavailable"> {
  let result: "ok" | "invalid" | "unavailable" = "unavailable";

  try {
    const response = await fetch(`${API_URL}/topics?per_page=1`, { headers: apiHeaders(key) });

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
