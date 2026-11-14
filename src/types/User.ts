export interface UserType {
  id?: string;
  username: string | null;
  // Numéro qui distingue les membres ayant le même pseudo (formatUserTag, src/utils/userTag.ts)
  tag?: number | null;
  email: string | null;
  // Nouvelle adresse en attente de confirmation (double confirmation de GoTrue)
  pendingEmail?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  password?: string | null;
}

export type ThemeType = "dark" | "light";

export interface UserSettingsType {
  theme: ThemeType;
}
