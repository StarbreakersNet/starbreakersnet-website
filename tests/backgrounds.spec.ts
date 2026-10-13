import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import BonjourrView from "@/views/BonjourrView.vue";
import { STORAGE_KEY, useBonjourrStore } from "@/stores/bonjourr";
import type { BonjourrConfig } from "@/bonjourr/config";
import { LOCAL_STORAGE_KEY, readLocalStore, writeLocalStore } from "@/bonjourr/local";
import { backgroundRefreshTick, requestBackgroundRefresh } from "@/bonjourr/events";
import {
  BACKGROUNDS_API,
  PROVIDERS,
  applyApiCollections,
  backgroundsUrlFor,
  buildBackgroundUrls,
  collectionNameFor,
  collectionOf,
  creditFor,
  fetchBackgrounds,
  filtersFor,
  formatFromFileExt,
  lastUsedValidUrls,
  parseUrlList,
  resolutionFor,
  resolveBackground,
  rotateList,
  tryFetchBackgrounds,
  type BackgroundImage,
  type LocalBackgrounds,
} from "@/bonjourr/backgrounds";

// Case 19 : fonds façon Bonjourr. Sources : features/backgrounds/index.ts
// (initialisation l.66-111, filtres l.776-789, couleur l.630-633, cache des
// collections l.353-463, requête l.465-510, nom de collection l.512-543),
// backgrounds/urls.ts (rotation l.21-51, tri l.53-62, liste l.181-200),
// backgrounds/providers.ts l.1-75, backgrounds/credits.ts l.40-121,
// types/sync.ts l.75-117, defaults.ts l.134-149, settings.html l.136-507 et
// _locales/fr/translations.json l.119-186.

const image = (full: string, over: Partial<BackgroundImage> = {}): BackgroundImage => ({
  format: "image",
  urls: { full, small: full.replace(/\.jpg$/, "-small.jpg") },
  ...over,
});

const emptyLocal = (): LocalBackgrounds => ({
  backgroundUrls: {},
  backgroundCollections: {},
  backgroundLastChange: undefined,
});

const settings = (over: Partial<BonjourrConfig["backgrounds"]> = {}): BonjourrConfig["backgrounds"] => ({
  type: "images",
  frequency: "hour",
  fadein: 600,
  blur: 15,
  bright: 0.8,
  color: "#185A63",
  urls: "",
  images: "bonjourr-images-daylight",
  videos: "bonjourr-videos-daylight",
  mute: true,
  queries: {},
  ...over,
});

describe("fournisseurs et URL de l’API (providers.ts l.1-75, index.ts l.465-510)", () => {
  it("les cinq collections d’origine, deux pour les images, deux pour les vidéos", () => {
    expect(PROVIDERS.IMAGES.map((group) => group.optgroup)).toEqual(["Bonjourr", "Unsplash"]);
    expect(PROVIDERS.IMAGES.flatMap((group) => group.options.map((option) => option.value))).toEqual([
      "bonjourr-images-daylight",
      "unsplash-images-collections",
      "unsplash-images-search",
    ]);
    expect(PROVIDERS.VIDEOS.flatMap((group) => group.options.map((option) => option.value))).toEqual([
      "bonjourr-videos-daylight",
      "pixabay-videos-search",
    ]);
  });

  it("le nom de collection devient le chemin, la taille et la requête en suite", () => {
    expect(backgroundsUrlFor("bonjourr-images-daylight", { width: 1920, height: 1080 })).toBe(
      `${BACKGROUNDS_API}/bonjourr/images/daylight?h=1080&w=1920`,
    );
    expect(backgroundsUrlFor("unsplash-images-search", { width: 800, height: 600 }, "nature, hiver")).toBe(
      `${BACKGROUNDS_API}/unsplash/images/search?h=600&w=800&query=nature, hiver`,
    );
  });

  it("la densité s’applique à l’écran, les ratios extrêmes sont écrasés (l.482-493)", () => {
    expect(resolutionFor({ width: 1920, height: 1080 }, 2)).toEqual({ width: 3840, height: 2160 });
    expect(resolutionFor({ width: 1000, height: 400 }, 2)).toEqual({ width: 1600, height: 800 });
    expect(resolutionFor({ width: 400, height: 1000 }, 1)).toEqual({ width: 400, height: 800 });
  });

  it("une réponse dont les clés ne sont pas du bon médium est refusée", async () => {
    const fetchImpl = vi.fn(async () => ({ ok: true, json: async () => apiPayload })) as unknown as typeof fetch;

    expect(await fetchBackgrounds(settings(), { fetchImpl })).toBe(apiPayload);

    const wrong = vi.fn(async () => ({ ok: true, json: async () => ({ "unsplash-videos-x": [] }) }));
    await expect(fetchBackgrounds(settings(), { fetchImpl: wrong })).rejects.toThrowError(
      "Received JSON is bad",
    );

    const files = settings({ type: "files" });
    await expect(fetchBackgrounds(files, { fetchImpl })).rejects.toThrowError(
      'Can only fetch with "images" or "videos" type',
    );
  });

  it("hors-ligne, la requête ne dit rien (repli silencieux)", async () => {
    const offline = vi.fn(async () => {
      throw new TypeError("Failed to fetch");
    }) as unknown as typeof fetch;

    expect(await tryFetchBackgrounds(settings(), { fetchImpl: offline })).toBeUndefined();
  });
});

const apiPayload: Record<string, BackgroundImage[]> = {
  "bonjourr-images-daylight-day": [image("https://cdn/un.jpg"), image("https://cdn/deux.jpg")],
};

describe("collections en magasin (index.ts l.353-463, l.512-621)", () => {
  it("une collection « daylight » prend la période du jour dans son nom (l.534-540)", () => {
    const noon = new Date(2026, 9, 14, 12, 0);
    expect(collectionNameFor(settings(), emptyLocal(), noon)).toBe("bonjourr-images-daylight-day");
    expect(collectionNameFor(settings(), emptyLocal(), new Date(2026, 9, 14, 3, 0))).toBe(
      "bonjourr-images-daylight-night",
    );
    expect(
      collectionNameFor(settings({ images: "unsplash-images-search" }), emptyLocal(), noon),
    ).toBe("unsplash-images-search");
  });

  it("mélanger images et vidéos dans une collection est une erreur de format (l.577-589)", () => {
    const noon = new Date(2026, 9, 14, 12, 0);
    const video = {
      format: "video",
      duration: 8,
      urls: { full: "https://cdn/a.mp4", small: "https://cdn/a.jpg" },
    } as Background;

    const local: LocalBackgrounds = {
      ...emptyLocal(),
      backgroundCollections: {
        "bonjourr-images-daylight-day": [image("https://cdn/un.jpg")],
        // Des images rangées sous une collection de vidéos : le format est faux.
        "bonjourr-videos-daylight-day": [image("https://cdn/deux.jpg")],
      },
    };

    expect(collectionOf(settings(), local, noon).map((media) => media.urls.full)).toEqual([
      "https://cdn/un.jpg",
    ]);
    expect(() =>
      collectionOf(settings({ type: "videos", videos: "bonjourr-videos-daylight" }), local, noon),
    ).toThrowError("Wrong background format");

    const mixed: LocalBackgrounds = {
      ...emptyLocal(),
      backgroundCollections: { "bonjourr-images-daylight-day": [image("https://cdn/un.jpg"), video] },
    };

    expect(() => collectionOf(settings(), mixed, noon)).toThrowError("Wrong background format");
  });

  it("la rotation saute la tête de liste, la vidangeant à une unité près (l.421-423)", () => {
    expect(rotateList([])).toEqual([]);
    expect(rotateList(["a"])).toEqual([]);
    expect(rotateList(["a", "b", "c"])).toEqual(["b", "c"]);
  });

  it("le JSON de l’API entre dans le magasin par ses propres clés (l.605-611)", () => {
    const local = applyApiCollections(emptyLocal(), apiPayload);
    expect(Object.keys(local.backgroundCollections)).toEqual(["bonjourr-images-daylight-day"]);
    expect(local.backgroundCollections["bonjourr-images-daylight-day"]).toHaveLength(2);
  });
});

describe("liste d’URL (urls.ts l.21-87, l.181-200, l.307-315)", () => {
  it("une ligne par URL, en-http ou chemin absolu du site", () => {
    expect(parseUrlList("https://cdn/un.jpg\n /deux.jpg \nftp://trois.jpg\n\n")).toEqual([
      "https://cdn/un.jpg",
      "/deux.jpg",
    ]);
  });

  it("mp4 et webm sont des vidéos, le reste des images", () => {
    expect(formatFromFileExt("https://cdn/un.mp4")).toBe("video");
    expect(formatFromFileExt("https://cdn/deux.webm ")).toBe("video");
    expect(formatFromFileExt("https://cdn/trois.jpg")).toBe("image");
  });

  it("le magasin garde l’ordre d’usage, les URL cassées dehors (l.53-62)", () => {
    const metadatas = buildBackgroundUrls(
      ["https://cdn/un.jpg", "https://cdn/deux.jpg"],
      "OK",
      new Date(2026, 9, 14, 10, 0),
    );
    metadatas["https://cdn/deux.jpg"].lastUsed = new Date(2026, 9, 14, 12, 0).toString();
    metadatas["https://cdn/trois.jpg"] = {
      lastUsed: new Date(2026, 9, 14, 13, 0).toString(),
      format: "image",
      state: "CANT_REACH",
    };

    expect(lastUsedValidUrls(metadatas)).toEqual(["https://cdn/deux.jpg", "https://cdn/un.jpg"]);
    expect(metadatas["https://cdn/un.jpg"].state).toBe("OK");
    expect(metadatas["https://cdn/un.jpg"].lastUsed).toBe(new Date(2026, 9, 14, 10, 0).toString());
  });
});

describe("choix du fond (index.ts l.94-110, l.353-463, urls.ts l.21-51)", () => {
  it("la couleur unie est le fond, sans requête (l.103-105, l.630-633)", async () => {
    const resolved = await resolveBackground(settings({ type: "color", color: "#185A63" }), emptyLocal());
    expect(resolved.background).toBe("#185A63");
  });

  it("aucune URL valide ne laisse aucun fond (urls.ts l.24-27)", async () => {
    const resolved = await resolveBackground(settings({ type: "urls" }), emptyLocal());
    expect(resolved.background).toBeUndefined();
  });

  it("une URL unique ne tourne pas, même à chaque onglet", async () => {
    const local = {
      ...emptyLocal(),
      backgroundUrls: buildBackgroundUrls(["https://cdn/un.jpg"], "OK", new Date(2026, 9, 14, 10, 0)),
    };
    const resolved = await resolveBackground(settings({ type: "urls", frequency: "tabs" }), local, {
      now: new Date(2026, 9, 14, 12, 0),
    });

    expect(resolved.background).toMatchObject({ urls: { full: "https://cdn/un.jpg" } });
    expect(resolved.local.backgroundUrls["https://cdn/un.jpg"].lastUsed).toBe(
      new Date(2026, 9, 14, 10, 0).toString(),
    );
  });

  it("à chaque onglet, la tête est sautée, un tirage suit, et sa date est marquée", async () => {
    const local = {
      ...emptyLocal(),
      backgroundUrls: buildBackgroundUrls(
        ["https://cdn/un.jpg", "https://cdn/deux.jpg", "https://cdn/trois.jpg"],
        "OK",
        new Date(2026, 9, 14, 10, 0),
      ),
    };
    local.backgroundUrls["https://cdn/un.jpg"].lastUsed = new Date(2026, 9, 14, 12, 0).toString();

    const resolved = await resolveBackground(settings({ type: "urls", frequency: "tabs" }), local, {
      now: new Date(2026, 9, 14, 12, 0),
      random: () => 0,
    });

    // « un » est la plus récente, donc la tête sautée ; le tirage porte sur les deux autres.
    expect(resolved.background).toMatchObject({ urls: { full: "https://cdn/deux.jpg" } });
    expect(resolved.local.backgroundUrls["https://cdn/deux.jpg"].lastUsed).toBe(
      new Date(2026, 9, 14, 12, 0).toString(),
    );
    expect(resolved.local.backgroundUrls["https://cdn/un.jpg"].lastUsed).toBe(
      new Date(2026, 9, 14, 12, 0).toString(),
    );
  });

  it("vide, le magasin se remplit par l’API et date son changement (l.382-397)", async () => {
    const fetchImpl = vi.fn(async () => ({ ok: true, json: async () => apiPayload })) as unknown as typeof fetch;
    const now = new Date(2026, 9, 14, 12, 0);

    const resolved = await resolveBackground(settings(), emptyLocal(), { fetchImpl, now });

    // Le magasin se remplit puis le flux continue (l.382-397 puis l.421-423) :
    // la tête est sautée, c’est la seconde image qui s’affiche.
    expect(resolved.background).toMatchObject({ urls: { full: "https://cdn/deux.jpg" } });
    expect(resolved.local.backgroundLastChange).toBe(now.toString());
    // La réserve est passée à une unité, puis ravitaillée par l’API (l.449-461).
    expect(resolved.local.backgroundCollections["bonjourr-images-daylight-day"]).toHaveLength(2);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("une collection en réserve tourne d’un cran (l.421-447)", async () => {
    const local: LocalBackgrounds = {
      ...emptyLocal(),
      backgroundCollections: {
        "bonjourr-images-daylight-day": [image("https://cdn/un.jpg"), image("https://cdn/deux.jpg"), image("https://cdn/trois.jpg")],
      },
      backgroundLastChange: new Date(2026, 9, 14, 10, 0).toString(),
    };

    const resolved = await resolveBackground(settings(), local, { now: new Date(2026, 9, 14, 12, 0) });

    expect(resolved.background).toMatchObject({ urls: { full: "https://cdn/deux.jpg" } });
    expect(resolved.local.backgroundCollections["bonjourr-images-daylight-day"]).toHaveLength(2);
    expect(resolved.local.backgroundLastChange).toBe(new Date(2026, 9, 14, 12, 0).toString());
  });

  it("à l’heure close, le fond revient à la dernière image marquée (l.405-414)", async () => {
    const paused = image("https://cdn/marquee.jpg");
    const local: LocalBackgrounds = {
      ...emptyLocal(),
      backgroundCollections: {
        "bonjourr-images-daylight-day": [image("https://cdn/un.jpg"), image("https://cdn/deux.jpg")],
      },
      backgroundLastChange: new Date(2026, 9, 14, 10, 0).toString(),
    };

    const resolved = await resolveBackground(
      settings({ frequency: "pause", pausedImage: paused }),
      local,
      { now: new Date(2026, 9, 14, 12, 0) },
    );

    expect(resolved.background).toMatchObject({ urls: { full: "https://cdn/marquee.jpg" } });
  });

  it("verrouillé, « Arrière-plan suivant » fige l’image tirée (l.405, l.425-433)", async () => {
    const local: LocalBackgrounds = {
      ...emptyLocal(),
      backgroundCollections: {
        "bonjourr-images-daylight-day": [image("https://cdn/un.jpg"), image("https://cdn/deux.jpg")],
      },
      backgroundLastChange: new Date(2026, 9, 14, 10, 0).toString(),
    };

    // La fréquence « pause » ne tourne jamais d’elle-même (needsChange renvoie
    // faux dès qu’un changement est horodaté) : c’est la demande manuelle,
    // l’équivalent de `{ refresh: true }` (l.176-194), qui force le tirage.
    const resolved = await resolveBackground(settings({ frequency: "pause" }), local, {
      now: new Date(2026, 9, 14, 12, 0),
      needNew: true,
    });

    expect(resolved.background).toMatchObject({ urls: { full: "https://cdn/deux.jpg" } });
    expect(resolved.paused).toMatchObject({ urls: { full: "https://cdn/deux.jpg" } });
  });

  it("hors-ligne et magasin vide, aucun fond, aucun changement (repli silencieux)", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new TypeError("Failed to fetch");
    }) as unknown as typeof fetch;

    const resolved = await resolveBackground(settings(), emptyLocal(), { fetchImpl });

    expect(resolved.background).toBeUndefined();
    expect(resolved.local.backgroundCollections).toEqual({});
    expect(resolved.local.backgroundLastChange).toBeUndefined();
  });
});

describe("flou, luminosité, fondu et crédits (index.ts l.776-789, credits.ts l.40-121)", () => {
  it("les trois réglages deviennent les variables CSS d’origine", () => {
    const filters = filtersFor({ blur: 15, bright: 0.8, fadein: 600 });
    expect(filters.vars).toEqual({ "--blur": "15px", "--brightness": "0.8", "--fade-in": "600ms" });
    expect(filters.blurred).toBe(true);

    expect(filtersFor({ blur: 14 }).blurred).toBe(false);
    expect(filtersFor({ bright: 0.5 }).vars).toEqual({ "--brightness": "0.5" });
  });

  it("le crédit dit « Photo par », la ville passe avant l’artiste (credits.ts l.86-117)", () => {
    expect(creditFor()).toBe("");
    expect(creditFor(image("https://cdn/un.jpg"))).toBe("");
    expect(
      creditFor(image("https://cdn/un.jpg", { page: "https://unsplash.com/a", username: "emblavoss" })),
    ).toBe("Photo par Emblavoss");
    expect(
      creditFor(
        image("https://cdn/un.jpg", {
          page: "https://unsplash.com/a",
          username: "emblavoss",
          city: "Paris",
          country: "France",
        }),
      ),
    ).toBe("Paris, France - Emblavoss");
    expect(
      creditFor({ format: "video", duration: 8, urls: { full: "v.mp4", small: "v.jpg" }, page: "https://x", username: "rob" }),
    ).toBe("Video by Rob");
  });
});

describe("le magasin de côté (local.ts)", () => {
  beforeEach(() => localStorage.clear());

  it("un seul magasin local, partagé entre citations et fonds", () => {
    writeLocalStore({ quotesCache: [{ author: "a", content: "b" }] });
    writeLocalStore({ backgroundLastChange: "avant" });

    const store = readLocalStore();
    expect(store.backgroundLastChange).toBe("avant");
    expect(store.quotesCache).toHaveLength(1);
    expect(localStorage.getItem(LOCAL_STORAGE_KEY)).toContain("backgroundLastChange");
  });
});

describe("le fond sur la page (index.html, index.ts l.66-111)", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("réseau coupé");
      }),
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    document.body.classList.remove("blurred");
    document.documentElement.removeAttribute("style");
  });

  function mountView(patch?: Partial<BonjourrConfig["backgrounds"]>) {
    const pinia = createPinia();
    setActivePinia(pinia);
    const store = useBonjourrStore();
    if (patch) {
      store.patch({ backgrounds: patch });
    }
    return { wrapper: mount(BonjourrView, { global: { plugins: [pinia] } }), store };
  }

  it("le fond local par défaut garde son crédit d’origine", async () => {
    const { wrapper } = mountView();
    await flushPromises();

    expect(wrapper.find("img.bonjourr-background-image").attributes("src")).toBe("/bonjourr/background.jpg");
    expect(wrapper.find(".photo-credit").text()).toBe("Photo par Emblavoss");
  });

  it("la couleur unie remplace l’image par la variable d’origine (l.630-633)", async () => {
    const { wrapper } = mountView({ type: "color", color: "#185A63" });
    await flushPromises();
    await wrapper.vm.$nextTick();

    expect(document.documentElement.style.getPropertyValue("--solid-background")).toBe("#185A63");
    expect(wrapper.find("img.bonjourr-background-image").exists()).toBe(false);
  });

  it("flou et luminosité posent leurs variables, le corps devient « blurred » (l.776-784)", async () => {
    mountView({ blur: 20, bright: 0.5 });
    await flushPromises();

    expect(document.documentElement.style.getPropertyValue("--blur")).toBe("20px");
    expect(document.documentElement.style.getPropertyValue("--brightness")).toBe("0.5");
    expect(document.body.classList.contains("blurred")).toBe(true);
  });

  it("une collection images demande l’API et pose le fond reçu", async () => {
    const fetchImpl = vi.fn(async () => ({ ok: true, json: async () => apiPayload }));
    vi.stubGlobal("fetch", fetchImpl as unknown as typeof fetch);
    // Midi : la collection « daylight » porte la période du jour dans son nom.
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 14, 12, 0));

    const { wrapper } = mountView({ type: "images" });
    await flushPromises();
    await wrapper.vm.$nextTick();

    expect(String(fetchImpl.mock.calls[0]?.[0])).toContain(`${BACKGROUNDS_API}/bonjourr/images/daylight`);
    // Le flux continue après le remplissage (l.382-423) : la tête est sautée.
    expect(wrapper.find("img.bonjourr-background-image").attributes("src")).toBe("https://cdn/deux.jpg");
    expect(readLocalStore().backgroundCollections?.["bonjourr-images-daylight-day"]).toHaveLength(2);
  });

  it("hors-ligne, la page garde le fond précédent et ne dit rien", async () => {
    const { wrapper } = mountView({ type: "images" });
    await flushPromises();
    await wrapper.vm.$nextTick();

    expect(wrapper.find("img.bonjourr-background-image").exists()).toBe(false);
    expect(wrapper.find(".panel-warning, .error").exists()).toBe(false);
  });

  it("« Arrière-plan suivant » relance le choix sans toucher aux réglages", async () => {
    const { wrapper, store } = mountView({
      type: "urls",
      frequency: "pause",
      urls: "https://cdn/un.jpg\nhttps://cdn/deux.jpg",
    });
    await flushPromises();
    expect(wrapper.find("img.bonjourr-background-image").attributes("src")).toBe("https://cdn/un.jpg");

    const before = JSON.stringify(store.config.backgrounds);
    requestBackgroundRefresh();
    await flushPromises();
    await wrapper.vm.$nextTick();

    expect(backgroundRefreshTick.value).toBeGreaterThan(0);
    expect(JSON.stringify(store.config.backgrounds)).toBe(before);
    expect(wrapper.find("img.bonjourr-background-image").attributes("src")).toBe("https://cdn/deux.jpg");
  });
});

describe("section Fonds du panneau (settings.html l.136-507)", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("réseau coupé");
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function mountPanel() {
    const pinia = createPinia();
    setActivePinia(pinia);
    const store = useBonjourrStore();
    const wrapper = mount(BonjourrView, { global: { plugins: [pinia] } });
    return { wrapper, store };
  }

  it("type, fournisseur, fréquence, couleur, URL et trois curseurs", async () => {
    const { wrapper, store } = mountPanel();
    await wrapper.find(".settings-toggle").trigger("click");
    const section = wrapper
      .findAll(".settings-panel .panel-section")
      .find((part) => part.find(".panel-section-title").text() === "Fonds");
    expect(section?.exists()).toBe(true);

    expect(section!.findAll("label.setting > span").map((node) => node.text())).toEqual(
      expect.arrayContaining([
        "Type d'arrière-plan",
        "Fournisseur",
        "Fréquence",
        "Couleur de fond",
        "URL d'arrière-plan",
        "Intensité du flou",
        "Luminosité",
        "Temps de fondu",
      ]),
    );

    // Les cinq types de settings.html l.139-145.
    const type = section!.find("#i_type");
    expect(type.findAll("option").map((option) => option.text())).toEqual([
      "Images",
      "Vidéos",
      "Fichiers locaux",
      "URL",
      "Couleur unie",
    ]);
    await type.setValue("images");
    expect(store.config.backgrounds.type).toBe("images");

    // Le fournisseur suit le type choisi (l.153, providers.ts).
    const provider = section!.find("#i_background-provider");
    expect(provider.findAll("option").map((option) => option.text())).toEqual([
      "Lumière du jour Bonjourr",
      "Collections Unsplash",
      "Recherche Unsplash",
    ]);
    await provider.setValue("unsplash-images-search");
    expect(store.config.backgrounds.images).toBe("unsplash-images-search");

    // Les cinq fréquences d’origine (l.234-240).
    const frequency = section!.find("#i_freq");
    expect(frequency.findAll("option").map((option) => option.text())).toEqual([
      "Chaque onglet",
      "Chaque heure",
      "Lumière du jour",
      "Chaque jour",
      "Verrouillé",
    ]);
    await frequency.setValue("day");
    expect(store.config.backgrounds.frequency).toBe("day");

    // Curseurs aux bornes de la source (l.471, l.479-487, l.496-504).
    const ranges = section!.findAll("input[type=range]");
    expect(ranges[0].attributes("max")).toBe("50");
    expect(ranges[1].attributes("min")).toBe("0.2");
    expect(ranges[1].attributes("step")).toBe("0.01");
    expect(ranges[2].attributes("max")).toBe("1200");
    await ranges[0].setValue("30");
    await ranges[1].setValue("0.6");
    await ranges[2].setValue("400");
    expect(store.config.backgrounds.blur).toBe(30);
    expect(store.config.backgrounds.bright).toBe(0.6);
    expect(store.config.backgrounds.fadein).toBe(400);

    // Couleur (l.446-451) et liste d’URL (l.435-439).
    await section!.find("#i_solid-background").setValue("#000000");
    expect(store.config.backgrounds.color).toBe("#000000");
    await section!.find("#i_background-urls").setValue("https://cdn/un.jpg\nhttps://cdn/deux.jpg");
    expect(store.config.backgrounds.urls).toBe("https://cdn/un.jpg\nhttps://cdn/deux.jpg");

    // « Arrière-plan suivant » (l.241-252) : un signal, pas un réglage.
    const tick = backgroundRefreshTick.value;
    await section!.find("#i_refresh").trigger("click");
    expect(backgroundRefreshTick.value).toBe(tick + 1);

    const persisted = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
    expect(persisted.backgrounds.blur).toBe(30);
    expect(persisted.backgrounds.images).toBe("unsplash-images-search");
  });
});
