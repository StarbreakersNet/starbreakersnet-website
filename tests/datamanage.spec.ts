// Case 21 — Données & langue : export/import JSON aller-retour et i18n FR/EN
// du panneau et de la page, langue par défaut fr. Contrat repris à la source :
// utils/stringify.ts (export ordonné, JSON.stringify(data, keys, 2)),
// utils/parse.ts (JSON.parse silencieux), settings.ts l.1442-1505 (téléversement
// `bonjourr-….json`, relecture avec repli base64, import refusé sans clé des
// défauts), compatibility/apply.ts l.25-43 (fusion quand les comptes de clés
// diffèrent, remplacement sinon), settings.html l.45-46 (`i_lang`) et l.2139-2196
// (`file-import`, `settings-data`, `b_settings-copy`, `b_settings-apply`,
// `b_file-load`, `b_file-save`, `file-download`). Libellés FR :
// _locales/fr/translations.json ; libellés EN : les clés du même fichier.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import BonjourrSettingsPanel from "@/components/BonjourrSettingsPanel.vue";
import BonjourrView from "@/views/BonjourrView.vue";
import { DEFAULTS } from "@/bonjourr/config";
import { exportConfig, isImportable, mergeConfig, parseConfig } from "@/bonjourr/datamanage";
import { TRANSLATIONS_EN, translate } from "@/bonjourr/i18n";
import { useBonjourrStore } from "@/stores/bonjourr";

function freshPinia() {
  const pinia = createPinia();
  setActivePinia(pinia);
  return pinia;
}

function stubOfflineFetch() {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => {
      throw new Error("réseau coupé");
    }),
  );
}

describe("export/import JSON (stringify.ts, parse.ts, settings.ts l.1442-1505)", () => {
  beforeEach(() => {
    localStorage.clear();
    freshPinia();
  });

  it("l'export est un JSON rejouable qui reproduit la config", () => {
    const store = useBonjourrStore();
    store.patch({ greeting: "Paul", dark: "enable", font: { size: "20" } });
    // Les liens (objets de tableaux) survivent au filtre par noms de clés.
    store.config.links.push({
      _id: "un-lien",
      order: 0,
      title: "Starbreakers",
      url: "https://starbreakers.net",
      icon: { type: "auto", value: "" },
    });
    const json = exportConfig(store.config);
    expect(exportConfig(store.config)).toBe(json);
    expect(JSON.parse(json)).toEqual(JSON.parse(JSON.stringify(store.config)));
  });

  it("l'aller-retour export puis import reconstruit la config", () => {
    const store = useBonjourrStore();
    store.patch({ greeting: "Paul", dark: "enable", tabtitle: "Starbreakers", pagegap: 3 });
    const snapshot = JSON.parse(JSON.stringify(store.config));
    const json = store.exportJson();

    store.patch({ greeting: "X", dark: "disable", pagegap: 1 });
    expect(store.importText(json)).toBe(true);
    expect(JSON.parse(JSON.stringify(store.config))).toEqual(snapshot);
  });

  it("la valeur en base64 des anciennes versions est acceptée (l.1466-1483)", () => {
    const store = useBonjourrStore();
    store.patch({ greeting: "Paul" });
    const encoded = btoa(unescape(encodeURIComponent(store.exportJson())));
    expect(store.importText(encoded)).toBe(true);
    expect(store.config.greeting).toBe("Paul");
  });

  it("rien n'est importé sans au moins une clé des défauts (l.1500-1502)", () => {
    const store = useBonjourrStore();
    store.patch({ greeting: "Paul" });
    const untouched = JSON.parse(JSON.stringify(store.config));

    expect(store.importText("pas du json")).toBe(false);
    expect(store.importText("")).toBe(false);
    expect(store.importText("{}")).toBe(false);
    expect(store.importText('{"clé_inconnue": 1}')).toBe(false);
    expect(JSON.parse(JSON.stringify(store.config))).toEqual(untouched);
  });

  it("un import partiel fusionne, un import complet remplace (apply.ts l.30-43)", () => {
    const store = useBonjourrStore();
    store.patch({ greeting: "Paul", dark: "enable" });

    expect(store.importText('{"greeting":"Zoe"}')).toBe(true);
    expect(store.config.greeting).toBe("Zoe");
    expect(store.config.dark).toBe("enable");

    const partial = { greeting: "Seule", lang: "fr" };
    expect(mergeConfig(store.config, partial)).toEqual(
      expect.objectContaining({ greeting: "Seule", dark: store.config.dark }),
    );

    const full = JSON.parse(JSON.stringify(store.config));
    full.greeting = "Remplaçante";
    expect(mergeConfig(store.config, full).greeting).toBe("Remplaçante");
  });

  it("parseConfig rend undefined sur une chaîne indéchiffrable (parse.ts l.1-9)", () => {
    expect(parseConfig("nope")).toBeUndefined();
    expect(parseConfig("")).toBeUndefined();
    expect(isImportable(undefined)).toBe(false);
    expect(isImportable({ dark: "enable" })).toBe(true);
    expect(isImportable({ inconnu: true })).toBe(false);
  });
});

describe("panneau Données (settings.html l.2139-2196)", () => {
  beforeEach(() => {
    localStorage.clear();
    stubOfflineFetch();
  });

  function mountPanel() {
    const pinia = freshPinia();
    return { wrapper: mount(BonjourrSettingsPanel, { global: { plugins: [pinia] } }), pinia };
  }

  it("la section Données porte les ids de la source et l'export courant", async () => {
    const { wrapper } = mountPanel();
    const store = useBonjourrStore();
    store.patch({ greeting: "Gaby" });
    await flushPromises();
    const part = wrapper
      .findAll(".settings-panel .panel-section")
      .find((node) => node.find(".panel-section-title").text() === "Données");
    expect(part?.exists()).toBe(true);

    const data = part!.find("#settings-data");
    expect(data.attributes("spellcheck")).toBe("false");
    expect(JSON.parse(data.element.value).greeting).toBe("Gaby");

    const file = part!.find("#file-import");
    expect(file.attributes("type")).toBe("file");
    expect(file.attributes("accept")).toBe("application/json, text/plain");

    for (const id of ["#b_settings-copy", "#b_settings-apply", "#b_file-load", "#b_file-save"]) {
      expect(part!.find(id).exists()).toBe(true);
    }
  });

  it("b_settings-apply applique le JSON de la zone de texte (l.1597, l.1604)", async () => {
    const { wrapper } = mountPanel();
    const store = useBonjourrStore();
    const data = wrapper.find("#settings-data");
    const parsed = JSON.parse(data.element.value);
    parsed.greeting = "Gaby";
    await data.setValue(JSON.stringify(parsed));
    await wrapper.find("#b_settings-apply").trigger("click");
    expect(store.config.greeting).toBe("Gaby");
  });

  it("b_file-save prépare le lien de téléchargement name.json (l.1449-1462)", async () => {
    const { wrapper } = mountPanel();
    await wrapper.find("#b_file-save").trigger("click");
    const href = wrapper.find("#file-download").attributes("href") ?? "";
    expect(href).not.toBe("");
    expect(wrapper.find("#file-download").attributes("download")).toMatch(/\.json$/);
  });

  it("b_file-load ouvre le sélecteur de fichier et b_settings-copy copie", async () => {
    const writeText = vi.fn(async () => undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    const { wrapper } = mountPanel();
    const file = wrapper.find("#file-import").element as HTMLInputElement;
    const click = vi.spyOn(file, "click");
    await wrapper.find("#b_file-load").trigger("click");
    expect(click).toHaveBeenCalled();
    await wrapper.find("#b_settings-copy").trigger("click");
    expect(JSON.parse(writeText.mock.calls[0][0] as string).greeting).toBeDefined();
  });
});

describe("i18n FR/EN (translations.json, lang par défaut fr)", () => {
  beforeEach(() => {
    localStorage.clear();
    stubOfflineFetch();
  });

  it("la langue par défaut est fr et translate ne traduit le français qu'en anglais", () => {
    expect(DEFAULTS.lang).toBe("fr");
    expect(translate("fr", "Mode sombre")).toBe("Mode sombre");
    expect(translate("en", "Mode sombre")).toBe("Dark mode");
    expect(translate("en", "Introuvable")).toBe("Introuvable");
  });

  it("i_lang propose fr et en avec leurs noms natifs (settings.html l.45-46)", async () => {
    const pinia = freshPinia();
    const wrapper = mount(BonjourrSettingsPanel, { global: { plugins: [pinia] } });
    const lang = wrapper.find("#i_lang");
    expect(lang.findAll("option").map((o) => o.attributes("value"))).toEqual(["fr", "en"]);
    expect(lang.findAll("option").map((o) => o.text())).toEqual(["Français", "English"]);
    await lang.setValue("en");
    expect(useBonjourrStore().config.lang).toBe("en");
  });

  it("le panneau en anglais rend les libellés anglais de la source", async () => {
    const pinia = freshPinia();
    const wrapper = mount(BonjourrSettingsPanel, { global: { plugins: [pinia] } });
    await flushPromises();
    useBonjourrStore().patch({ lang: "en" });
    await flushPromises();
    const dark = wrapper.find("#i_dark");
    expect(dark.findAll("option").map((o) => o.text())).toEqual([
      "System",
      "At night",
      "Enabled",
      "Disabled",
    ]);
    const apparence = wrapper
      .findAll(".settings-panel .panel-section")
      .find((node) => node.find(".panel-section-title").text() === "Appearance");
    expect(apparence?.exists()).toBe(true);
    expect(apparence!.text()).toContain("Dark mode");
    expect(wrapper.find("#i_tabtitle").attributes("placeholder")).toBe("New tab");
  });

  it("la page en anglais rend ses libellés anglais", async () => {
    const pinia = freshPinia();
    const wrapper = mount(BonjourrView, { global: { plugins: [pinia] } });
    await flushPromises();
    useBonjourrStore().patch({ lang: "en" });
    await flushPromises();
    expect(wrapper.find(".settings-toggle").attributes("aria-label")).toBe("Bonjourr settings");
  });

  // Le test de couverture lit les sources : tout libellé passé par t() doit
  // avoir son anglais dans TRANSLATIONS_EN, sinon la case n'est pas finie.
  it("toute chaîne traduite du panneau et de la page a son anglais au dictionnaire", () => {
    const sources = [
      "src/components/BonjourrSettingsPanel.vue",
      "src/views/BonjourrView.vue",
      "src/components/BonjourrLinks.vue",
      "src/components/BonjourrPomodoro.vue",
      "src/components/BonjourrSearchBar.vue",
    ];

    for (const file of sources) {
      const text = readFileSync(join(process.cwd(), file), "utf8");
      const keys = [...text.matchAll(/\bt\(\s*(?:"([^"]+)"|'([^']+)')/g)].map((m) => m[1] ?? m[2]);
      expect(keys.length, file).toBeGreaterThan(0);
      const missing = keys.filter((key) => !(key in TRANSLATIONS_EN));
      expect(missing, `traductions EN manquantes dans ${file}`).toEqual([]);
    }
  });
});
