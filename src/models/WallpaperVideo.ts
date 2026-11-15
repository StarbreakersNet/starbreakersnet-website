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
