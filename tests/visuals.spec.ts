// Case 20 — Visuel & onglet : mode sombre, police, pagegap/pagewidth, ombre du
// texte, CSS personnalisé, masquage (hide), favicon et titre d'onglet.
// Contrat repris à la source : features/others.ts (darkmode l.74-115, favicon
// l.9-37, tabTitle l.39-51, pageControl l.53-71, textShadow l.123-130),
// features/fonts.ts (displayFont l.227-257, setFontSize l.259-261, setFontColor
// l.263-267, systemfont l.34-60), features/css.ts (customCss l.6-21),
// features/hide.ts (hideElements l.5-23) et shared/generic.ts (stringMaxSize
// l.1-3, hexToRGB l.22-28). Libellés FR : _locales/fr/translations.json.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import BonjourrSettingsPanel from "@/components/BonjourrSettingsPanel.vue";
import BonjourrView from "@/views/BonjourrView.vue";
import {
  CSS_MAX,
  TABTITLE_MAX,
  applyVisuals,
  customCssFor,
  faviconHrefFor,
  fontFaceFor,
  fontVarsFor,
  hexToRGB,
  hideElements,
  hideEntriesFor,
  pageVarsFor,
  stringMaxSize,
  systemFontFor,
  tabTitleFor,
  textShadowVarFor,
  themeFor,
} from "@/bonjourr/visuals";
import { DEFAULTS } from "@/bonjourr/config";
import { useBonjourrStore } from "@/stores/bonjourr";

const root = document.documentElement;

function cleanDocument() {
  document.title = "";
  delete root.dataset.theme;
  document.getElementById("styles")?.remove();
  document.getElementById("fontface")?.remove();
  document.getElementById("favicon")?.remove();
  document.querySelectorAll("[data-hide]").forEach((el) => el.classList.remove("he_hidden"));
  ["--page-width", "--page-gap", "--text-shadow-alpha", "--font-family", "--font-size"].forEach((v) =>
    root.style.removeProperty(v),
  );
}

const LINUX_FONT = { placeholder: "Fira Sans", weights: ["100", "200", "300", "400", "500", "600", "700", "800", "900"] };

describe("thème sombre (others.ts l.74-115)", () => {
  it("« Désactivé » et « Activé » imposent light et dark", () => {
    expect(themeFor("disable")).toBe("light");
    expect(themeFor("enable")).toBe("dark");
  });

  it("« Système » suit prefers-color-scheme", () => {
    expect(themeFor("system", { prefersDark: true })).toBe("dark");
    expect(themeFor("system", { prefersDark: false })).toBe("light");
  });

  it("« La nuit » est dark avant le lever et après le coucher (l.95-97)", () => {
    // Lever/coucher par défaut 420/1320 min, soit 07:00 et 22:00 (shared/time.ts l.9-10).
    expect(themeFor("auto", { now: new Date(2026, 9, 14, 6, 30) })).toBe("dark");
    expect(themeFor("auto", { now: new Date(2026, 9, 14, 12, 0) })).toBe("light");
    expect(themeFor("auto", { now: new Date(2026, 9, 14, 23, 0) })).toBe("dark");
  });
});

describe("police et variables CSS (fonts.ts l.227-267)", () => {
  it("la police système donne la liste d'après l'OS, avec repli linux (l.34-60)", () => {
    expect(systemFontFor("Mozilla/5.0 (Windows NT 10.0)")).toEqual({
      placeholder: "Segoe UI",
      weights: ["300", "400", "600", "700", "800"],
    });
    expect(systemFontFor("Mozilla/5.0 (Macintosh; Intel Mac OS X)")).toEqual({
      placeholder: "SF Pro Display",
      weights: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
    });
    expect(systemFontFor("Mozilla/5.0 (X11; Linux x86_64)")).toEqual(LINUX_FONT);
    expect(systemFontFor("")).toEqual(LINUX_FONT);
  });

  it("sans famille, --font-family est vide et l'horloge prend une graisse de moins (l.228-231, l.252-254)", () => {
    const vars = fontVarsFor({ ...DEFAULTS.font }, LINUX_FONT);
    expect(vars["--font-family"]).toBeNull();
    expect(vars["--font-weight"]).toBe("300");
    expect(vars["--font-weight-clock"]).toBe("200");
    // Taille 14 px convertie en em sur une base de 16 px (l.260).
    expect(vars["--font-size"]).toBe("0.875em");
    // Couleur en rgb éclaté, consommé par rgb(var(--font-color)) (_global.css l.104).
    expect(vars["--font-color"]).toBe("255, 255, 255");
  });

  it("une famille est entre guillemets et l'horloge garde la graisse choisie (l.252-254)", () => {
    const vars = fontVarsFor({ ...DEFAULTS.font, family: "Roboto", system: false }, LINUX_FONT);
    expect(vars["--font-family"]).toBe('"Roboto"');
    expect(vars["--font-weight-clock"]).toBe("300");
  });

  it("la graisse de l'horloge reste la choisie sous 100 (l.229)", () => {
    const vars = fontVarsFor({ ...DEFAULTS.font, weight: "100" }, LINUX_FONT);
    expect(vars["--font-weight-clock"]).toBe("100");
  });

  it("hexToRGB éclate le hex (generic.ts l.22-28)", () => {
    expect(hexToRGB("#ff8000")).toEqual({ r: 255, g: 128, b: 0 });
  });

  it("la famille chargée passe par @font-face Fontsource, sinon rien (l.236-245)", () => {
    const face = fontFaceFor("Roboto", "400");
    expect(face).toContain('@font-face {font-family: "Roboto"');
    expect(face).toContain(
      "src: url(https://cdn.jsdelivr.net/fontsource/fonts/roboto@latest/latin-400-normal.woff2) format('woff2');",
    );
    // Sous-jeu différent : une seconde règle est ajoutée, l'espace réservé latin est remplacé.
    const extended = fontFaceFor("Roboto", "400", "latin-ext");
    expect(extended).toContain("latin-400-normal.woff2");
    expect(extended).toContain("latin-ext-400-normal.woff2");
  });
});

describe("page, ombre et CSS personnalisé", () => {
  it("pageControl écrit --page-width en px et --page-gap en em (others.ts l.53-71)", () => {
    expect(pageVarsFor({ width: 1200, gap: 2 })).toEqual({ "--page-width": "1200px", "--page-gap": "2em" });
    // Un écart de 0 est un nombre : la source l'écrit, la largeur absente non (l.54, l.63).
    expect(pageVarsFor({ gap: 0 })).toEqual({ "--page-gap": "0em" });
    expect(pageVarsFor({})).toEqual({});
  });

  it("textShadow écrit --text-shadow-alpha, 0.2 par défaut (l.123-130)", () => {
    expect(textShadowVarFor(0.5)).toEqual({ "--text-shadow-alpha": "0.5" });
    expect(textShadowVarFor()).toEqual({ "--text-shadow-alpha": "0.2" });
  });

  it("le CSS est tronqué à 8080 caractères et stringMaxSize tranche (css.ts l.11, generic.ts l.1-3)", () => {
    expect(CSS_MAX).toBe(8080);
    expect(stringMaxSize("abcdef", 3)).toBe("abc");
    expect(stringMaxSize("abc", 3)).toBe("abc");
    expect(customCssFor("#a {}".repeat(2000))).toHaveLength(CSS_MAX);
    expect(customCssFor("#a {}")).toBe("#a {}");
  });
});

describe("onglet : titre et favicon (others.ts l.9-51)", () => {
  it("un titre vide revient à « Nouvel onglet », tronqué à 80 (l.40-42, translations.json l.3)", () => {
    expect(TABTITLE_MAX).toBe(80);
    expect(tabTitleFor("", "fr")).toBe("Nouvel onglet");
    expect(tabTitleFor("Starbreakers", "fr")).toBe("Starbreakers");
    expect(tabTitleFor("x".repeat(120), "fr")).toHaveLength(TABTITLE_MAX);
    expect(tabTitleFor("", "en")).toBe("New tab");
  });

  it("un emoji devient un favicon SVG en data-URI, tel que construit par la source (l.11-13)", () => {
    const { kind, href } = faviconHrefFor("🌤");
    expect(kind).toBe("emoji");
    expect(href).toBe(
      'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="85">🌤</text></svg>',
    );
  });

  it("les lettres et chiffres sont refusés, pas les formes U+25A0-U+25FF (l.27)", () => {
    expect(faviconHrefFor("ab").kind).toBe("default");
    expect(faviconHrefFor("a").kind).toBe("default");
    expect(faviconHrefFor("").kind).toBe("default");
    expect(faviconHrefFor("■").kind).toBe("emoji");
    // L.27 refuse la valeur dès qu’il RESTE une lettre ou un chiffre à côté
    // d’un emoji : sans ce garde-fou, « 🚀a » passerait.
    expect(faviconHrefFor("🚀a").kind).toBe("default");
    expect(faviconHrefFor("🚀1").kind).toBe("default");
  });

  it("le fork accepte aussi une URL explicite de favicon", () => {
    expect(faviconHrefFor("https://ex.io/a.png")).toEqual({ kind: "url", href: "https://ex.io/a.png" });
  });
});

describe("masquage (hide.ts l.5-23)", () => {
  it("hideEntriesFor reprend l'ordre des clés de l'objet (l.18)", () => {
    expect(hideEntriesFor({ clock: true, date: false })).toEqual([
      ["clock", true],
      ["date", false],
    ]);
  });
});

describe("applyVisuals sur le document", () => {
  beforeEach(cleanDocument);
  afterEach(cleanDocument);

  it("pose thème, variables, CSS, titre, favicon et classes de masquage", () => {
    const page = document.createElement("div");
    page.setAttribute("data-hide", "clock");
    document.body.append(page);

    applyVisuals(
      {
        ...DEFAULTS,
        dark: "enable",
        tabtitle: "Starbreakers",
        favicon: "🚀",
        pagewidth: 1000,
        pagegap: 3,
        textShadow: 0.6,
        css: "#time { color: red }",
        hide: { clock: true },
        font: { ...DEFAULTS.font, family: "Roboto", system: false, weight: "400" },
      },
      { now: new Date(2026, 9, 14, 12, 0), userAgent: "Linux" },
    );

    expect(root.dataset.theme).toBe("dark");
    expect(root.style.getPropertyValue("--page-width")).toBe("1000px");
    expect(root.style.getPropertyValue("--page-gap")).toBe("3em");
    expect(root.style.getPropertyValue("--text-shadow-alpha")).toBe("0.6");
    expect(root.style.getPropertyValue("--font-family")).toBe('"Roboto"');
    expect(document.title).toBe("Starbreakers");
    expect(document.getElementById("styles")?.textContent).toBe("#time { color: red }");
    expect(document.getElementById("fontface")?.textContent).toContain("roboto@latest/latin-400-normal.woff2");
    expect(document.getElementById("favicon")?.getAttribute("href")).toContain("data:image/svg+xml,");
    expect(page.classList.contains("he_hidden")).toBe(true);

    page.remove();
  });

  it("vider le titre ou le favicon revient au neutre de la page", () => {
    applyVisuals({ ...DEFAULTS, tabtitle: "A", favicon: "🚀" }, { now: new Date(2026, 9, 14, 12, 0) });
    expect(document.title).toBe("A");
    applyVisuals({ ...DEFAULTS }, { now: new Date(2026, 9, 14, 12, 0) });
    expect(document.title).toBe("Nouvel onglet");
    expect(document.getElementById("favicon")?.getAttribute("href")).not.toContain("data:image/svg+xml,");
  });

  it("hideElements ôte la classe quand le masque se lève (l.20)", () => {
    const page = document.createElement("div");
    page.setAttribute("data-hide", "greetings");
    document.body.append(page);
    hideElements({ greetings: true });
    expect(page.classList.contains("he_hidden")).toBe(true);
    hideElements({ greetings: false });
    expect(page.classList.contains("he_hidden")).toBe(false);
    page.remove();
  });
});

describe("vue : les réglages visuels s'appliquent d'eux-mêmes", () => {
  beforeEach(() => {
    cleanDocument();
    localStorage.clear();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("réseau coupé");
      }),
    );
  });

  afterEach(() => {
    cleanDocument();
    vi.useRealTimers();
  });

  function mountView(options: { attachTo?: Element } = {}) {
    const pinia = createPinia();
    setActivePinia(pinia);
    return mount(BonjourrView, { global: { plugins: [pinia] }, ...options });
  }

  // Le bloc météo n'est rendu que si la requête aboutit : de quoi vérifier que
  // `data-hide="weatherdesc"`/`"weathericon"` sont bien posés dessus.
  function stubWorkingWeather() {
    Object.defineProperty(navigator, "geolocation", { value: undefined, configurable: true });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          current: { time: "2026-10-13T22:06", temperature_2m: 20.4, weather_code: 1, is_day: 0 },
          daily: { time: ["2026-10-13", "2026-10-14"], temperature_2m_max: [21.0, 13.2] },
        }),
      })),
    );
  }

  it("le montage applique le thème, la taille de police et le titre par défaut", async () => {
    mountView();
    await flushPromises();
    // dark: "system" (defaults.ts l.104) et pas de préférence sombre sous happy-dom.
    expect(root.dataset.theme).toBe("light");
    expect(root.style.getPropertyValue("--font-size")).toBe("0.875em");
    expect(document.title).toBe("Nouvel onglet");
  });

  it("les éléments masquables gardent leur place dans le DOM et prennent he_hidden", async () => {
    stubWorkingWeather();
    // `hideElements` consulte `document` (hide.ts l.19) : le montage doit y
    // être rattaché pour que les classes tombent sur ses éléments.
    const wrapper = mountView({ attachTo: document.body });
    await flushPromises();
    const store = useBonjourrStore();
    expect(wrapper.find(".clock").attributes("data-hide")).toBe("clock");
    expect(wrapper.find(".clock-date").attributes("data-hide")).toBe("date");
    expect(wrapper.find(".greeting").attributes("data-hide")).toBe("greetings");
    expect(wrapper.find(".weather-line").attributes("data-hide")).toBe("weatherdesc");
    expect(wrapper.find(".settings-toggle").attributes("data-hide")).toBe("settingsicon");

    store.patch({ hide: { clock: true, greetings: true } });
    await flushPromises();
    expect(wrapper.find(".clock").exists()).toBe(true);
    expect(wrapper.find(".clock").classes()).toContain("he_hidden");
    expect(wrapper.find(".greeting").classes()).toContain("he_hidden");
    expect(wrapper.find(".clock-date").classes()).not.toContain("he_hidden");
    await wrapper.unmount();
  });

  it("l'ombre du texte, la largeur de page et le CSS suivent les réglages", async () => {
    mountView();
    await flushPromises();
    const store = useBonjourrStore();
    store.patch({ textShadow: 0.4, pagewidth: 900, css: ".clock { color: pink }" });
    await flushPromises();
    expect(root.style.getPropertyValue("--text-shadow-alpha")).toBe("0.4");
    expect(root.style.getPropertyValue("--page-width")).toBe("900px");
    expect(document.getElementById("styles")?.textContent).toBe(".clock { color: pink }");
  });

  it("favicon et titre d'onglet suivent les réglages", async () => {
    mountView();
    await flushPromises();
    useBonjourrStore().patch({ favicon: "🚀", tabtitle: "Starbreakers" });
    await flushPromises();
    expect(document.getElementById("favicon")?.getAttribute("href")).toContain("data:image/svg+xml,");
    expect(document.title).toBe("Starbreakers");
  });
});

function section(title: string) {
  const sections = mountPanel().findAll(".settings-panel .panel-section");
  const found = sections.find((part) => part.find(".panel-section-title").text() === title);
  if (!found) throw new Error(`section « ${title} » absente`);
  return found;
}

function mountPanel() {
  const pinia = createPinia();
  setActivePinia(pinia);
  return mount(BonjourrSettingsPanel, { global: { plugins: [pinia] } });
}

describe("panneau : réglages visuels", () => {
  beforeEach(() => {
    cleanDocument();
    localStorage.clear();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("réseau coupé");
      }),
    );
  });

  it("Apparence porte le mode sombre avec les quatre valeurs de la source", () => {
    const part = section("Apparence");
    const dark = part.find("#i_dark");
    expect(dark.findAll("option").map((o) => o.text())).toEqual([
      "Système",
      "La nuit",
      "Activé",
      "Désactivé",
    ]);
    // settings.html l.54-59 : system, auto, enable, disable.
    expect(dark.findAll("option").map((o) => o.attributes("value"))).toEqual([
      "system",
      "auto",
      "enable",
      "disable",
    ]);
    dark.setValue("enable");
    expect(useBonjourrStore().config.dark).toBe("enable");
  });

  it("les champs d'onglet reprennent id et bornes de la source (settings.html l.73-94)", () => {
    const part = section("Apparence");
    const favicon = part.find("#i_favicon");
    const tabtitle = part.find("#i_tabtitle");
    expect(favicon.attributes("maxlength")).toBe("2");
    expect(favicon.attributes("placeholder")).toBe("🌤");
    expect(tabtitle.attributes("maxlength")).toBe("80");
    expect(tabtitle.attributes("placeholder")).toBe("Nouvel onglet");
    tabtitle.setValue("Starbreakers");
    expect(useBonjourrStore().config.tabtitle).toBe("Starbreakers");
  });

  it("police : famille, graisse, couleur et taille avec les bornes d'origine", () => {
    const part = section("Apparence");
    expect(part.find("#dl_fontfamily").exists()).toBe(true);
    const customfont = part.find("#i_customfont");
    expect(customfont.attributes("list")).toBe("dl_fontfamily");
    const weight = part.find("#i_weight");
    expect(weight.findAll("option")).toHaveLength(9);
    expect(weight.findAll("option")[2].text()).toBe("Léger");
    const size = part.find("#i_size");
    expect(size.attributes("min")).toBe("5");
    expect(size.attributes("max")).toBe("26");
    expect(size.attributes("step")).toBe("0.05");
    const shadow = part.find("#i_textshadow");
    expect(shadow.attributes("min")).toBe("0");
    expect(shadow.attributes("max")).toBe("1");
    expect(shadow.attributes("step")).toBe("0.025");

    weight.setValue("500");
    size.setValue("18");
    part.find("#i_font-color").setValue("#123456");
    customfont.setValue("Roboto");
    part.find("#b_customfont").trigger("click");
    const font = useBonjourrStore().config.font;
    expect(font.weight).toBe("500");
    expect(font.size).toBe("18");
    expect(font.color).toBe("#123456");
    expect(font.family).toBe("Roboto");
  });

  it("page : largeur 600-2200 par 100, écart 0-8 par 0,5 (settings.html l.1902-1921)", () => {
    const part = section("Apparence");
    const width = part.find("#i_pagewidth");
    expect(width.attributes("min")).toBe("600");
    expect(width.attributes("max")).toBe("2200");
    expect(width.attributes("step")).toBe("100");
    const gap = part.find("#i_pagegap");
    expect(gap.attributes("min")).toBe("0");
    expect(gap.attributes("max")).toBe("8");
    expect(gap.attributes("step")).toBe("0.5");
    width.setValue("1000");
    gap.setValue("2");
    expect(useBonjourrStore().config.pagewidth).toBe(1000);
    expect(useBonjourrStore().config.pagegap).toBe(2);
  });

  it("le champ CSS garde l'id du textarea d'origine et sa longueur max (css.ts l.37-40)", () => {
    const part = section("Apparence");
    const css = part.find("#css-editor-textarea");
    expect(css.attributes("maxlength")).toBe("8080");
    expect(css.attributes("placeholder")).toBe("Saisissez votre CSS personnalisé");
    css.setValue(".clock { color: pink }");
    expect(useBonjourrStore().config.css).toBe(".clock { color: pink }");
  });

  it("masquage : icône des paramètres et bienvenue sont des cases, horloge et météo des sélecteurs", () => {
    const apparence = section("Apparence");
    const settingsicon = apparence.find("#i_settingshide");
    expect(settingsicon.attributes("type")).toBe("checkbox");
    settingsicon.setValue(true);
    expect(useBonjourrStore().config.hide.settingsicon).toBe(true);

    const horloge = section("Horloge");
    const timehide = horloge.find("#i_timehide");
    expect(timehide.findAll("option").map((o) => o.text())).toEqual([
      "Horloge et date",
      "Horloge seulement",
      "Date seulement",
    ]);
    // settings.html l.942-946 : ce qu'on montre ; « clock » = on ne montre que la date.
    expect(timehide.findAll("option").map((o) => o.attributes("value"))).toEqual(["all", "date", "clock"]);
    timehide.setValue("clock");
    expect(useBonjourrStore().config.hide.clock).toBe(true);
    expect(useBonjourrStore().config.hide.date).toBe(false);

    const meteo = section("Météo");
    const weatherhide = meteo.find("#i_weatherhide");
    expect(weatherhide.findAll("option").map((o) => o.attributes("value"))).toEqual([
      "all",
      "icon",
      "desc",
      "disabled",
    ]);
    // settings.ts l.733-734 : « disabled » masque les deux, « desc » masque la description.
    weatherhide.setValue("disabled");
    expect(useBonjourrStore().config.hide.weatherdesc).toBe(true);
    expect(useBonjourrStore().config.hide.weathericon).toBe(true);
    weatherhide.setValue("desc");
    expect(useBonjourrStore().config.hide.weatherdesc).toBe(true);
    expect(useBonjourrStore().config.hide.weathericon).toBe(false);

    const greet = meteo.find("#i_greethide");
    expect(greet.attributes("type")).toBe("checkbox");
    greet.setValue(false);
    expect(useBonjourrStore().config.hide.greetings).toBe(true);
  });
});
