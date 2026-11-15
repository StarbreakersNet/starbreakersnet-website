import { WALLPAPER_PRESETS, DEFAULT_WALLPAPER } from "@/models/WallpaperPreset";
import { WALLPAPER_VIDEOS } from "@/models/WallpaperVideo";
import { ROTATION_FREQUENCIES } from "@/models/RotationFrequencyOption";
import { normalizeUrl } from "@/utils/url";
import type { MediaKind, RotationFrequency, UnsplashPhoto, Wallpaper } from "@/types/Wallpaper";

export function videoById(id: string | undefined) {
  return WALLPAPER_VIDEOS.find(video => video.id === id) ?? null;
}

// Vidéo suivante au hasard, différente de l'actuelle s'il y en a d'autres
export function pickVideo(currentId?: string) {
  const others = WALLPAPER_VIDEOS.filter(video => video.id !== currentId);
  const pool = others.length ? others : WALLPAPER_VIDEOS;
  return pool[Math.floor(Math.random() * pool.length)]!;
}

const VIDEO_EXTENSIONS = /\.(mp4|webm|mov|m4v|ogv)(\?|#|$)/i;

export function guessMediaKind(url: string): MediaKind {
  return VIDEO_EXTENSIONS.test(url) ? "video" : "image";
}

export function presetById(id: string) {
  return WALLPAPER_PRESETS.find(preset => preset.id === id) ?? WALLPAPER_PRESETS[0]!;
}

// Collection Unsplash donnée par son adresse (unsplash.com/collections/<id>/<nom>) ou son identifiant
export function parseUnsplashCollection(input: string): string | null {
  const value = input.trim();
  const match = value.match(/unsplash\.com\/(?:[a-z-]+\/)?collections\/([A-Za-z0-9_-]+)/);
  const id = match ? match[1]! : value;
  return /^[A-Za-z0-9_-]{1,40}$/.test(id) ? id : null;
}

export function normalizeUnsplashKey(raw: unknown) {
  const key = typeof raw === "string" ? raw.trim() : "";

  return /^[A-Za-z0-9_-]{20,100}$/.test(key) ? key : "";
}

const PAGE_LOADED_AT = Date.now();

// Photo ou vidéo à renouveler selon le rythme choisi, d'après la date où elle a été choisie
// ("à chaque visite" : une fois par chargement du site)
export function isStale(chosenAt: string | undefined, frequency: RotationFrequency) {
  if (!chosenAt) return true;
  const time = new Date(chosenAt).getTime();
  if (frequency === "visit") return time < PAGE_LOADED_AT;

  const hours = ROTATION_FREQUENCIES.find(item => item.value === frequency)?.hours ?? 24;
  return hours !== Infinity && Date.now() - time >= hours * 3600 * 1000;
}

function normalizeFrequency(raw: unknown): RotationFrequency {
  return ROTATION_FREQUENCIES.some(item => item.value === raw) ? (raw as RotationFrequency) : "day";
}

function normalizePhoto(raw: unknown): UnsplashPhoto | null {
  if (!raw || typeof raw !== "object") return null;
  const photo = raw as Record<string, unknown>;
  const url = typeof photo.url === "string" ? normalizeUrl(photo.url) : null;
  const photoUrl = typeof photo.photoUrl === "string" ? normalizeUrl(photo.photoUrl) : null;
  // Seules les photos du CDN d'Unsplash restent (les anciennes de Lorem Picsum sont écartées)
  const fromUnsplash = url !== null && new URL(url).hostname === "images.unsplash.com";
  if (!fromUnsplash || !photoUrl || typeof photo.id !== "string") return null;

  return {
    id: photo.id,
    url,
    photoUrl,
    author: typeof photo.author === "string" ? photo.author.slice(0, 80) : "",
    authorUrl: typeof photo.authorUrl === "string" ? normalizeUrl(photo.authorUrl) : null,
    fetchedAt:
      typeof photo.fetchedAt === "string" && !Number.isNaN(Date.parse(photo.fetchedAt))
        ? photo.fetchedAt
        : new Date(0).toISOString(),
  };
}

// Fond relu depuis le stockage : valeurs inconnues ou abîmées remplacées par le fond par défaut
export function normalizeWallpaper(raw: unknown): Wallpaper {
  if (!raw || typeof raw !== "object") return DEFAULT_WALLPAPER;
  const wallpaper = raw as Record<string, unknown>;
  const kind: MediaKind = wallpaper.kind === "video" ? "video" : "image";

  switch (wallpaper.source) {
    case "preset": {
      // Anciennes vidéos préréglées, désormais dans la sélection de vidéos
      const video = videoById(String(wallpaper.preset));
      if (video) {
        return {
          source: "videos",
          frequency: "pause",
          video: { id: video.id, pickedAt: new Date().toISOString() },
        };
      }
      return { source: "preset", preset: presetById(String(wallpaper.preset)).id };
    }
    case "videos": {
      const current = wallpaper.video as Record<string, unknown> | null | undefined;
      const video = videoById(current?.id as string | undefined);
      return {
        source: "videos",
        frequency: normalizeFrequency(wallpaper.frequency),
        video:
          video && typeof current?.pickedAt === "string"
            ? { id: video.id, pickedAt: current.pickedAt }
            : null,
      };
    }
    case "unsplash":
      return {
        source: "unsplash",
        topic:
          typeof wallpaper.topic === "string" && /^[A-Za-z0-9_-]{1,40}$/.test(wallpaper.topic)
            ? wallpaper.topic
            : "",
        collection:
          typeof wallpaper.collection === "string"
            ? (parseUnsplashCollection(wallpaper.collection) ?? "")
            : "",
        frequency: normalizeFrequency(wallpaper.frequency),
        photo: normalizePhoto(wallpaper.photo),
      };
    case "url": {
      const url = typeof wallpaper.url === "string" ? normalizeUrl(wallpaper.url) : null;
      return url ? { source: "url", kind, url } : DEFAULT_WALLPAPER;
    }
    case "file":
      return {
        source: "file",
        kind,
        name: typeof wallpaper.name === "string" ? wallpaper.name.slice(0, 120) : "",
        addedAt: typeof wallpaper.addedAt === "string" ? wallpaper.addedAt : "",
      };
    default:
      return DEFAULT_WALLPAPER;
  }
}
