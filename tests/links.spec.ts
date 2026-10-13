import { beforeEach, describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import BonjourrView from "@/views/BonjourrView.vue";
import { STORAGE_KEY, useBonjourrStore } from "@/stores/bonjourr";
import { DEFAULTS, type LinkElem } from "@/bonjourr/config";
import {
  addGroup,
  addLink,
  defaultIcon,
  deleteGroup,
  deleteLinks,
  iconFor,
  linksInGroup,
  moveLink,
  renameGroup,
  selectGroup,
  titleFromUrl,
  toggleGroups,
  updateLink,
  validateLink,
  type LinkGroups,
} from "@/bonjourr/links";

// Case 15 : liens rapides. Sources : Bonjourr/src/scripts/features/links/
// {index,helpers,groups}.ts et types/{shared,sync}.ts.

function groupsFixture(): LinkGroups {
  return structuredClone(DEFAULTS.linkgroups);
}

function link(title: string, url: string, order: number, parent?: string): LinkElem {
  // Un lien sans `parent` est invisible (helpers.ts l.75 : `parent ?? 0`), donc les
  // fixtures appartiennent toujours à un groupe.
  return { _id: `links${title}`, order, title, url, parent: parent ?? "default" };
}

describe("validateLink (index.ts l.854-870)", () => {
  it("préfixe l'URL selon le cas : https, localhost en http, pages de config en #", () => {
    expect(validateLink("DuckDuckGo", "duckduckgo.com/?q=a").url).toBe(
      "https://duckduckgo.com/?q=a",
    );
    expect(validateLink("", "localhost:8000/bonjourr").url).toBe("http://localhost:8000/bonjourr");
    expect(validateLink("", "127.0.0.1:8000").url).toBe("http://127.0.0.1:8000");
    expect(validateLink("", "chrome://settings").url).toBe("#chrome://settings");
    expect(validateLink("", "https://deja.fr").url).toBe("https://deja.fr");
  });

  it("tronque titre à 64 et URL à 512, id « links » + 6, ordre = horodatage", () => {
    const created = validateLink("t".repeat(70), `${"a".repeat(600)}.fr`);
    expect(created.title).toHaveLength(64);
    expect(created.url).toBe(`https://${"a".repeat(512)}`);
    expect(created._id).toMatch(/^links[A-Za-z0-9]{6}$/);
    expect(created.order).toBeGreaterThan(1_000_000);
  });
});

describe("favicon du service d'origine (helpers.ts l.8-14, index.ts l.904-919)", () => {
  it("construit l'URL du service et son actualisation", () => {
    expect(defaultIcon("https://duckduckgo.com/")).toBe(
      "https://services.bonjourr.fr/favicon/blob/https://duckduckgo.com/",
    );
    expect(defaultIcon("https://duckduckgo.com", 1760000000)).toBe(
      "https://services.bonjourr.fr/favicon/blob/https://duckduckgo.com?r=1760000000",
    );
  });

  it("retenue origine+chemin (pas de query), icône personnalisée sinon", () => {
    expect(iconFor(link("ddg", "https://duckduckgo.com/?q=x", 0))).toBe(
      "https://services.bonjourr.fr/favicon/blob/https://duckduckgo.com/",
    );
    expect(iconFor({ ...link("perso", "https://x.fr", 0), icon: { type: "url", value: "/i.png" } })).toBe(
      "/i.png",
    );
  });
});

describe("titre repris de l'URL (helpers.ts l.39-58)", () => {
  it("titre vide → hostname sans www", () => {
    expect(titleFromUrl("https://www.engadget.com/fr")).toBe("engadget.com");
    expect(titleFromUrl("pas une url")).toBe("");
  });
});

describe("CRUD des liens rapides", () => {
  it("ajoute à la fin, dans le groupe courant, et modifie titre/URL", () => {
    let links = addLink([], { title: "Un", url: "un.fr", parent: "default" });
    links = addLink(links, { title: "", url: "https://deux.fr", parent: "default" });
    // validateLink (index.ts l.867) conserve le titre vide tel quel : c'est l'affichage
    // (createTitle, helpers.ts l.43-57) qui retombe sur le nom d'hôte.
    expect(links.map((l) => l.title)).toEqual(["Un", ""]);
    expect(links[1].url).toBe("https://deux.fr");
    links = updateLink(links, links[1]._id, { title: "Deux", url: "trois.fr" });
    expect(links[1].title).toBe("Deux");
    expect(links[1].url).toBe("https://trois.fr");
  });

  it("supprime et réordonne en réindexant l'ordre (index.ts l.879-899)", () => {
    const base = [link("a", "https://a.fr", 0), link("b", "https://b.fr", 1), link("c", "https://c.fr", 2)];
    expect(deleteLinks(base, [base[1]._id]).map((l) => l.title)).toEqual(["a", "c"]);
    const moved = moveLink(base, base[2]._id, 0);
    expect(moved.map((l) => l.title)).toEqual(["c", "a", "b"]);
    expect(moved.map((l) => l.order)).toEqual([0, 1, 2]);
  });

  it("filtrage par groupe, trié par ordre (helpers.ts l.70-83)", () => {
    const links = [
      link("t2", "https://t.fr", 2, "travail"),
      link("d2", "https://d.fr", 1, "default"),
      link("d1", "https://e.fr", 0, "default"),
    ];
    expect(linksInGroup(links, "default").map((l) => l.title)).toEqual(["d1", "d2"]);
    expect(linksInGroup(links, "travail").map((l) => l.title)).toEqual(["t2"]);
  });
});

describe("groupes (groups.ts l.129-207)", () => {
  it("groupe unique : ni ajout d’un nom réservé ou déjà pris, ni suppression", () => {
    const state = { links: [link("d", "https://d.fr", 0, "default")], linkgroups: groupsFixture() };
    expect(addGroup(state, "default").linkgroups.groups).toEqual(["default"]);
    expect(addGroup(state, "+").linkgroups.groups).toEqual(["default"]);
    expect(deleteGroup(state, "default").linkgroups.groups).toEqual(["default"]);
  });

  it("ajout, renommage (liens déplacés) et suppression (liens supprimés)", () => {
    let state = { links: [link("d", "https://d.fr", 0, "default")], linkgroups: groupsFixture() };
    state = addGroup(state, "travail");
    expect(state.linkgroups.groups).toEqual(["default", "travail"]);
    expect(state.linkgroups.selected).toBe("travail");

    state = { ...state, links: addLink(state.links, { title: "Pro", url: "pro.fr", parent: "travail" }) };
    state = renameGroup(state, "travail", "boulot");
    expect(state.linkgroups.groups).toEqual(["default", "boulot"]);
    expect(state.linkgroups.selected).toBe("boulot");
    expect(state.links.map((l) => l.parent)).toEqual(["default", "boulot"]);

    state = deleteGroup(state, "boulot");
    expect(state.linkgroups.groups).toEqual(["default"]);
    expect(state.linkgroups.selected).toBe("default");
    expect(state.links.map((l) => l.title)).toEqual(["d"]);
  });

  it("activation des groupes et sélection du groupe courant", () => {
    const state = { links: [], linkgroups: groupsFixture() };
    expect(toggleGroups(state, true).linkgroups.on).toBe(true);
    expect(selectGroup({ ...state, linkgroups: { ...state.linkgroups, groups: ["default", "b"] } }, "b").linkgroups.selected).toBe("b");
  });
});

describe("persistance via le store", () => {
  beforeEach(() => localStorage.clear());

  it("liens et options des liens survivent à un rechargement", () => {
    setActivePinia(createPinia());
    const store = useBonjourrStore();
    store.patch({
      links: addLink([], { title: "Starbreakers", url: "starbreakers.net", parent: "default" }),
      linkgroups: toggleGroups({ links: [], linkgroups: groupsFixture() }, true).linkgroups,
      linksrow: 5,
    });

    const persisted = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
    expect(persisted.links[0].url).toBe("https://starbreakers.net");
    expect(persisted.linkgroups.on).toBe(true);
    expect(persisted.linksrow).toBe(5);

    setActivePinia(createPinia());
    const reloaded = useBonjourrStore();
    expect(reloaded.config.links[0].title).toBe("Starbreakers");
    expect(reloaded.config.linkgroups.on).toBe(true);
    expect(reloaded.config.linksrow).toBe(5);
  });
});

describe("grille de liens rapides (rendu)", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, json: async () => ({}) }) as unknown as Response),
    );
  });

  function mountView() {
    const pinia = createPinia();
    setActivePinia(pinia);
    return mount(BonjourrView, { global: { plugins: [pinia] } });
  }

  it("rend un lien par élément, dans l’ordre, et masque les titres à la demande", async () => {
    const wrapper = mountView();
    const store = useBonjourrStore();
    store.patch({
      links: [
        { ...link("b", "https://b.fr", 1), },
        { ...link("a", "https://a.fr", 0) },
      ],
    });
    await wrapper.vm.$nextTick();
    const blocks = wrapper.find("#linkblocks");
    expect(blocks.exists()).toBe(true);
    expect(wrapper.findAll("li.link-elem")).toHaveLength(2);
    expect(wrapper.findAll(".link-elem-title").map((n) => n.text())).toEqual(["a", "b"]);
    expect(blocks.classes()).toContain("titles");

    store.patch({ linktitles: false });
    await wrapper.vm.$nextTick();
    // L'original ne supprime pas les titres : il retire la classe `titles`
    // (index.ts l.125) et le CSS masque le texte.
    expect(wrapper.find("#linkblocks").classes()).not.toContain("titles");
  });

  it("ouvre dans un nouvel onglet quand linknewtab est actif", async () => {
    const wrapper = mountView();
    const store = useBonjourrStore();
    store.patch({ links: [link("a", "https://a.fr", 0)], linknewtab: true });
    await wrapper.vm.$nextTick();
    expect(wrapper.find("li.link-elem a").attributes("target")).toBe("_blank");

    store.patch({ linknewtab: false });
    await wrapper.vm.$nextTick();
    expect(wrapper.find("li.link-elem a").attributes("target")).toBeUndefined();
  });

  it("pose --links-width (medium × 6 = 33em) et --link-outer-radius (index.ts l.363-376, l.841-843)", async () => {
    const wrapper = mountView();
    useBonjourrStore().patch({ links: [link("a", "https://a.fr", 0)] });
    await wrapper.vm.$nextTick();
    // L'original pose ces variables sur la racine du document, pas sur le conteneur.
    const root = document.documentElement.style;
    expect(root.getPropertyValue("--links-width")).toBe("33em");
    expect(root.getPropertyValue("--link-outer-radius")).toBe("1.1em");

    useBonjourrStore().patch({ linkstyle: "small", linksrow: 4 });
    await wrapper.vm.$nextTick();
    expect(root.getPropertyValue("--links-width")).toBe("18em");
  });

  it("l’overlay d’édition ajoute, enregistre puis supprime un lien (CRUD complet)", async () => {
    const wrapper = mountView();
    const store = useBonjourrStore();
    store.patch({ links: [link("a", "https://a.fr", 0)] });
    await wrapper.vm.$nextTick();

    // Clic droit sur la zone vide : le dialogue d'édition s'ouvre en mode ajout
    // (features/links/edit.ts, #contextmenu + #editlink-form, index.html l.29-55).
    await wrapper.find("#linkblocks").trigger("contextmenu");
    const form = wrapper.find("#editlink-form");
    expect(form.exists()).toBe(true);
    await wrapper.find("#e-title").setValue("Starbreakers");
    await wrapper.find("#e-url").setValue("starbreakers.net");
    await form.trigger("submit");
    await wrapper.vm.$nextTick();
    expect(store.config.links.map((l) => l.title)).toEqual(["a", "Starbreakers"]);
    expect(store.config.links[1].url).toBe("https://starbreakers.net");

    await wrapper.findAll("li.link-elem")[0].trigger("contextmenu");
    await wrapper.find("#e-title").setValue("A renommé");
    await wrapper.find("#edit-apply").trigger("click");
    await wrapper.vm.$nextTick();
    expect(store.config.links.map((l) => l.title)).toEqual(["A renommé", "Starbreakers"]);

    await wrapper.findAll("li.link-elem")[0].trigger("contextmenu");
    await wrapper.find("#edit-delete").trigger("click");
    await wrapper.vm.$nextTick();
    expect(store.config.links.map((l) => l.title)).toEqual(["Starbreakers"]);
    expect(wrapper.findAll("li.link-elem")).toHaveLength(1);
  });
});
