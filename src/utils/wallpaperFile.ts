// Fond d'écran choisi sur l'ordinateur : gardé dans le navigateur (IndexedDB). Pour un membre
// connecté, stores/widgets.ts l'envoie aussi sur son compte, d'où un autre appareil le récupère.

const DB_NAME = "starbreakers-buroh";
const STORE = "files";
const KEY = "wallpaper";

// Fichiers acceptés depuis l'ordinateur
export const WALLPAPER_FILE_MAX_SIZE = 100 * 1024 * 1024;

// Au-delà, le fichier reste dans le navigateur : limite du bucket (migration wallpapers_bucket) et
// du service de stockage (FILE_SIZE_LIMIT)
export const WALLPAPER_REMOTE_MAX_SIZE = 50 * 1024 * 1024;

interface StoredWallpaper {
  file: Blob;
  addedAt: string;
}

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function run<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>) {
  const db = await open();
  try {
    return await new Promise<T>((resolve, reject) => {
      const request = action(db.transaction(STORE, mode).objectStore(STORE));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
}

export function saveWallpaperFile(file: Blob, addedAt: string) {
  return run("readwrite", store => store.put({ file, addedAt } satisfies StoredWallpaper, KEY));
}

// Fichier du fond décrit par addedAt et name, ou null si ce navigateur en garde un autre (ou aucun)
export async function loadWallpaperFile(addedAt: string, name: string): Promise<Blob | null> {
  try {
    const stored: unknown = await run("readonly", store => store.get(KEY));

    // Avant l'envoi sur le compte, le fichier était enregistré seul, sans sa date d'ajout
    if (stored instanceof Blob) {
      return stored instanceof File && stored.name === name ? stored : null;
    }

    const { file, addedAt: storedAt } = (stored ?? {}) as Partial<StoredWallpaper>;

    return file instanceof Blob && storedAt === addedAt ? file : null;
  } catch {
    return null;
  }
}

export function deleteWallpaperFile() {
  return run("readwrite", store => store.delete(KEY)).catch(() => undefined);
}
