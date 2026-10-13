// Magasin local du fork, miroir de `chrome.storage.local` de l'original
// (storage.ts l.1-40 : deux magasins, l'un pour les réglages synchronisés,
// l'autre pour ce qui ne se synchronise pas). Les citations y gardent leur
// cache (features/quotes.ts l.59, l.258) et les fonds y gardent leurs
// collections, leurs URL et leur dernière date de changement
// (features/backgrounds/index.ts l.376, urls.ts l.45).
// Écart assumé : un seul magasin local pour tout, là où l'original écrit des
// clés de détail à ras du sol ; rien ici ne passe par `patch()` ni par l'export.

export const LOCAL_STORAGE_KEY = "starbreakers-bonjourr-local";

export type LocalStore = Record<string, unknown>;

/** Le magasin vidé de son contenu illisible, comme `readLocal` de quotes.ts. */
export function readLocalStore(): LocalStore {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : undefined;

    if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
      return parsed as LocalStore;
    }
  } catch (_error) {
    // Un localStorage cassé rend un magasin vide, jamais une page en panne.
  }

  return {};
}

/** Fusion au premier niveau : écrire une clé ne fait pas disparaître les autres. */
export function writeLocalStore(patch: LocalStore): void {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ ...readLocalStore(), ...patch }));
}

export function clearLocalStore(): void {
  localStorage.removeItem(LOCAL_STORAGE_KEY);
}
