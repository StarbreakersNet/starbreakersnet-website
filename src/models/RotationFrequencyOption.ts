import type { RotationFrequency } from "@/types/Wallpaper";

export interface RotationFrequencyOption {
  value: RotationFrequency;
  label: string;
  hours: number;
}

export const ROTATION_FREQUENCIES: RotationFrequencyOption[] = [
  { value: "visit", label: "À chaque visite", hours: 0 },
  { value: "hour", label: "Toutes les heures", hours: 1 },
  { value: "day", label: "Chaque jour", hours: 24 },
  { value: "pause", label: "Fixe", hours: Infinity },
];
