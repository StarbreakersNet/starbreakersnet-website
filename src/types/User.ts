export interface UserType {
  id?: string;
  username: string | null;
  email: string | null;
  // Nouvelle adresse en attente de confirmation (double confirmation de GoTrue)
  pendingEmail?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  password?: string | null;
}
