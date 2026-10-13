import { beforeEach, describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import BonjourrView from "@/views/BonjourrView.vue";
import { useBonjourrStore } from "@/stores/bonjourr";
import {
  createSearchUrl,
  isValidCustomRequest,
  isValidUrl,
  parseSuggestions,
  resolveSubmitUrl,
  SEARCHBAR_ENGINES,
  SEARCH_ENGINE_URLS,
} from "@/bonjourr/search";

describe("moteurs de recherche (table identique à l'original)", () => {
  it("reprend la liste SEARCHBAR_ENGINES de defaults.ts dans l'ordre", () => {
    expect([...SEARCHBAR_ENGINES]).toEqual([
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
    ]);
  });

  it("reprend les URLs exactes de searchbar.ts (gabarit %s)", () => {
    expect(SEARCH_ENGINE_URLS.google).toBe("https://www.google.com/search?q=%s");
    expect(SEARCH_ENGINE_URLS.ddg).toBe("https://duckduckgo.com/?q=%s");
    expect(SEARCH_ENGINE_URLS.startpage).toBe("https://www.startpage.com/do/search?query=%s");
    expect(SEARCH_ENGINE_URLS.qwant).toBe("https://www.qwant.com/?q=%s");
    expect(SEARCH_ENGINE_URLS.yahoo).toBe("https://search.yahoo.com/search?q=%s");
    expect(SEARCH_ENGINE_URLS.bing).toBe("https://www.bing.com/search?q=%s");
    expect(SEARCH_ENGINE_URLS.brave).toBe("https://search.brave.com/search?q=%s");
    expect(SEARCH_ENGINE_URLS.ecosia).toBe("https://www.ecosia.org/search?q=%s");
    expect(SEARCH_ENGINE_URLS.lilo).toBe("https://search.lilo.org/?q=%s");
    expect(SEARCH_ENGINE_URLS.baidu).toBe("https://www.baidu.com/s?wd=%s");
    expect(SEARCH_ENGINE_URLS.default).toBe("");
    expect(SEARCH_ENGINE_URLS.custom).toBe("");
  });

  it("createSearchUrl encode la requête dans %s", () => {
    expect(createSearchUrl("bonjour le web", "ddg")).toBe(
      "https://duckduckgo.com/?q=bonjour%20le%20web",
    );
    expect(createSearchUrl("é", "baidu")).toBe("https://www.baidu.com/s?wd=%C3%A9");
  });

  it("createSearchUrl custom exige un gabarit, moteur inconnu → null", () => {
    expect(createSearchUrl("q", "custom", "https://ex.fr/?recherche=%s")).toBe(
      "https://ex.fr/?recherche=q",
    );
    expect(createSearchUrl("q", "custom", "")).toBeNull();
    expect(createSearchUrl("q", "moteur-fantome")).toBeNull();
  });

  it("isValidCustomRequest exige %s et ≤ 512 caractères", () => {
    expect(isValidCustomRequest("https://ex.fr/?q=%s")).toBe(true);
    expect(isValidCustomRequest("https://ex.fr/?q=")).toBe(false);
    expect(isValidCustomRequest(`https://ex.fr/?q=%s${"a".repeat(512)}`)).toBe(false);
  });

  it("isValidUrl exige un schéma (l'appelant préfixe https:// avant, comme l'original)", () => {
    expect(isValidUrl("https://example.com")).toBe(true);
    expect(isValidUrl("example.com")).toBe(false); // l'original ne valide qu'après préfixage
    expect(isValidUrl("https://example.com/chemin")).toBe(true);
    expect(isValidUrl("https://pas une url")).toBe(false);
    expect(isValidUrl("https://localhost:8080")).toBe(false);
  });

  it("resolveSubmitUrl : vide → null, domaine → direct, défaut → google, saisie → recherche", () => {
    expect(resolveSubmitUrl("", "google")).toBeNull();
    expect(resolveSubmitUrl("   ", "ddg")).toBeNull();
    expect(resolveSubmitUrl("example.com/chemin", "ddg")).toBe("https://example.com/chemin");
    expect(resolveSubmitUrl("bonjour", "default")).toBe(
      "https://www.google.com/search?q=bonjour",
    );
    expect(resolveSubmitUrl("bonjour", "lilo")).toBe("https://search.lilo.org/?q=bonjour");
  });

  it("parseSuggestions tolère un payload invalide", () => {
    expect(parseSuggestions('[{"text":"a","desc":"d"}]')).toEqual([{ text: "a", desc: "d" }]);
    expect(parseSuggestions("garbage")).toEqual([]);
    expect(parseSuggestions('{"pas":"une liste"}')).toEqual([]);
  });
});

describe("composant barre de recherche", () => {
  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
  });

  function mountView() {
    const pinia = createPinia();
    setActivePinia(pinia);
    return mount(BonjourrView, { global: { plugins: [pinia] } });
  }

  it("n'apparaît que si searchbar.on, avec le placeholder du réglage", async () => {
    const wrapper = mountView();
    expect(wrapper.find(".searchbar").exists()).toBe(false);
    useBonjourrStore().patch({ searchbar: { on: true, placeholder: "Chercher ici" } });
    await wrapper.vm.$nextTick();
    const input = wrapper.find(".searchbar input");
    expect(input.exists()).toBe(true);
    expect(input.attributes("placeholder")).toBe("Chercher ici");
  });

  it("soumet vers l'URL du moteur, en _blank si newtab", async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    const store = useBonjourrStore();
    store.patch({ searchbar: { on: true, engine: "ddg", newtab: true } });
    const open = vi.fn();
    vi.stubGlobal("open", open);
    const wrapper = mount(BonjourrView, { global: { plugins: [pinia] } });
    await wrapper.find(".searchbar input").setValue("bonjour le web");
    await wrapper.find(".searchbar form").trigger("submit");
    expect(open).toHaveBeenCalledTimes(1);
    expect(open.mock.calls[0][0]).toBe("https://duckduckgo.com/?q=bonjour%20le%20web");
    expect(open.mock.calls[0][1]).toBe("_blank");
    vi.unstubAllGlobals();
  });

  it("le panneau expose moteur, placeholder, requête custom et newtab", async () => {
    const wrapper = mountView();
    await wrapper.find(".settings-toggle").trigger("click");
    const section = wrapper.findAll(".panel-section").find((s) =>
      s.find(".panel-section-title").text().includes("Barre de recherche"),
    );
    expect(section).toBeDefined();
    const select = section!.find("select");
    expect(select.exists()).toBe(true);
    expect(select.findAll("option").map((o) => o.text())).toContain("startpage");
    await select.setValue("custom");
    await vi.waitFor(() => {
      expect(useBonjourrStore().config.searchbar.engine).toBe("custom");
    });
  });
});
