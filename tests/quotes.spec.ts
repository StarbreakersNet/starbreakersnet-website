import { beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import BonjourrView from "@/views/BonjourrView.vue";
import { STORAGE_KEY, useBonjourrStore } from "@/stores/bonjourr";
import type { BonjourrConfig } from "@/bonjourr/config";
import {
  QUOTES_API,
  QUOTES_LOCAL_KEY,
  canStoreUrl,
  csvToQuotes,
  csvUserInputToQuotes,
  controlCacheList,
  daylightPeriod,
  fetchQuotes,
  loadQuotesCache,
  needsChange,
  oldJsonToCsv,
  quotesUrl,
  saveQuotesCache,
  tryFetchQuotes,
  urlApiResponseType,
  type Quote,
} from "@/bonjourr/quotes";

// Case 17 : citations. Sources : Bonjourr/src/scripts/features/quotes.ts,
// shared/{api,time}.ts, types/{shared,sync}.ts, defaults.ts l.199-205,
// settings.html l.1522-1650, index.html l.670-672 et _locales/fr/translations.json.

const un = { author: "A", content: "Un" };
const deux = { author: "B", content: "Deux" };
const trois = { author: "C", content: "Trois" };

function response(
  body: { json?: unknown; text?: string },
  options: { contentType?: string | null; url?: string; ok?: boolean } = {},
): Response {
  const { contentType = "application/json", url = QUOTES_API + "/quotes/classic/fr", ok = true } = options;
  return {
    ok,
    status: ok ? 200 : 500,
    statusText: ok ? "OK" : "Internal Server Error",
    url,
    headers: { get: (name: string) => (name === "content-type" ? contentType : null) },
    json: async () => body.json,
    text: async () => body.text ?? "",
  } as unknown as Response;
}

describe("URL de l’API d’origine (quotes.ts l.220-224, shared/api.ts l.26-32)", () => {
  it("n’ajoute la langue qu’aux citations classiques", () => {
    expect(quotesUrl("classic", "fr")).toBe("https://services.bonjourr.fr/quotes/classic/fr");
    expect(quotesUrl("classic", "en")).toBe("https://services.bonjourr.fr/quotes/classic/en");
    expect(quotesUrl("kaamelott", "fr")).toBe("https://services.bonjourr.fr/quotes/kaamelott/");
    expect(quotesUrl("hitokoto", "fr")).toBe("https://services.bonjourr.fr/quotes/hitokoto/");
  });
});

describe("formats de réponses (quotes.ts l.244-260, l.303-318, l.335-354)", () => {
  it("le CSV garde tout le reste de la ligne comme citation", () => {
    expect(csvToQuotes("Marc, Bonjour, ça va\nAnon, Deux")).toEqual([
      { author: "Marc", content: "Bonjour, ça va" },
      { author: "Anon", content: "Deux" },
    ]);
    expect(csvToQuotes("")).toEqual([{ author: "", content: "" }]);
  });

  it("l’ancien format JSON antérieur à 1.19 devient du CSV", () => {
    expect(oldJsonToCsv([["A", "Un"], ["B", "Deux"]])).toBe("A,Un\nB,Deux");
    expect(csvUserInputToQuotes([["A", "Un"]])).toEqual([{ author: "A", content: "Un" }]);
    expect(csvUserInputToQuotes("A,Un")).toEqual([{ author: "A", content: "Un" }]);
    expect(csvUserInputToQuotes(undefined)).toEqual([]);
  });

  it("JSON ou CSV selon l’en-tête, faute de quoi l’extension fait foi", () => {
    expect(urlApiResponseType("application/json; charset=utf-8", "https://x.fr/q")).toBe("json");
    expect(urlApiResponseType("text/csv", "https://x.fr/q")).toBe("csv");
    expect(urlApiResponseType(null, "https://x.fr/q.json")).toBe("json");
    expect(urlApiResponseType("text/plain", "https://x.fr/Q.JSON")).toBe("json");
    expect(urlApiResponseType("text/plain", "https://x.fr/q")).toBe("csv");
  });

  it("une URL de citations se limite à vide ou http(s) (quotes.ts l.325-333)", () => {
    expect(canStoreUrl(undefined)).toBe(false);
    expect(canStoreUrl("")).toBe(true);
    expect(canStoreUrl("https://x.fr/quotes.csv")).toBe(true);
    expect(canStoreUrl("ftp://x.fr/quotes.csv")).toBe(false);
  });
});

describe("fréquence (shared/time.ts l.65-87, l.109-137)", () => {
  const now = new Date(2026, 9, 16, 12, 0);

  it("découpe la journée autour du lever et du coucher", () => {
    const at = (hour: number, minute: number) => new Date(2026, 9, 16, hour, minute).getTime();
    expect(daylightPeriod(at(3, 0))).toBe("night");
    expect(daylightPeriod(at(7, 0))).toBe("noon");
    expect(daylightPeriod(at(12, 0))).toBe("day");
    expect(daylightPeriod(at(21, 30))).toBe("evening");
    expect(daylightPeriod(at(23, 30))).toBe("night");
  });

  it("chaque fréquence a sa règle, « pause » ne cède qu’à zéro", () => {
    const sameDay = new Date(2026, 9, 16, 8, 0).getTime();
    const yesterday = new Date(2026, 9, 15, 12, 0).getTime();
    expect(needsChange("day", sameDay, now)).toBe(false);
    expect(needsChange("day", yesterday, now)).toBe(true);
    expect(needsChange("hour", now.getTime(), now)).toBe(false);
    expect(needsChange("hour", sameDay, now)).toBe(true);
    expect(needsChange("tabs", now.getTime(), now)).toBe(true);
    expect(needsChange("pause", 0, now)).toBe(true);
    expect(needsChange("pause", now.getTime(), now)).toBe(false);
    expect(needsChange("period", new Date(2026, 9, 16, 3, 0).getTime(), now)).toBe(true);
    expect(needsChange("period", new Date(2026, 9, 16, 13, 0).getTime(), now)).toBe(false);
    expect(needsChange("jamais" as never, 0, now)).toBe(false);
  });
});

describe("aller chercher les citations (quotes.ts l.192-247)", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it("demande la collection à l’API et la range telle quelle", async () => {
    const urls: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string) => {
        urls.push(String(input));
        return response({ json: [un, deux] });
      }),
    );

    await expect(fetchQuotes("fr", "classic", "", { online: true })).resolves.toEqual([un, deux]);
    expect(urls).toEqual([QUOTES_API + "/quotes/classic/fr"]);
  });

  it("une URL personnalisée est lue en CSV ou en JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => response({ text: "Marc, Bonjour\nAnon, Deux" }, { contentType: "text/csv", url: "https://x.fr/q.csv" })),
    );
    await expect(fetchQuotes("fr", "url", "https://x.fr/q.csv", { online: true })).resolves.toEqual([
      { author: "Marc", content: "Bonjour" },
      { author: "Anon", content: "Deux" },
    ]);

    vi.stubGlobal("fetch", vi.fn(async () => response({ json: [trois] }, { url: "https://x.fr/q" })));
    await expect(fetchQuotes("fr", "url", "https://x.fr/q", { online: true })).resolves.toEqual([trois]);
  });

  it("hors-ligne, en liste perso ou sans URL, rien n’est demandé (l.193-201)", async () => {
    const spy = vi.fn();
    vi.stubGlobal("fetch", spy);
    await expect(fetchQuotes("fr", "classic", "", { online: false })).resolves.toEqual([]);
    await expect(fetchQuotes("fr", "user", "", { online: true })).resolves.toEqual([]);
    await expect(fetchQuotes("fr", "url", "", { online: true })).resolves.toEqual([]);
    expect(spy).not.toHaveBeenCalled();
  });

  it("une réponse en erreur remonte, l’appel tolérant rend les vides (l.229-247)", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => response({ json: [] }, { ok: false })));
    await expect(fetchQuotes("fr", "classic", "", { online: true })).rejects.toThrow(/not ok/);
    await expect(tryFetchQuotes("fr", "classic", "", { online: true })).resolves.toEqual([]);

    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("réseau coupé"); }));
    await expect(tryFetchQuotes("fr", "stoic", "", { online: true })).resolves.toEqual([]);
  });
});

describe("cache local (quotes.ts l.249-267)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("garde et relit le cache sous la clé du fork, rejetant ce qui est illisible", () => {
    expect(QUOTES_LOCAL_KEY).toBe("starbreakers-bonjourr-local");
    expect(loadQuotesCache()).toEqual([]);
    saveQuotesCache([un, deux]);
    expect(loadQuotesCache()).toEqual([un, deux]);
    localStorage.setItem(QUOTES_LOCAL_KEY, "{ pas du json");
    expect(loadQuotesCache()).toEqual([]);
  });

  it("fait défiler la liste, la renvoie vide d’un seul élément, la rajeunit à zéro", () => {
    const three: Quote[] = [un, deux, trois];
    expect(controlCacheList(three, "classic")).toEqual({
      quote: deux,
      cache: [deux, trois],
      refetch: false,
    });
    expect(controlCacheList([un], "classic").refetch).toBe(true);
    expect(controlCacheList([], "classic")).toEqual({
      quote: undefined,
      cache: [],
      refetch: true,
    });
  });

  it("en liste personnalisée tire un index et ne touche pas au cache (l.250-254)", () => {
    const list: Quote[] = [un, deux, trois];
    const picked = controlCacheList(list, "user", () => 0.99);
    expect(picked).toEqual({ quote: trois, cache: list, selection: 2, refetch: false });
  });
});

describe("citations sur la page (index.html l.670-672, quotes.ts l.63-75, l.271-286)", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => response({ json: [un, deux, trois] })),
    );
  });

  function mountView(patch?: Partial<BonjourrConfig["quotes"]>) {
    const pinia = createPinia();
    setActivePinia(pinia);
    const store = useBonjourrStore();
    if (patch) {
      store.patch({ quotes: patch });
    }
    return { wrapper: mount(BonjourrView, { global: { plugins: [pinia] } }), store };
  }

  it("reste masqué tant qu’on ne l’active pas (l.72)", () => {
    const { wrapper } = mountView();
    expect(wrapper.find("#quotes_container").classes()).toContain("hidden");
  });

  it("affiche citation et auteur, le cache décalé d’un cran", async () => {
    saveQuotesCache([un, deux]);
    const { wrapper } = mountView({ on: true, frequency: "pause", last: 0 });
    await flushPromises();
    await wrapper.vm.$nextTick();

    const container = wrapper.find("#quotes_container");
    expect(container.classes()).not.toContain("hidden");
    // controlCacheList décale le cache : la seconde citation passe à l’écran.
    expect(container.find("#quote").text()).toBe("Deux");
    expect(container.find("#author").text()).toBe("B");
  });

  it("l’auteur ne reste visible que si on le lui demande (l.271-273)", async () => {
    saveQuotesCache([un, deux]);
    const { wrapper, store } = mountView({ on: true, author: false, frequency: "pause", last: 0 });
    await flushPromises();
    await wrapper.vm.$nextTick();
    expect(wrapper.find("#author").classes()).not.toContain("always-on");

    store.patch({ quotes: { author: true } });
    await wrapper.vm.$nextTick();
    expect(wrapper.find("#author").classes()).toContain("always-on");
  });

  it("les sauts de ligne littéraux deviennent de vrais sauts (l.283-284)", async () => {
    saveQuotesCache([{ author: "A", content: "Un\\ndeux" }]);
    const { wrapper } = mountView({ on: true, frequency: "tabs" });
    await flushPromises();
    await wrapper.vm.$nextTick();
    expect(wrapper.find("#quote").text()).toBe("Un\ndeux");
  });

  it("vide de cache il le remplit puis le fait défiler dans le magasin local", async () => {
    const { wrapper } = mountView({ on: true, frequency: "tabs" });
    await flushPromises();
    await wrapper.vm.$nextTick();

    expect(wrapper.find("#quote").text()).toBe("Deux");
    expect(loadQuotesCache()).toEqual([deux, trois]);
  });

  it("« Prochaine citation » avance d’un cran et date la citation (l.99-101)", async () => {
    saveQuotesCache([un, deux, trois]);
    const { wrapper, store } = mountView({ on: true, frequency: "pause", last: 0 });
    await flushPromises();
    await wrapper.vm.$nextTick();
    expect(wrapper.find("#quote").text()).toBe("Deux");
    expect(loadQuotesCache()).toEqual([deux, trois]);

    const first = store.config.quotes.last ?? 0;
    expect(first).toBeGreaterThan(0);

    store.patch({ quotes: { last: first + 1000 } });
    await flushPromises();
    await wrapper.vm.$nextTick();
    expect(wrapper.find("#quote").text()).toBe("Trois");
    expect(loadQuotesCache()).toEqual([trois]);

    const persisted = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
    expect(persisted.quotes.last).toBe(first + 1000);
  });
});
