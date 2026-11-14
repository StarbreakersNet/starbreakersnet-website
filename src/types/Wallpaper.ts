// Fond d'écran de Buroh : dégradé, photo Unsplash ou vidéo de la sélection du site (avec
// renouvellement), image ou vidéo par adresse, ou fichier de l'ordinateur (gardé dans le navigateur,
// voir utils/wallpaperFile.ts)

export type MediaKind = "image" | "video";

// Renouvellement des photos Unsplash et des vidéos de la sélection
export type RotationFrequency = "visit" | "hour" | "day" | "pause";

export interface UnsplashPhoto {
  id: string;
  // Adresse de l'image à afficher (CDN d'Unsplash)
  url: string;
  author: string;
  // Page de la photo sur Unsplash, pour le crédit
  photoUrl: string;
  // Profil du photographe (API Unsplash uniquement)
  authorUrl: string | null;
  // Date de récupération (ISO), pour le rythme de renouvellement
  fetchedAt: string;
}

// Thème constitué par Unsplash (« Wallpapers », « Nature »…)
export interface UnsplashTopic {
  id: string;
  title: string;
}

export interface PresetWallpaper {
  source: "preset";
  // Identifiant dans WALLPAPER_PRESETS
  preset: string;
}

export interface UnsplashWallpaper {
  source: "unsplash";
  // Identifiant d'un thème Unsplash (vide : toutes les photos)
  topic: string;
  // Identifiant d'une collection Unsplash (vide : le thème s'applique)
  collection: string;
  frequency: RotationFrequency;
  photo: UnsplashPhoto | null;
}

export interface VideosWallpaper {
  source: "videos";
  frequency: RotationFrequency;
  // Vidéo affichée (identifiant dans WALLPAPER_VIDEOS) et date de son choix (ISO)
  video: { id: string; pickedAt: string } | null;
}

export interface UrlWallpaper {
  source: "url";
  kind: MediaKind;
  url: string;
}

export interface FileWallpaper {
  source: "file";
  kind: MediaKind;
  name: string;
  // Date d'ajout (ISO), pour relire le fichier quand on en choisit un autre
  addedAt: string;
}

export type Wallpaper =
  | PresetWallpaper
  | UnsplashWallpaper
  | VideosWallpaper
  | UrlWallpaper
  | FileWallpaper;

// « preset » | « unsplash » | « videos » | « url » | « file »
export type WallpaperSource = Wallpaper["source"];

// Apparence du fond, transmise au verre des widgets
export interface WallpaperAppearance {
  kind: "gradient" | MediaKind;
  // Miniature floue pour le verre (photos uniquement, voir utils/backdrop.ts)
  backdrop: string | null;
}
