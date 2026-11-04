// Fonds d'écran façon Bonjourr : fournisseurs, collections, URLs, rotation
// par fréquence, filtres et crédit. Sources :
// - Bonjourr/src/scripts/features/backgrounds/providers.ts l.1-75 (PROVIDERS)
// - Bonjourr/src/scripts/features/backgrounds/index.ts : URL de l'API
//   l.465-510, `findCollectionName` l.512-543, `getCollection`/`setCollection`
//   l.559-621, `backgroundCacheControl` l.353-463, `applyBackground` couleur
//   l.630-633, `applyFilters` l.776-789
// - Bonjourr/src/scripts/features/backgrounds/urls.ts : `urlsCacheControl`
//   l.21-51, `lastUsedValidUrls` l.53-62, `urlAsBackgroundMedia` l.64-87,
//   `parseUrlList` l.181-186, `buildBackgroundUrls` l.188-200,
//   `formatFromFileExt` l.307-315
// - Bonjourr/src/scripts/features/backgrounds/credits.ts l.40-121
// Écarts assumés (journal-de-bord.md) : pas de type « files » (magasin de
// fichiers du navigateur), pas de sonde réseau des URLs (état « OK » d'office),
// pas d'IndexedDB, de lecteur vidéo ni de textures, et pas de ligne EXIF.

import type { BackgroundMedia, BonjourrConfig } from "./config";
import { daylightPeriod, needsChange } from "./time";

export type BackgroundImage = Extract<BackgroundMedia, { format: "image" }>;
export type BackgroundVideo = Extract<BackgroundMedia, { format: "video" }>;
export type Background = BackgroundMedia;
export type BackgroundSettings = BonjourrConfig["backgrounds"];
export type BackgroundUrlState = "NONE" | "LOADING" | "OK" | "NOT_URL" | "NOT_MEDIA" | "CANT_REACH";
export type BackgroundUrlMetadata = {
  lastUsed: string;
  format: "image" | "video";
  state: BackgroundUrlState;
  duration?: number;
};
/** Miroir de « chrome.storage.local » (types/local.ts) pour les fonds. */
export type LocalBackgrounds = {
  backgroundUrls: Record<string, BackgroundUrlMetadata>;
  backgroundCollections: Record<string, Background[]>;
  backgroundLastChange?: string;
};
export type Size = { width: number; height: number };
export type ResolveOptions = {
  fetchImpl?: typeof fetch;
  now?: Date;
  random?: () => number;
  online?: boolean;
  size?: Size;
  density?: number;
  /** Force un nouveau fond, comme `{ refresh: true }` côté original. */
  needNew?: boolean;
};
export type ResolvedBackground = {
  background?: Background | string;
  local: LocalBackgrounds;
  /** Image figée quand la fréquence est « pause » (index.ts l.425-433). */
  paused?: Background;
};

/** Base de l'API d'origine (index.ts l.479). */
export const BACKGROUNDS_API = "https://services.bonjourr.fr/backgrounds";

type Provider = { optgroup: string; options: { name: string; value: string }[] };

/** Fournisseurs proposés par les réglages d'origine (providers.ts l.1-75). */
export const PROVIDERS: { IMAGES: Provider[]; VIDEOS: Provider[] } = {
  IMAGES: [
    {
      optgroup: "Bonjourr",
      options: [{ name: "bonjourr-images-daylight", value: "bonjourr-images-daylight" }],
    },
    {
      optgroup: "Unsplash",
      options: [
        { name: "unsplash-images-collections", value: "unsplash-images-collections" },
        { name: "unsplash-images-search", value: "unsplash-images-search" },
      ],
    },
  ],
  VIDEOS: [
    {
      optgroup: "Bonjourr",
      options: [{ name: "bonjourr-videos-daylight", value: "bonjourr-videos-daylight" }],
    },
    {
      optgroup: "Pixabay",
      options: [{ name: "pixabay-videos-search", value: "pixabay-videos-search" }],
    },
  ],
};

export function emptyLocal(): LocalBackgrounds {
  return { backgroundUrls: {}, backgroundCollections: {} };
}

/** Largeur/hauteur demandées à l'API, ratio borné à [0.5 ; 2] (index.ts l.465-477). */
export function resolutionFor(screen: Size, density = 2): Size {
  const ratio = screen.width / screen.height;
  let width = screen.width * density;
  let height = screen.height * density;

  if (ratio >= 2) {
    width = height * 2;
  }

  if (ratio <= 0.5) {
    height = width * 2;
  }

  return { width, height };
}

/** URL de collection, taille puis requête interpolée telle quelle (index.ts l.476-484). */
export function backgroundsUrlFor(collection: string, size: Size, query = ""): string {
  const [provider, type, category] = collection.split("-");
  const base = BACKGROUNDS_API;
  const path = `/${provider}/${type}/${category}`;
  const screen = `?h=${size.height}&w=${size.width}`;
  const search = query ? `&query=${query}` : "";

  return base + path + screen + search;
}

/**
 * Télécharge une collection (index.ts l.465-510). Lève si le type ne peut pas
 * être demandé, ou si le JSON reçu n'est pas de la bonne nature.
 */
export async function fetchBackgrounds(
  backgrounds: BackgroundSettings,
  options: { fetchImpl?: typeof fetch; now?: Date; size?: Size; density?: number } = {},
): Promise<Record<string, Background[]>> {
  if (backgrounds.type !== "images" && backgrounds.type !== "videos") {
    throw new Error('Can only fetch with "images" or "videos" type');
  }

  const collection = backgrounds[backgrounds.type];
  const [, type] = collection.split("-");
  const fetchImpl = options.fetchImpl ?? fetch;
  const size = options.size ?? resolutionFor(screenSize(), options.density ?? screenDensity());
  const query = backgrounds.queries[collection] ?? "";
  const response = await fetchImpl(backgroundsUrlFor(collection, size, query));
  const json = await response.json();

  const areImages = type === "images" && Object.keys(json).every((key) => key.includes("images"));
  const areVideos = type === "videos" && Object.keys(json).every((key) => key.includes("videos"));

  if (areImages || areVideos) {
    return json;
  }

  throw new Error("Received JSON is bad");
}

/** Version silencieuse, pour le repli hors-ligne. */
export async function tryFetchBackgrounds(
  backgrounds: BackgroundSettings,
  options: { fetchImpl?: typeof fetch; now?: Date; size?: Size; density?: number } = {},
): Promise<Record<string, Background[]> | undefined> {
  try {
    return await fetchBackgrounds(backgrounds, options);
  } catch (_error) {
    return undefined;
  }
}

/**
 * Nom de collection courant, suffixé « -day »/« -night » pour la lumière du
 * jourBonjourr (findCollectionName, index.ts l.512-543).
 */
export function collectionNameFor(
  backgrounds: BackgroundSettings,
  local: LocalBackgrounds,
  now: Date = new Date(),
): string {
  const { type, frequency, pausedImage, pausedVideo } = backgrounds;

  if (type === "images" && frequency === "pause" && pausedImage) {
    return collectionNameOfMedia(pausedImage, local);
  }

  if (type === "videos" && frequency === "pause" && pausedVideo) {
    return collectionNameOfMedia(pausedVideo, local);
  }

  if (type !== "images" && type !== "videos") {
    throw new Error('Can only fetch with "images" or "videos" type');
  }

  const collection = backgrounds[type];

  if (collection.includes("daylight")) {
    return `${collection}-${daylightPeriod(now.getTime())}`;
  }

  return collection;
}

/** Collection en réserve, vérifiée du bon format (getCollection, l.559-590). */
export function collectionOf(
  backgrounds: BackgroundSettings,
  local: LocalBackgrounds,
  now: Date = new Date(),
): Background[] {
  const name = collectionNameFor(backgrounds, local, now);
  const collection = local.backgroundCollections[name] ?? [];

  if (backgrounds.type === "images") {
    if (areOnlyImages(collection)) {
      return collection;
    }

    throw new Error("Wrong background format");
  }

  if (backgrounds.type === "videos") {
    if (areOnlyVideos(collection)) {
      return collection;
    }

    throw new Error("Wrong background format");
  }

  throw new Error('Can only fetch with "images" or "videos" type');
}

/**
 * Rotation d'un cran (index.ts l.421-423 : `list.shift()` seulement s'il reste
 * de la réserve ; une collection à un élément ne tourne jamais).
 */
export function rotateList<T>(list: T[]): T[] {
  return list.length > 1 ? list.slice(1) : [];
}

/** Range la réponse de l'API telle quelle (setCollection, l.599-613). */
export function applyApiCollections(
  local: LocalBackgrounds,
  json: Record<string, Background[]>,
): LocalBackgrounds {
  for (const [key, value] of Object.entries(json)) {
    local.backgroundCollections[key] = value;
  }

  return local;
}

/** Réécrit la collection courante (setCollection, l.592-597). */
export function applyListToCollection(
  backgrounds: BackgroundSettings,
  local: LocalBackgrounds,
  list: Background[],
  now: Date = new Date(),
): LocalBackgrounds {
  local.backgroundCollections[collectionNameFor(backgrounds, local, now)] = list;
  return local;
}

/** Une ligne par URL, vides et lignes non HTTP écartés (urls.ts l.181-186). */
export function parseUrlList(urls: string): string[] {
  return urls
    .split("\n")
    .map((url) => url.trim())
    .filter((url) => url.startsWith("http") || url.startsWith("/"));
}

/** Format d'après l'extension, mp4/webm => vidéo (formatFromFileExt, l.307-315). */
export function formatFromFileExt(url: string): "image" | "video" {
  const ext = url.split(".").pop()?.split("?")[0]?.trim().toLowerCase();

  if (ext === "mp4" || ext === "webm") {
    return "video";
  }

  return "image";
}

/** Métadonnées par URL, horodatées (buildBackgroundUrls, l.188-200). */
export function buildBackgroundUrls(
  urls: string[],
  initialState: BackgroundUrlState = "NONE",
  now: Date = new Date(),
): Record<string, BackgroundUrlMetadata> {
  const backgroundUrls: Record<string, BackgroundUrlMetadata> = {};

  for (const url of urls) {
    backgroundUrls[url] = {
      lastUsed: now.toString(),
      format: formatFromFileExt(url),
      state: initialState,
    };
  }

  return backgroundUrls;
}

/** Les URL valides, de la moins récente à la plus récente (urls.ts l.53-62). */
export function lastUsedValidUrls(metadatas: Record<string, BackgroundUrlMetadata>): string[] {
  const getTime = (metadata: BackgroundUrlMetadata) => new Date(metadata.lastUsed).getTime();

  return Object.entries(metadatas)
    .toSorted((a, b) => getTime(b[1]) - getTime(a[1]))
    .filter(([, metadata]) => metadata.state === "OK")
    .map(([url]) => url);
}

/** Horodate l'URL choisie (urlsCacheControl, l.21-51). */
export function stampLastUsed(
  local: LocalBackgrounds,
  url: string,
  now: Date = new Date(),
): LocalBackgrounds {
  if (local.backgroundUrls[url]) {
    local.backgroundUrls[url].lastUsed = now.toString();
  }

  return local;
}

/** Une URL du magasin devient un média d'arrière-plan (urlAsBackgroundMedia, l.64-87). */
export function urlAsBackgroundMedia(
  url: string,
  metadata?: BackgroundUrlMetadata,
): Background | undefined {
  if (!metadata) {
    return undefined;
  }

  const urls = { full: url, small: url };

  if (metadata.format === "video") {
    return { format: "video", duration: metadata.duration ?? 0, urls };
  }

  return { format: "image", urls };
}

/**
 * Choisit le fond courant, sans jamais lever : hors-ligne, le cache parle
 * (index.ts l.353-463 et urls.ts l.21-51).
 */
export async function resolveBackground(
  backgrounds: BackgroundSettings,
  local: LocalBackgrounds,
  options: ResolveOptions = {},
): Promise<ResolvedBackground> {
  const now = options.now ?? new Date();

  switch (backgrounds.type) {
    case "color": {
      // applyBackground, l.630-633 : la couleur unie remplace tout média.
      return { background: backgrounds.color, local };
    }

    case "urls": {
      return resolveUrls(backgrounds, local, now, options);
    }

    case "images":
    case "videos": {
      return resolveCollection(backgrounds, local, now, options);
    }

    default: {
      // « files » : le fork n'a pas de magasin de fichiers du navigateur.
      return { background: undefined, local };
    }
  }
}

async function resolveUrls(
  backgrounds: BackgroundSettings,
  local: LocalBackgrounds,
  now: Date,
  options: ResolveOptions,
): Promise<ResolvedBackground> {
  const urls = lastUsedValidUrls(local.backgroundUrls);

  if (urls.length === 0) {
    // removeBackgrounds, l.770-774 : rien à afficher.
    return { background: undefined, local };
  }

  const head = urls[0];
  const metadata = local.backgroundUrls[head];
  const lastUsed = new Date(metadata.lastUsed).getTime();
  const needNew = options.needNew ?? needsChange(backgrounds.frequency, lastUsed, now);

  if (urls.length > 1 && needNew) {
    const rest = urls.slice(1);
    const random = options.random ?? Math.random;
    const picked = rest[Math.floor(random() * rest.length)];
    stampLastUsed(local, picked, now);

    return { background: urlAsBackgroundMedia(picked, local.backgroundUrls[picked]), local };
  }

  return { background: urlAsBackgroundMedia(head, metadata), local };
}

async function resolveCollection(
  backgrounds: BackgroundSettings,
  local: LocalBackgrounds,
  now: Date,
  options: ResolveOptions,
): Promise<ResolvedBackground> {
  const online = options.online ?? true;
  let list = collectionOf(backgrounds, local, now);
  const lastTime = new Date(local.backgroundLastChange ?? "01/01/1971").getTime();
  const isPaused = backgrounds.frequency === "pause";
  const needNew = options.needNew ?? needsChange(backgrounds.frequency, lastTime, now);

  // 1. Une collection vide se remplit par l’API et date son changement (l.382-397).
  if (list.length === 0 && online) {
    const json = await tryFetchBackgrounds(backgrounds, { ...options, now });

    if (json) {
      applyApiCollections(local, json);
      local.backgroundLastChange = now.toString();
      list = collectionOf(backgrounds, local, now);
    }
  }

  // 2. Sans demande de nouveauté, on rejoue le fond en cours (l.405-419).
  if (!needNew) {
    const paused = isPaused ? pausedMedia(backgrounds) : undefined;

    if (paused) {
      return { background: paused, local, paused };
    }

    return { background: list[0], local };
  }

  // 3. Un cran de rotation, sauté dans le magasin comme `list.shift()` (l.421-423).
  let rotated = false;

  if (list.length > 1) {
    list = rotateList(list);
    applyListToCollection(backgrounds, local, list, now);
    rotated = true;
  }

  const head = list[0];

  if (rotated && list.length > 1) {
    local.backgroundLastChange = now.toString();
  }

  // 4. « Verrouillé » : l’image tirée est celle qu’on fige (l.425-433).
  if (isPaused) {
    return { background: head, local, paused: head };
  }

  // 5. Une réserve épuisée se ravitaille sans changer le fond affiché (l.449-461).
  if (list.length === 1 && online) {
    const json = await tryFetchBackgrounds(backgrounds, { ...options, now });

    if (json) {
      applyApiCollections(local, json);
    }
  }

  return { background: head, local };
}

function pausedMedia(backgrounds: BackgroundSettings): Background | undefined {
  if (backgrounds.type === "images") {
    return backgrounds.pausedImage;
  }

  if (backgrounds.type === "videos") {
    return backgrounds.pausedVideo;
  }

  return undefined;
}

function collectionNameOfMedia(media: Background, local: LocalBackgrounds): string {
  for (const [name, collection] of Object.entries(local.backgroundCollections)) {
    if (collection.some((background) => background?.urls?.full === media.urls.full)) {
      return name;
    }
  }

  return media.urls.full;
}

function areOnlyImages(list: Background[]): boolean {
  return list.every((image) => image !== undefined && image.format === "image" && image.urls?.full);
}

function areOnlyVideos(list: Background[]): boolean {
  return list.every((video) => video !== undefined && video.format === "video" && video.urls?.full);
}

/**
 * Variables posées sur &lt;html&gt; et corps « flouté » (applyFilters, l.776-789 :
 * `--blur`, `--brightness`, `--fade-in`, et `body.blurred` dès 15px).
 */
export function filtersFor(filters: { blur?: number; bright?: number; fadein?: number }): {
  vars: Record<string, string>;
  blurred: boolean;
} {
  const vars: Record<string, string> = {};
  let blurred = false;

  if (filters.blur !== undefined) {
    vars["--blur"] = `${filters.blur}px`;
    blurred = filters.blur >= 15;
  }

  if (filters.bright !== undefined) {
    vars["--brightness"] = `${filters.bright}`;
  }

  if (filters.fadein !== undefined) {
    vars["--fade-in"] = `${filters.fadein}ms`;
  }

  return { vars, blurred };
}

/** Ligne de crédit (credits.ts l.40-121, formulations FR de _locales/fr). */
export function creditFor(media?: Background, lang: "fr" | "en" = "fr"): string {
  if (!media?.page || !media.username) {
    return "";
  }

  const artist = capitalize(media.username);

  if (media.format === "video") {
    return `Video by ${artist}`;
  }

  const by = lang === "en" ? "Photo by" : "Photo par";
  const location = [media.city, media.country].filter(Boolean).join(", ");

  if (location) {
    return `${location} - ${artist}`;
  }

  return `${by} ${artist}`;
}

function capitalize(value: string): string {
  return value.slice(0, 1).toUpperCase() + value.slice(1);
}

function screenDensity(): number {
  return Math.max(2, globalThis.devicePixelRatio || 1);
}

function screenSize(): Size {
  return {
    width: globalThis.screen?.width || 1920,
    height: globalThis.screen?.height || 1080,
  };
}
