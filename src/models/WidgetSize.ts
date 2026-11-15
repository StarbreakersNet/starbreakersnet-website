import type { WidgetSize } from "@/types/Widget";

// Grille du Buroh : colonnes de cases carrées
export const GRID_COLUMNS = 12;
// Grille du mobile : un petit widget prend la moitié de la largeur, un moyen ou un grand toute la
// largeur
export const MOBILE_COLUMNS = 4;

export const WIDGET_SIZES: Record<WidgetSize, { w: number; h: number; label: string }> = {
  small: { w: 2, h: 2, label: "Petit" },
  medium: { w: 4, h: 2, label: "Moyen" },
  large: { w: 4, h: 4, label: "Grand" },
};
