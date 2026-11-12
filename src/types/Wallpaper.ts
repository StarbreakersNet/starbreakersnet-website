// Fond d'écran de la page Bureau : dégradé, photo Unsplash ou vidéo de la sélection du site (avec
// renouvellement), image ou vidéo par adresse, ou fichier de l'ordinateur (gardé dans le navigateur,
// voir lib/wallpaperFile.ts)

export type MediaKind = "image" | "video";

// Renouvellement des photos Unsplash et des vidéos de la sélection
export type RotationFrequency = "visit" | "hour" | "day" | "pause";

export interface UnsplashPhoto {
  id: string;
  // Adresse de l'image à afficher (CDN d'Unsplash ou Lorem Picsum)
  url: string;
  author: string;
  // Page de la photo sur Unsplash, pour le crédit
  photoUrl: string;
  // Profil du photographe (API Unsplash uniquement)
  authorUrl: string | null;
  // Date de récupération (ISO), pour le rythme de renouvellement
  fetchedAt: string;
}

export type Wallpaper =
  | { source: "preset"; preset: string }
  | {
      source: "unsplash";
      topic: string;
      // Identifiant d'une collection Unsplash (vide : le thème s'applique)
      collection: string;
      frequency: RotationFrequency;
      photo: UnsplashPhoto | null;
    }
  | {
      source: "videos";
      frequency: RotationFrequency;
      // Vidéo affichée (identifiant dans WALLPAPER_VIDEOS) et date de son choix (ISO)
      video: { id: string; pickedAt: string } | null;
    }
  | { source: "url"; kind: MediaKind; url: string }
  // addedAt : date d'ajout (ISO), pour relire le fichier quand on en choisit un autre
  | { source: "file"; kind: MediaKind; name: string; addedAt: string };

// Apparence du fond, transmise au verre des widgets
export interface WallpaperAppearance {
  kind: "gradient" | MediaKind;
  // Miniature floue pour le verre (photos uniquement, voir lib/backdrop.ts)
  backdrop: string | null;
}
