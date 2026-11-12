import { normalizeUrl } from "@/models/widgets";
import type { MediaKind, RotationFrequency, UnsplashPhoto, Wallpaper } from "@/types/Wallpaper";

// Préréglages : dégradés, avec une variante pour le thème clair au besoin
export interface WallpaperPreset {
  id: string;
  label: string;
  gradient: { dark: string; light?: string };
}

export const WALLPAPER_PRESETS: WallpaperPreset[] = [
  {
    id: "starbreakers",
    label: "Starbreakers",
    gradient: {
      dark:
        "radial-gradient(60% 50% at 15% 20%, rgb(190 30 45 / 0.85), transparent 70%)," +
        "radial-gradient(50% 45% at 85% 25%, rgb(120 40 160 / 0.75), transparent 70%)," +
        "radial-gradient(55% 50% at 70% 85%, rgb(255 120 60 / 0.55), transparent 70%)," +
        "radial-gradient(45% 40% at 20% 85%, rgb(60 20 120 / 0.8), transparent 70%)," +
        "rgb(41 0 5)",
      light:
        "radial-gradient(60% 50% at 15% 20%, rgb(255 160 170 / 0.9), transparent 70%)," +
        "radial-gradient(50% 45% at 85% 25%, rgb(200 170 255 / 0.85), transparent 70%)," +
        "radial-gradient(55% 50% at 70% 85%, rgb(255 205 150 / 0.85), transparent 70%)," +
        "radial-gradient(45% 40% at 20% 85%, rgb(170 190 255 / 0.8), transparent 70%)," +
        "rgb(250 238 240)",
    },
  },
  {
    id: "ocean",
    label: "Océan",
    gradient: {
      dark:
        "radial-gradient(60% 55% at 20% 15%, rgb(0 122 255 / 0.8), transparent 70%)," +
        "radial-gradient(55% 50% at 85% 70%, rgb(0 199 190 / 0.6), transparent 70%)," +
        "radial-gradient(50% 45% at 30% 90%, rgb(88 86 214 / 0.7), transparent 70%)," +
        "rgb(4 16 40)",
      light:
        "radial-gradient(60% 55% at 20% 15%, rgb(120 190 255 / 0.9), transparent 70%)," +
        "radial-gradient(55% 50% at 85% 70%, rgb(140 235 225 / 0.8), transparent 70%)," +
        "radial-gradient(50% 45% at 30% 90%, rgb(180 180 255 / 0.8), transparent 70%)," +
        "rgb(232 242 252)",
    },
  },
  {
    id: "foret",
    label: "Forêt",
    gradient: {
      dark:
        "radial-gradient(60% 55% at 80% 20%, rgb(52 199 89 / 0.6), transparent 70%)," +
        "radial-gradient(55% 50% at 15% 75%, rgb(0 128 96 / 0.75), transparent 70%)," +
        "radial-gradient(45% 40% at 60% 95%, rgb(200 170 60 / 0.45), transparent 70%)," +
        "rgb(6 26 18)",
      light:
        "radial-gradient(60% 55% at 80% 20%, rgb(170 235 170 / 0.9), transparent 70%)," +
        "radial-gradient(55% 50% at 15% 75%, rgb(150 220 200 / 0.85), transparent 70%)," +
        "radial-gradient(45% 40% at 60% 95%, rgb(250 230 160 / 0.8), transparent 70%)," +
        "rgb(238 246 236)",
    },
  },
  {
    id: "crepuscule",
    label: "Crépuscule",
    gradient: {
      dark:
        "linear-gradient(160deg, rgb(255 94 58 / 0.85), transparent 55%)," +
        "radial-gradient(70% 60% at 80% 90%, rgb(175 82 222 / 0.8), transparent 70%)," +
        "rgb(28 10 40)",
      light:
        "linear-gradient(160deg, rgb(255 190 150), transparent 60%)," +
        "radial-gradient(70% 60% at 80% 90%, rgb(220 180 255), transparent 70%)," +
        "rgb(252 236 244)",
    },
  },
  {
    id: "graphite",
    label: "Graphite",
    gradient: {
      dark: "radial-gradient(80% 70% at 30% 20%, rgb(90 90 100), transparent 70%), rgb(22 22 26)",
      light:
        "radial-gradient(80% 70% at 30% 20%, rgb(255 255 255), transparent 70%), rgb(220 220 226)",
    },
  },
];

// Sélection de vidéos de fond, choisies pour le site. Pour en ajouter une : déposer le fichier dans
// public/ (boucle courte, WebM ou MP4, 20 Mo au plus de préférence) ou utiliser l'adresse d'une
// vidéo libre de droits, puis l'ajouter ici avec son crédit.
export interface WallpaperVideo {
  id: string;
  label: string;
  src: string;
  // Auteur ou ayant droit, affiché en bas à gauche du Buroh
  credit: string;
}

export const WALLPAPER_VIDEOS: WallpaperVideo[] = [
  {
    id: "lol",
    label: "League of Legends",
    src: "/games/lol/lol_trailer.webm",
    credit: "Riot Games",
  },
  { id: "gta", label: "GTA V", src: "/games/gta/gtav_trailer.webm", credit: "Rockstar Games" },
];

export function videoById(id: string | undefined) {
  return WALLPAPER_VIDEOS.find(video => video.id === id) ?? null;
}

// Vidéo suivante au hasard, différente de l'actuelle s'il y en a d'autres
export function pickVideo(currentId?: string) {
  const others = WALLPAPER_VIDEOS.filter(video => video.id !== currentId);
  const pool = others.length ? others : WALLPAPER_VIDEOS;
  return pool[Math.floor(Math.random() * pool.length)]!;
}

export const DEFAULT_WALLPAPER: Wallpaper = { source: "preset", preset: "starbreakers" };

// Thèmes proposés avec une clé d'API Unsplash (requête de recherche envoyée à l'API)
export const UNSPLASH_TOPICS = [
  { value: "nature", label: "Nature" },
  { value: "landscape", label: "Paysages" },
  { value: "mountains", label: "Montagnes" },
  { value: "ocean", label: "Océan" },
  { value: "space", label: "Espace" },
  { value: "city night", label: "Villes la nuit" },
  { value: "architecture", label: "Architecture" },
  { value: "abstract", label: "Abstrait" },
];

export const ROTATION_FREQUENCIES: { value: RotationFrequency; label: string; hours: number }[] = [
  { value: "visit", label: "À chaque visite", hours: 0 },
  { value: "hour", label: "Toutes les heures", hours: 1 },
  { value: "day", label: "Chaque jour", hours: 24 },
  { value: "pause", label: "Fixe", hours: Infinity },
];

// Fichiers acceptés depuis l'ordinateur
export const WALLPAPER_FILE_MAX_SIZE = 100 * 1024 * 1024;

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

const PAGE_LOADED_AT = Date.now();

// Photo ou vidéo à renouveler selon le rythme choisi, d'après la date où elle a été choisie
// (« à chaque visite » : une fois par chargement du site)
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
  if (!url || !photoUrl || typeof photo.id !== "string") return null;

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
        topic: UNSPLASH_TOPICS.some(topic => topic.value === wallpaper.topic)
          ? String(wallpaper.topic)
          : UNSPLASH_TOPICS[0]!.value,
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
