import type { Wallpaper } from "@/types/Wallpaper";

export type WallpaperMotion = "aurora" | "stars" | "waves";

// Préréglages : fonds maison, avec une variante pour le thème clair au besoin
export interface WallpaperPreset {
  id: string;
  label: string;
  gradient: { dark: string; light?: string };
  motion?: WallpaperMotion;
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
  {
    id: "aurore",
    label: "Aurore",
    motion: "aurora",
    gradient: {
      dark: "radial-gradient(90% 70% at 50% 110%, rgb(20 40 90), transparent 70%), rgb(5 8 24)",
      light:
        "radial-gradient(90% 70% at 50% 110%, rgb(255 255 255), transparent 70%), rgb(236 240 250)",
    },
  },
  {
    id: "nuit-etoilee",
    label: "Nuit étoilée",
    motion: "stars",
    gradient: {
      dark:
        "radial-gradient(70% 60% at 80% 10%, rgb(120 40 160 / 0.45), transparent 70%)," +
        "radial-gradient(80% 60% at 10% 100%, rgb(190 30 45 / 0.4), transparent 70%)," +
        "linear-gradient(180deg, rgb(6 6 22), rgb(18 10 40))",
      light:
        "radial-gradient(70% 60% at 80% 10%, rgb(200 170 255 / 0.7), transparent 70%)," +
        "radial-gradient(80% 60% at 10% 100%, rgb(255 180 190 / 0.7), transparent 70%)," +
        "linear-gradient(180deg, rgb(214 222 246), rgb(246 232 244))",
    },
  },
  {
    id: "vagues",
    label: "Vagues",
    motion: "waves",
    gradient: {
      dark: "linear-gradient(180deg, rgb(8 18 48), rgb(4 40 70) 70%, rgb(0 70 90))",
      light: "linear-gradient(180deg, rgb(236 246 255), rgb(200 230 250) 70%, rgb(170 220 240))",
    },
  },
];

export const DEFAULT_WALLPAPER: Wallpaper = { source: "preset", preset: "starbreakers" };
