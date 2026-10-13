import { beforeEach, describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import BonjourrView from "@/views/BonjourrView.vue";
import { STORAGE_KEY, useBonjourrStore } from "@/stores/bonjourr";
import { DEFAULTS } from "@/bonjourr/config";
import {
  alignClasses,
  hexFromSplitRange,
  isOpaqueBackground,
  notesDefaultText,
  opacityFromHex,
  renderNotesMarkdown,
} from "@/bonjourr/notes";

// Case 16 : notes. Sources : Bonjourr/src/scripts/features/notes.ts,
// shared/{dom,generic}.ts, types/sync.ts l.168-175, defaults.ts l.184-189,
// settings.html l.1317-1376 et _locales/fr/translations.json.

describe("fond de la note (shared/dom.ts l.103-111, shared/generic.ts l.14-16)", () => {
  it("convertit la molette en hexadécimal à un chiffre d’alpha, clair ou sombre", () => {
    expect(hexFromSplitRange(0, "light")).toBe("#fff0");
    expect(hexFromSplitRange(2, "light")).toBe("#fff2");
    expect(hexFromSplitRange(15, "light")).toBe("#ffff");
    expect(hexFromSplitRange(7, "dark")).toBe("#0007");
    expect(opacityFromHex("#fff2")).toBe(2);
    expect(opacityFromHex("#000f")).toBe(15);
  });

  it("ne devient « opaque » que pour un fond blanc au-delà de 7 (notes.ts l.97)", () => {
    expect(isOpaqueBackground("#fff8")).toBe(true);
    expect(isOpaqueBackground("#fff7")).toBe(false);
    expect(isOpaqueBackground("#000f")).toBe(false);
    expect(isOpaqueBackground(undefined)).toBe(false);
  });
});

describe("texte par défaut (notes.ts l.102-113)", () => {
  it("reprend le gabarit markdown traduit en français", () => {
    expect(notesDefaultText("fr")).toBe(
      "## Modifiez cette note!\n\n[ ] Avec des titres markdown, listes, et cases à cocher\n\n" +
        "[ ] Plus d'infos sur https://bonjourr.fr/docs/widgets/notes/",
    );
  });

  it("faute de langue connue l'original retombe sur l’anglais (notes.ts l.105-107)", () => {
    expect(notesDefaultText("")).toBe(
      "## Edit this note!\n\n[ ] With markdown titles, lists, and checkboxes\n\n" +
        "[ ] Learn more on https://bonjourr.fr/docs/widgets/notes/",
    );
  });
});

describe("rendu markdown de la note", () => {
  it("titre, liste, cases et lien, avec échappement HTML", () => {
    expect(renderNotesMarkdown("# Titre")).toBe("<h1>Titre</h1>");
    expect(renderNotesMarkdown("### Trois")).toBe("<h3>Trois</h3>");
    expect(renderNotesMarkdown("- un\n- deux")).toBe("<ul><li>un</li><li>deux</li></ul>");
    expect(renderNotesMarkdown("[ ] à faire\n[x] fait")).toBe(
      '<ul class="notes-tasks"><li><input type="checkbox" disabled> à faire</li>' +
        '<li><input type="checkbox" checked disabled> fait</li></ul>',
    );
    expect(renderNotesMarkdown("[bonjourr](https://bonjourr.fr/)")).toBe(
      '<p><a href="https://bonjourr.fr/" rel="noreferrer noopener" target="_blank">bonjourr</a></p>',
    );
    expect(renderNotesMarkdown("**gras** et *italique*")).toBe(
      "<p><strong>gras</strong> et <em>italique</em></p>",
    );
    expect(renderNotesMarkdown("<img src=x onerror=alert(1)>")).toBe(
      "<p>&lt;img src=x onerror=alert(1)&gt;</p>",
    );
  });

  it("les sauts de ligne vides séparent les paragraphes", () => {
    expect(renderNotesMarkdown("un\n\ndeux")).toBe("<p>un</p><p>deux</p>");
  });
});

describe("alignement (notes.ts l.84-87)", () => {
  it("centre et droite sont portés par des classes, gauche aucune", () => {
    expect(alignClasses("left")).toEqual([]);
    expect(alignClasses("center")).toEqual(["center-align"]);
    expect(alignClasses("right")).toEqual(["right-align"]);
  });
});

describe("persistance", () => {
  beforeEach(() => localStorage.clear());

  it("la note survit à un rechargement", () => {
    setActivePinia(createPinia());
    const store = useBonjourrStore();
    expect(store.config.notes).toEqual({ ...DEFAULTS.notes });
    store.patch({
      notes: { on: true, text: "# Courses", width: 45, align: "right", background: "#fff8" },
    });

    const persisted = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
    expect(persisted.notes.text).toBe("# Courses");
    expect(persisted.notes.background).toBe("#fff8");

    setActivePinia(createPinia());
    const reloaded = useBonjourrStore();
    expect(reloaded.config.notes.on).toBe(true);
    expect(reloaded.config.notes.width).toBe(45);
    expect(reloaded.config.notes.align).toBe("right");
  });
});

describe("bloc-notes sur la page", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  function mountView() {
    const pinia = createPinia();
    setActivePinia(pinia);
    return mount(BonjourrView, { global: { plugins: [pinia] } });
  }

  it("masqué par défaut, il affiche la note et ses classes d’alignement", async () => {
    const wrapper = mountView();
    const store = useBonjourrStore();
    expect(wrapper.find("#notes_container").classes()).toContain("hidden");

    store.patch({ notes: { on: true, text: "# Courses", align: "center" } });
    await wrapper.vm.$nextTick();
    const notes = wrapper.find("#notes_container");
    expect(notes.classes()).not.toContain("hidden");
    expect(notes.classes()).toContain("center-align");
    expect(notes.find(".notes-rendered").html()).toContain("<h1>Courses</h1>");
  });

  it("largeur, fond et opacité posent les variables du document (notes.ts l.89-100)", async () => {
    const wrapper = mountView();
    useBonjourrStore().patch({ notes: { on: true, width: 45, background: "#fff8" } });
    await wrapper.vm.$nextTick();
    const root = document.documentElement.style;
    expect(root.getPropertyValue("--notes-width")).toBe("45em");
    expect(root.getPropertyValue("--notes-background")).toBe("#fff8");
    expect(wrapper.find("#notes_container").classes()).toContain("opaque");

    useBonjourrStore().patch({ notes: { background: "#000f" } });
    await wrapper.vm.$nextTick();
    expect(wrapper.find("#notes_container").classes()).not.toContain("opaque");
  });

  it("l’édition directe sur la page enregistre le texte", async () => {
    const wrapper = mountView();
    const store = useBonjourrStore();
    store.patch({ notes: { on: true, text: "## Modifiez cette note!" } });
    await wrapper.vm.$nextTick();

    const editor = wrapper.find("#pocket-editor");
    expect(editor.attributes("contenteditable")).toBe("true");
    editor.element.textContent = "- café\n- journal";
    await editor.trigger("input");
    expect(store.config.notes.text).toBe("- café\n- journal");
  });
});
