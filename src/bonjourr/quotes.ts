// Citations du fork Bonjourr, d'après Bonjourr/src/scripts/features/quotes.ts
// (l.192-267 pour l'API et le cache, l.271-318 pour le DOM et les formats),
// shared/api.ts l.26-32, shared/time.ts l.65-87 et l.109-137,
// types/shared.ts l.8-10, types/sync.ts l.177-185, defaults.ts l.199-205.
// Écart assumé : les fonctions restent pures (aucun stockage, aucun DOM) ; le
// composant qui les appelle reprend pas à pas les gestes de l'original.

import type { QuotesType } from "./config";
import { LOCAL_STORAGE_KEY, readLocalStore, writeLocalStore } from "./local";

export type { DaylightPeriod, Suntime } from "./time";
export { SUNTIME, daylightPeriod, minutator, needsChange } from "./time";

export type Quote = { author: string; content: string };
export type QuoteUserInput = [string, string][];
export type QuotesOptions = { fetchImpl?: typeof fetch; online?: boolean };

/** Base de l'API d'origine (shared/api.ts l.28). */
export const QUOTES_API = "https://services.bonjourr.fr";
/**
 * Miroir de « chrome.storage.local » (quotes.ts l.59, l.258) : le cache des
 * citations ne fait pas partie des réglages synchronisés.
 */
export const QUOTES_LOCAL_KEY = LOCAL_STORAGE_KEY;

export type LocalQuotes = {
  quotesCache?: Quote[];
  userQuoteSelection?: number;
};

/**
 * L'URL d'une collection : la langue ne s'ajoute qu'aux citations classiques
 * (quotes.ts l.220-221).
 */
export function quotesUrl(type: QuotesType, lang: string): string {
  const endpoint = type === "classic" ? lang : "";
  return `${QUOTES_API}/quotes/${type}/${endpoint}`;
}

/** Une ligne CSV = auteur, puis tout le reste en citation (quotes.ts l.307-318). */
export function csvToQuotes(csv: string): Quote[] {
  const quotes: Quote[] = [];

  for (const row of csv.split("\n")) {
    const [author, ...rest] = row.split(",");
    quotes.push({ author, content: rest.join(",").trimStart() });
  }

  return quotes;
}

/** Format antérieur à 1.19 : paires [auteur, citation] (quotes.ts l.303-305). */
export function oldJsonToCsv(input: QuoteUserInput): string {
  return input.map((val) => val.join(",")).join("\n");
}

/** Liste personnalisée, texte courant ou tableau hérité (quotes.ts l.290-301). */
export function csvUserInputToQuotes(csv?: string | QuoteUserInput): Quote[] {
  if (!csv) {
    return [];
  }

  if (Array.isArray(csv)) {
    return csvToQuotes(oldJsonToCsv(csv));
  }

  return csvToQuotes(csv);
}

/** JSON ou CSV : l'en-tête d'abord, l'extension de l'URL ensuite (quotes.ts l.335-354). */
export function urlApiResponseType(contentType: string | null, url: string): "json" | "csv" {
  const mime = contentType?.split(";", 2)[0];

  if (mime === "application/json") {
    return "json";
  }

  if (mime === "text/csv") {
    return "csv";
  }

  const parts = new URL(url).pathname.split(".");
  const extension = parts[parts.length - 1];

  if (extension?.toLowerCase() === "json") {
    return "json";
  }

  return "csv";
}

/** Seules une URL vide ou en http(s) se gardent (quotes.ts l.325-333). */
export function canStoreUrl(url?: string): boolean {
  if (url === undefined) {
    return false;
  }

  return url === "" || /^https?:\/\//i.test(url);
}

/**
 * Télécharge une collection ; lève si la réponse manque ou est en erreur
 * (quotes.ts l.192-227, l.229-237).
 */
export async function fetchQuotes(
  lang: string,
  type: QuotesType,
  url: string | undefined,
  options: QuotesOptions = {},
): Promise<Quote[]> {
  const online = options.online ?? globalThis.navigator?.onLine ?? true;

  if (!online || type === "user") {
    return [];
  }

  const doFetch = options.fetchImpl ?? globalThis.fetch;

  if (type === "url") {
    if (!url) {
      return [];
    }

    const response = await doFetch(url);
    validateResponse(response);

    if (urlApiResponseType(response.headers.get("content-type"), response.url) === "json") {
      return await response.json();
    }

    return csvToQuotes(await response.text());
  }

  const response = await doFetch(quotesUrl(type, lang));
  validateResponse(response);

  return await response.json();
}

/** Le repli hors-ligne de l'original : rien ne part en vrille (quotes.ts l.239-247). */
export async function tryFetchQuotes(
  lang: string,
  type: QuotesType,
  url: string | undefined,
  options: QuotesOptions = {},
): Promise<Quote[]> {
  try {
    return await fetchQuotes(lang, type, url, options);
  } catch (error) {
    console.info(error);
  }

  return [];
}

/**
 * Citation suivante du cache (quotes.ts l.249-267) : la liste décale d'un cran
 * et rend la suivante, un cache à plat se recharge, la liste personnalisée tire
 * un index gardé de son côté.
 */
export function controlCacheList(
  list: Quote[],
  type: QuotesType,
  random: () => number = Math.random,
): { quote?: Quote; cache: Quote[]; selection?: number; refetch: boolean } {
  if (type === "user") {
    const selection = Math.round(random() * (list.length - 1));
    return { quote: list[selection], cache: list, selection, refetch: false };
  }

  if (list.length > 1) {
    const cache = list.slice(1);
    return { quote: cache[0] ?? { author: "", content: "" }, cache, refetch: false };
  }

  return { quote: list[0], cache: list, refetch: true };
}

// ─── STOCKAGE LOCAL

function readLocal(): LocalQuotes {
  return readLocalStore() as LocalQuotes;
}

function writeLocal(patch: LocalQuotes): void {
  writeLocalStore(patch as Record<string, unknown>);
}

export function loadQuotesCache(): Quote[] {
  const { quotesCache } = readLocal();
  return Array.isArray(quotesCache) ? quotesCache : [];
}

export function saveQuotesCache(list: Quote[]): void {
  writeLocal({ quotesCache: list });
}

export function loadUserQuoteSelection(): number {
  const { userQuoteSelection } = readLocal();
  return typeof userQuoteSelection === "number" ? userQuoteSelection : 0;
}

export function saveUserQuoteSelection(index: number): void {
  writeLocal({ userQuoteSelection: index });
}

function validateResponse(response: Response): asserts response is Response {
  if (!response) {
    throw new Error("No response");
  }

  if (!response.ok) {
    throw new Error(`Response not ok: ${response.status} ${response.statusText}`);
  }
}
