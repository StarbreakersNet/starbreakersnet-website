import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import MainMenu from "@/components/MainMenu.vue";
import { menuItems } from "@/models/MenuItem";

describe("menuItems (spec bouton_bonjourr.png)", () => {
  it("expose un item Bonjourr en première position, pointant vers la route bonjourr", () => {
    expect(menuItems[0]).toMatchObject({
      routeName: "bonjourr",
      label: "Bonjourr",
    });
  });

  it("utilise une icône maison pleine et une couleur menthe", () => {
    const item = menuItems.find((i) => i.label === "Bonjourr");
    expect(item?.icon).toEqual(["fas", "home"]);
    const color = item?.color ?? "";
    const m = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    expect(m).not.toBeNull();
    if (m) {
      const [, r, g, b] = m.map(Number);
      expect(g).toBeGreaterThan(r); // vert dominant
      expect(g).toBeGreaterThan(b);
      expect(g).toBeGreaterThan(150); // menthe claire
    }
  });

  it("garde l'ordre de la capture : Bonjourr, Discord, GitLab, Le Zap", () => {
    expect(menuItems.map((i) => i.label)).toEqual([
      "Bonjourr",
      "Discord",
      "GitLab",
      "Le Zap",
    ]);
  });
});

describe("MainMenu (rendu)", () => {
  it("affiche un bouton Bonjourr avant les autres", () => {
    const wrapper = mount(MainMenu, {
      global: {
        stubs: {
          "n-flex": { template: "<div><slot /></div>" },
          "n-button": { template: "<button><slot /></button>" },
          FontAwesomeIcon: true,
        },
        mocks: { $router: { push: () => {} } },
      },
    });
    const labels = wrapper
      .findAll("button")
      .map((b) => b.text())
      .filter(Boolean);
    expect(labels[0]).toBe("Bonjourr");
  });
});
