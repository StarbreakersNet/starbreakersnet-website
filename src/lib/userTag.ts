// Numéro qui distingue les membres ayant le même pseudo (profiles.tag, de 1 à 9999), attribué par
// la base (migration 20261109113031_profiles_username_tag.sql). Affiché sur 4 chiffres : « #0421 ».
export function formatUserTag(tag: number | null | undefined): string {
  return tag ? `#${String(tag).padStart(4, "0")}` : "";
}
