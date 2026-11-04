// Barre de recherche du fork Bonjourr — table des moteurs et protocole des
// suggestions repris tels quels de Bonjourr/src/scripts/features/searchbar.ts
// (gabarit %s, domaine saisi → navigation directe, suggestions via
// wss://services.bonjourr.fr/suggestions avec {q, with, lang}).
// Écart assumé : l'original retourne « about:blank » quand rien n'est soumettable ;
// le fork retourne null et le composant ne navigue pas.

export const SEARCHBAR_ENGINES = [
  "default",
  "google",
  "ddg",
  "startpage",
  "qwant",
  "yahoo",
  "bing",
  "brave",
  "ecosia",
  "lilo",
  "baidu",
  "custom",
] as const;

export type SearchEngine = (typeof SEARCHBAR_ENGINES)[number];

export const SEARCH_ENGINE_URLS: Record<SearchEngine, string> = {
  default: "",
  google: "https://www.google.com/search?q=%s",
  ddg: "https://duckduckgo.com/?q=%s",
  startpage: "https://www.startpage.com/do/search?query=%s",
  qwant: "https://www.qwant.com/?q=%s",
  yahoo: "https://search.yahoo.com/search?q=%s",
  bing: "https://www.bing.com/search?q=%s",
  brave: "https://search.brave.com/search?q=%s",
  ecosia: "https://www.ecosia.org/search?q=%s",
  lilo: "https://search.lilo.org/?q=%s",
  baidu: "https://www.baidu.com/s?wd=%s",
  custom: "",
};

export type Suggestion = { text: string; desc?: string; image?: string };

const DOMAIN_PATTERN =
  /^(?!.*\s)(?:https?:\/\/)?([a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*\.[a-zA-Z0-9-]{2,})/i;

export function isValidEngine(engine: string): engine is SearchEngine {
  return (SEARCHBAR_ENGINES as readonly string[]).includes(engine);
}

export function isValidUrl(value: string): boolean {
  try {
    const basicURL = !!new URL(value);
    return basicURL && DOMAIN_PATTERN.test(value);
  } catch (_) {
    return false;
  }
}

export function isValidCustomRequest(request: string): boolean {
  return request.includes("%s") && request.length <= 512;
}

export function createSearchUrl(
  query: string,
  engine: string,
  customRequest = "",
): string | null {
  if (!isValidEngine(engine)) return null;
  if (engine === "custom" && !customRequest) return null;

  const template = engine === "custom" ? customRequest : SEARCH_ENGINE_URLS[engine];
  return template.replace("%s", encodeURIComponent(query ?? ""));
}

export function resolveSubmitUrl(
  input: string,
  engine: string,
  customRequest = "",
): string | null {
  const value = input.trim();
  if (!value) return null;

  const hasProtocol = value.startsWith("http://") || value.startsWith("https://");
  const domainUrl = hasProtocol ? value : `https://${value}`;
  if (isValidUrl(domainUrl)) return domainUrl;

  // En page web (hors extension), « default » = recherche du navigateur
  // indisponible : l'original bascule lui-même sur google (searchbar.ts l.239).
  const effective = engine === "default" ? "google" : engine;
  return createSearchUrl(value, effective, customRequest);
}

export function parseSuggestions(raw: string): Suggestion[] {
  try {
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data.filter(
      (item: unknown): item is Suggestion =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as Suggestion).text === "string",
    );
  } catch (_) {
    return [];
  }
}

export type SocketLike = {
  addEventListener(type: "open" | "message" | "error" | "close", listener: (event: MessageEvent | Event) => void): void;
  send(data: string): void;
  close(): void;
};

export type SocketFactory = (url: string) => SocketLike;

const defaultSocketFactory: SocketFactory = (url) => new WebSocket(url);

export function fetchSuggestions(
  query: string,
  engine: string,
  lang: string,
  socketFactory: SocketFactory = defaultSocketFactory,
  timeoutMs = 1500,
): Promise<Suggestion[]> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (value: Suggestion[]) => {
      if (!settled) {
        settled = true;
        resolve(value);
      }
    };

    try {
      const socket = socketFactory("wss://services.bonjourr.fr/suggestions");
      const timer = setTimeout(() => finish([]), timeoutMs);
      socket.addEventListener("open", () => {
        socket.send(JSON.stringify({ q: query, with: engine, lang }));
      });
      socket.addEventListener("message", (event) => {
        const data = (event as MessageEvent).data;
        finish(typeof data === "string" ? parseSuggestions(data) : []);
        clearTimeout(timer);
        socket.close();
      });
      socket.addEventListener("error", () => {
        finish([]);
        clearTimeout(timer);
      });
    } catch (_) {
      finish([]);
    }
  });
}
