import { beforeEach, describe, expect, it } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { STORAGE_KEY, useBonjourrStore } from "@/stores/bonjourr";

describe("store réglages Bonjourr", () => {
  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
  });

  it("a des réglages par défaut (fond local, météo visible, flou marqué)", () => {
    const store = useBonjourrStore();
    expect(store.backgroundUrl).toBe("/bonjourr/background.jpg");
    expect(store.showWeather).toBe(true);
    // 15 px : défaut d’origine (defaults.ts l.137) et seuil de `body.blurred`.
    expect(store.blur).toBe(15);
  });

  it("persiste chaque réglage dans localStorage", () => {
    const store = useBonjourrStore();
    store.setBackgroundUrl("https://exemple.fr/fond.jpg");
    store.setShowWeather(false);
    store.setBlur(20);
    const persisted = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
    expect(persisted).toMatchObject({
      backgroundUrl: "https://exemple.fr/fond.jpg",
      showWeather: false,
      blur: 20,
    });
  });

  it("se réhydrate depuis localStorage au démarrage", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ backgroundUrl: "/perso.jpg", showWeather: false, blur: 4 }),
    );
    setActivePinia(createPinia());
    const store = useBonjourrStore();
    expect(store.backgroundUrl).toBe("/perso.jpg");
    expect(store.showWeather).toBe(false);
    expect(store.blur).toBe(4);
  });

  it("garde des valeurs par défaut si localStorage est corrompu", () => {
    localStorage.setItem(STORAGE_KEY, "{pas du json");
    setActivePinia(createPinia());
    const store = useBonjourrStore();
    expect(store.showWeather).toBe(true);
    expect(store.blur).toBe(15);
  });
});
