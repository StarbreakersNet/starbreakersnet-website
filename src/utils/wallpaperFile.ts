// Fond d'écran choisi sur l'ordinateur : gardé dans le navigateur (IndexedDB), jamais envoyé au
// serveur. Sur un autre appareil, Buroh retombe sur le fond par défaut.

const DB_NAME = "starbreakers-buroh";
const STORE = "files";
const KEY = "wallpaper";

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

export function saveWallpaperFile(file: Blob) {
  return run("readwrite", store => store.put(file, KEY));
}

export async function loadWallpaperFile(): Promise<Blob | null> {
  try {
    return ((await run("readonly", store => store.get(KEY))) as Blob | undefined) ?? null;
  } catch {
    return null;
  }
}

export function deleteWallpaperFile() {
  return run("readwrite", store => store.delete(KEY)).catch(() => undefined);
}
