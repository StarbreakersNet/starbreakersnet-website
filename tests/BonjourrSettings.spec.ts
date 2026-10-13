import { beforeEach, describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import BonjourrView from "@/views/BonjourrView.vue";
import { STORAGE_KEY, useBonjourrStore } from "@/stores/bonjourr";
import { DEFAULTS, mergeWithDefaults } from "@/bonjourr/config";

const SECTIONS = [
  "Apparence",
  "Fonds",
  "Horloge",
  "Météo",
  "Barre de recherche",
  "Liens rapides",
  "Notes",
  "Citations",
  "Pomodoro",
  "Données",
  "À propos",
];

function mountView() {
  const pinia = createPinia();
  setActivePinia(pinia);
  return mount(BonjourrView, { global: { plugins: [pinia] } });
}

describe("modèle de config (subset de SYNC_DEFAULT)", () => {
  it("reprend les clés et valeurs par défaut de l'original (spot check)", () => {
    expect(DEFAULTS.dark).toBe("system");
    expect(DEFAULTS.lang).toBe("fr");
    expect(DEFAULTS.weather.unit).toBe("metric");
    expect(DEFAULTS.weather.forecast).toBe("auto");
    expect(DEFAULTS.weather.temperature).toBe("actual");
    expect(DEFAULTS.weather.geolocation).toBe("approximate");
    expect(DEFAULTS.clock.ampm).toBe(false);
    expect(DEFAULTS.clock.analog).toBe(false);
    expect(DEFAULTS.clock.timezone).toBe("auto");
    expect(DEFAULTS.searchbar.engine).toBe("default");
    expect(DEFAULTS.searchbar.on).toBe(false);
    expect(DEFAULTS.quotes.frequency).toBe("day");
    expect(DEFAULTS.pomodoro.timeFor.pomodoro).toBe(1500);
    expect(DEFAULTS.font.size).toBe("14");
    expect(DEFAULTS.linksrow).toBe(6);
    expect(DEFAULTS.greetingsmode).toBe("auto");
  });

  it("merge profondément un patch partiel sans écraser les frères", () => {
    const merged = mergeWithDefaults({
      weather: { unit: "imperial" } as never,
      clock: { ampm: true },
    });
    expect(merged.weather.unit).toBe("imperial");
    expect(merged.weather.forecast).toBe("auto");
    expect(merged.clock.ampm).toBe(true);
    expect(merged.clock.analog).toBe(false);
    expect(merged.dark).toBe("system");
  });

  it("le store applique patch() en profondeur et persiste", () => {
    setActivePinia(createPinia());
    const store = useBonjourrStore();
    store.patch({ clock: { ampm: true }, lang: "en" });
    expect(store.config.clock.ampm).toBe(true);
    expect(store.config.clock.analog).toBe(false);
    expect(store.config.lang).toBe("en");
    const persisted = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
    expect(persisted.clock.ampm).toBe(true);
    expect(persisted.lang).toBe("en");
  });

  it("se réhydrate depuis un localStorage valide et retombe sur les défauts sinon", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ weather: { unit: "imperial" }, backgroundUrl: "/x.jpg" }),
    );
    setActivePinia(createPinia());
    let store = useBonjourrStore();
    expect(store.config.weather.unit).toBe("imperial");
    expect(store.config.weather.forecast).toBe("auto");
    expect(store.backgroundUrl).toBe("/x.jpg");

    localStorage.setItem(STORAGE_KEY, "{corrompu");
    setActivePinia(createPinia());
    store = useBonjourrStore();
    expect(store.config.weather.unit).toBe("metric");
  });

  it("garde les accesseurs legacy utilisés par la vue (backgroundUrl, showWeather, blur)", () => {
    setActivePinia(createPinia());
    const store = useBonjourrStore();
    expect(store.backgroundUrl).toBe("/bonjourr/background.jpg");
    expect(store.blur).toBe(15);
    store.setShowWeather(false);
    expect(store.showWeather).toBe(false);
    expect(useBonjourrStore().config.hide.weatherdesc).toBe(true);
  });
});

describe("panneau de réglages façon Bonjourr", () => {
  beforeEach(() => {
    localStorage.clear();
    // Les composants montés (météo, citations) ne doivent jamais toucher le réseau.
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("réseau coupé");
      }),
    );
  });

  it("l'engrenage ouvre un panneau contenant les onze sections", async () => {
    const wrapper = mountView();
    expect(wrapper.find(".settings-panel").exists()).toBe(false);
    await wrapper.find(".settings-toggle").trigger("click");
    const panel = wrapper.find(".settings-panel");
    expect(panel.exists()).toBe(true);
    const labels = panel.findAll(".panel-section-title").map((n) => n.text());
    for (const section of SECTIONS) {
      expect(labels).toContain(section);
    }
  });

  it("la touche Échap ferme le panneau", async () => {
    const wrapper = mountView();
    await wrapper.find(".settings-toggle").trigger("click");
    expect(wrapper.find(".settings-panel").exists()).toBe(true);
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    await vi.waitFor(() => {
      expect(wrapper.find(".settings-panel").exists()).toBe(false);
    });
  });

  it("la case météo du panneau coupe la météo (comportement session 1)", async () => {
    const geolocation = navigator.geolocation;
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
    const wrapper = mountView();
    await vi.waitFor(() => {
      expect(wrapper.find(".weather-line").exists()).toBe(true);
    });
    await wrapper.find(".settings-toggle").trigger("click");
    // La section Horloge porte désormais ses propres cases à cocher (case 13) : on
    // vise la case de la section Météo, seule chose que ce test ait jamais garantie.
    const weatherSection = wrapper
      .findAll(".settings-panel .panel-section")
      .find((part) => part.find(".panel-section-title").text() === "Météo");
    const checkbox = weatherSection?.find("input[type=checkbox]");
    expect(checkbox?.exists()).toBe(true);
    await checkbox?.setValue(false);
    await vi.waitFor(() => {
      expect(wrapper.find(".weather-line").exists()).toBe(false);
    });
    vi.unstubAllGlobals();
    Object.defineProperty(navigator, "geolocation", { value: geolocation, configurable: true });
  });

  it("la section Météo pilote source, clé, géolocalisation, ville, unité, prévisions et lien", async () => {
    const wrapper = mountView();
    await wrapper.find(".settings-toggle").trigger("click");
    const section = wrapper
      .findAll(".settings-panel .panel-section")
      .find((part) => part.find(".panel-section-title").text() === "Météo");
    expect(section?.exists()).toBe(true);
    const store = useBonjourrStore();
    const labels = () => section!.findAll("label.setting > span").map((node) => node.text());
    const selects = () => section!.findAll("select");

    // Options de settings.html : i_geol, i_units, i_show_unit, i_forecast, i_temp,
    // i_moreinfo, plus i_weatherhide (l.1189-1197, case 20) en fin de section.
    expect(labels()).toEqual(
      expect.arrayContaining([
        "Source des données",
        "Géolocalisation",
        "Unité de température",
        "Afficher l’unité",
        "Prévisions",
        "Température",
        "Météo détaillée",
      ]),
    );
    expect(selects()).toHaveLength(7);

    // La clé du provider payant n'est demandée que pour ce provider-là.
    expect(labels()).not.toContain("Clé API OpenWeatherMap");
    await selects()[0].setValue("openweathermap");
    expect(store.config.weather.source).toBe("openweathermap");
    expect(labels()).toContain("Clé API OpenWeatherMap");

    // Géolocalisation manuelle → ville personnalisée (request.ts l.56-60).
    await selects()[1].setValue("off");
    expect(labels()).toContain("Ville");
    await section!.find('input[placeholder="Paris"]').setValue("Lyon");
    expect(store.config.weather.city).toBe("Lyon");

    // moreinfo « custom » → URL du fournisseur (settings.html l.1171-1185).
    await selects()[5].setValue("custom");
    expect(labels()).toContain("URL du fournisseur");
    await section!
      .find('input[placeholder="https://weatherbug.com/"]')
      .setValue("https://weatherbug.com/");
    expect(store.config.weather.provider).toBe("https://weatherbug.com/");
  });

  it("la section Liens rapides pilote activer, groupes, onglet, rayon, ligne, apparence, titres et fonds", async () => {
    const wrapper = mountView();
    await wrapper.find(".settings-toggle").trigger("click");
    const section = wrapper
      .findAll(".settings-panel .panel-section")
      .find((part) => part.find(".panel-section-title").text() === "Liens rapides");
    expect(section?.exists()).toBe(true);
    const store = useBonjourrStore();
    const labels = () => section!.findAll("label.setting > span").map((node) => node.text());
    const checkboxes = () => section!.findAll("input[type=checkbox]");
    const ranges = () => section!.findAll("input[type=range]");

    // Libellés français de _locales/fr/translations.json l.191-206.
    expect(labels()).toEqual(
      expect.arrayContaining([
        "Activer",
        "Afficher les groupes",
        "Ouvrir dans un nouvel onglet",
        "Arrondi de l’icône",
        "Nombre de liens par ligne",
        "Apparence",
        "Afficher les titres des liens",
        "Afficher l’arrière-plan des liens",
      ]),
    );

    // i_quicklinks, i_linkgroups, i_linknewtab, puis b_showtitles et b_showbackgrounds.
    expect(checkboxes()).toHaveLength(5);
    await checkboxes()[0].setValue(false);
    expect(store.config.quicklinks).toBe(false);
    await checkboxes()[1].setValue(true);
    expect(store.config.linkgroups.on).toBe(true);
    expect(store.config.linkgroups.groups).toEqual(["default"]);

    // i_icon_radius (max 2.4) et i_row (max 16) : settings.html l.676-692.
    expect(ranges()[0].attributes("max")).toBe("2.4");
    expect(ranges()[1].attributes("max")).toBe("16");
    await ranges()[0].setValue("1.5");
    expect(store.config.linkiconradius).toBe(1.5);
    await ranges()[1].setValue("4");
    expect(store.config.linksrow).toBe(4);

    // i_linkstyle : les cinq styles de types/sync.ts l.13.
    const style = section!.find("select");
    expect(style.findAll("option").map((option) => option.text())).toEqual([
      "Grands",
      "Moyens",
      "Petits",
      "En ligne",
      "Texte",
    ]);
    await style.setValue("small");
    expect(store.config.linkstyle).toBe("small");

    await checkboxes()[3].setValue(false);
    expect(store.config.linktitles).toBe(false);
    await checkboxes()[4].setValue(false);
    expect(store.config.linkbackgrounds).toBe(false);

    // f_addlink (settings.html l.598-630) : URL requise, titre libre.
    await section!.find("#i_addlink-url").setValue("starbreakers.net");
    await section!.find("form.addlink").trigger("submit");
    expect(store.config.links).toHaveLength(1);
    expect(store.config.links[0].url).toBe("https://starbreakers.net");
    expect(store.config.links[0].title).toBe("");
  });

  it("la section Notes pilote activer, alignement, largeur, opacité et nuance du fond", async () => {
    const wrapper = mountView();
    await wrapper.find(".settings-toggle").trigger("click");
    const section = wrapper
      .findAll(".settings-panel .panel-section")
      .find((part) => part.find(".panel-section-title").text() === "Notes");
    expect(section?.exists()).toBe(true);
    const store = useBonjourrStore();
    const labels = () => section!.findAll("label.setting > span").map((node) => node.text());

    // Libellés français de _locales/fr/translations.json (l.28, l.119, l.191, l.296-299).
    expect(labels()).toEqual(
      expect.arrayContaining([
        "Activer",
        "Alignement du texte",
        "Largeur",
        "Arrière-plan",
        "Nuance",
      ]),
    );

    await section!.find("input[type=checkbox]").setValue(true);
    expect(store.config.notes.on).toBe(true);

    const align = section!.findAll("select")[0];
    expect(align.findAll("option").map((option) => option.text())).toEqual([
      "Gauche",
      "Centré",
      "Droite",
    ]);
    await align.setValue("right");
    expect(store.config.notes.align).toBe("right");

    // i_noteswidth : range 20-70 (settings.html l.1334-1343).
    const ranges = () => section!.findAll("input[type=range]");
    expect(ranges()[0].attributes("min")).toBe("20");
    expect(ranges()[0].attributes("max")).toBe("70");
    await ranges()[0].setValue("55");
    expect(store.config.notes.width).toBe(55);

    // i_notes-opacity (0-15) et i_notes-shade n'écrivent qu'un hexadécimal stocké
    // (settings.ts l.806-812), la nuance sombre conservant l'opacité choisie.
    expect(ranges()[1].attributes("max")).toBe("15");
    await ranges()[1].setValue("8");
    expect(store.config.notes.background).toBe("#fff8");
    await section!.findAll("select")[1].setValue("dark");
    expect(store.config.notes.background).toBe("#0008");
    expect(store.config.notes.align).toBe("right");
  });

  it("la section Citations pilote activer, auteur, type, liste, URL, fréquence et rafraîchissement", async () => {
    const wrapper = mountView();
    await wrapper.find(".settings-toggle").trigger("click");
    const section = wrapper
      .findAll(".settings-panel .panel-section")
      .find((part) => part.find(".panel-section-title").text() === "Citations");
    expect(section?.exists()).toBe(true);
    const store = useBonjourrStore();

    // Libellés français de _locales/fr/translations.json (l.148-152, l.322-326).
    expect(section!.findAll("label.setting > span").map((node) => node.text())).toEqual(
      expect.arrayContaining([
        "Activer",
        "Toujours afficher l’auteur",
        "Type de citations",
        "Fréquence",
      ]),
    );

    await section!.find("input[type=checkbox]").setValue(true);
    expect(store.config.quotes.on).toBe(true);
    await section!.findAll("input[type=checkbox]")[1].setValue(true);
    expect(store.config.quotes.author).toBe(true);

    // Les huit collections de settings.html l.1560-1569, traduites ou non.
    const type = section!.findAll("select")[0];
    expect(type.findAll("option").map((option) => option.text())).toEqual([
      "Classique",
      "Inspirobot",
      "Kaamelott",
      "Stoic",
      "Hitokoto",
      "The Office",
      "Personnalisé",
      "URL",
    ]);
    await type.setValue("user");
    expect(store.config.quotes.type).toBe("user");

    // La liste personnalisée n’existe qu’en mode « Personnalisé » (l.1578-1592).
    const list = section!.find("textarea");
    expect(list.exists()).toBe(true);
    await list.setValue("Marc, Bonjour\nAnon, Deux");
    expect(store.config.quotes.userlist).toBe("Marc, Bonjour\nAnon, Deux");

    await type.setValue("url");
    expect(section!.find("textarea").exists()).toBe(false);
    const url = section!.find("#i_qturl");
    await url.setValue("ftp://exemple.fr/citations.csv");
    await section!.find("#i_qturl-submit").trigger("click");
    expect(store.config.quotes.url).toBe("");
    expect(section!.find(".panel-warning").text()).toContain("http(s)");

    await url.setValue("https://exemple.fr/citations.csv");
    await section!.find("form.quote-url").trigger("submit");
    expect(store.config.quotes.url).toBe("https://exemple.fr/citations.csv");
    expect(section!.find(".panel-warning").exists()).toBe(false);

    // Quatre fréquences seulement dans l’UI d’origine (l.1629-1634).
    const frequency = section!.findAll("select")[1];
    expect(frequency.findAll("option").map((option) => option.text())).toEqual([
      "Chaque onglet",
      "Chaque heure",
      "Chaque jour",
      "Pause",
    ]);
    await frequency.setValue("hour");
    expect(store.config.quotes.frequency).toBe("hour");

    // `i_qtrefresh` (l.1635-1646) date la citation pour la faire avancer ; le
    // composant l’a déjà datée au montage, comme l’init de l’original (l.63-66).
    const stamped = store.config.quotes.last ?? 0;
    expect(stamped).toBeGreaterThan(0);
    await section!.find("button.panel-btn").trigger("click");
    expect(store.config.quotes.last ?? 0).toBeGreaterThan(stamped);
  });

  it("la section Pomodoro pilote activer, alerte, mélodie, volume et les trois durées", async () => {
    const wrapper = mountView();
    await wrapper.find(".settings-toggle").trigger("click");
    const section = wrapper
      .findAll(".settings-panel .panel-section")
      .find((part) => part.find(".panel-section-title").text() === "Pomodoro");
    expect(section?.exists()).toBe(true);
    const store = useBonjourrStore();

    // Libellés français de _locales/fr/translations.json (l.66-74) posés sur la
    // descente de settings.html l.1669-1779.
    expect(section!.findAll("label.setting > span").map((node) => node.text())).toEqual(
      expect.arrayContaining([
        "Activer",
        "Alerte sonore",
        "Mélodie de l'alarme",
        "Volume de l'alarme",
        "Temps par défaut",
        "Temps de pause",
        "Temps de longue pause",
      ]),
    );

    await section!.find("input[type=checkbox]").setValue(true);
    expect(store.config.pomodoro.on).toBe(true);
    await section!.findAll("input[type=checkbox]")[1].setValue(false);
    expect(store.config.pomodoro.sound).toBe(false);

    // Les deux mélodies de l’original (l.1690-1693).
    const alarm = section!.find("#i_pmdr_alarms");
    expect(alarm.findAll("option").map((option) => option.text())).toEqual(["Marimba", "Clock Alarm"]);
    await alarm.setValue("clock-alarm");
    expect(store.config.pomodoro.alarm).toBe("clock-alarm");

    // Volume : min .1, max 1, pas .1 (l.1714-1723).
    const volume = section!.find("#i_pmdr_volume");
    expect(volume.attributes("min")).toBe("0.1");
    expect(volume.attributes("max")).toBe("1");
    expect(volume.attributes("step")).toBe("0.1");
    await volume.setValue("0.4");
    expect(store.config.pomodoro.volume).toBe(0.4);

    // Les trois durées, min 1 max 59, s’affichent en minutes et se rangent en
    // secondes (features/pomodoro.ts l.592).
    const durations = ["#i_pmdr_pomodoro", "#i_pmdr_break", "#i_pmdr_longbreak"].map((id) =>
      section!.find(id),
    );
    expect(durations.map((input) => (input.element as HTMLInputElement).value)).toEqual(["25", "5", "20"]);
    expect(durations[0].attributes("min")).toBe("1");
    expect(durations[0].attributes("max")).toBe("59");

    await durations[1].setValue("10");
    expect(store.config.pomodoro.timeFor).toEqual({ pomodoro: 1500, break: 600, longbreak: 1200 });
  });
});
