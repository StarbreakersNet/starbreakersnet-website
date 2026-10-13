import { describe, expect, it, vi } from "vitest";
import { existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import router from "@/router";
import BonjourrView from "@/views/BonjourrView.vue";
import { useBonjourrStore } from "@/stores/bonjourr";

function mountView() {
  const pinia = createPinia();
  setActivePinia(pinia);
  return mount(BonjourrView, { global: { plugins: [pinia] } });
}

describe("route bonjourr", () => {
  it("existe sur /bonjourr et n'est pas la route home (donc « ← Accueil » dans l'en-tête)", () => {
    const resolved = router.resolve({ name: "bonjourr" });
    expect(resolved.name).toBe("bonjourr");
    expect(resolved.path).toBe("/bonjourr");
    expect(router.options.routes.find((r) => r.name === "bonjourr")).toBeTruthy();
  });
});

describe("BonjourrView (squelette, spec affichage_bonjourr.png)", () => {
  it("occupe tout l'écran avec un fond et le crédit photo « Photo par Emblavoss »", () => {
    const wrapper = mountView();
    const root = wrapper.find(".bonjourr-view");
    expect(root.exists()).toBe(true);
    expect(wrapper.find(".bonjourr-background").exists()).toBe(true);
    expect(wrapper.find(".photo-credit").text()).toBe("Photo par Emblavoss");
  });

  it("affiche l'horloge, la date et la salutation du moment (22:06, Mardi 13 octobre, Bonsoir)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 13, 22, 6));
    const wrapper = mountView();
    expect(wrapper.find(".clock-time").text()).toBe("22:06");
    expect(wrapper.find(".clock-date").text()).toBe("Mardi 13 octobre");
    expect(wrapper.find(".greeting").text()).toBe("Bonsoir");
    vi.useRealTimers();
  });

  it("affiche la météo sous la salutation quand le réseau répond", async () => {
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
    // 22:06, heure de la capture : après le coucher du soleil, la prévision annoncée est
    // celle du lendemain (display.ts l.93 + request.ts l.81-87).
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 13, 22, 6));
    const wrapper = mountView();
    await flushPromises();
    expect(wrapper.find(".weather-line").exists()).toBe(true);
    expect(wrapper.find(".weather-line").text()).toBe(
      "Plutôt dégagé. Il fait actuellement 20° avec un maximum de 13° demain.",
    );
    expect(wrapper.find(".weather-temp").text()).toBe("20°");
    vi.useRealTimers();
    vi.unstubAllGlobals();
    Object.defineProperty(navigator, "geolocation", { value: geolocation, configurable: true });
  });

  it("utilise le fond local par défaut, posé sur le disque, flouté et piloté par le store", async () => {
    const store = useBonjourrStore();
    const backgroundUrl = store.backgroundUrl;
    const publicFile = join(process.cwd(), "public", backgroundUrl);
    expect(existsSync(publicFile)).toBe(true);
    expect(statSync(publicFile).size).toBeGreaterThan(10_000);

    const wrapper = mountView();
    await flushPromises();

    const img = wrapper.find("img.bonjourr-background-image");
    expect(img.exists()).toBe(true);
    expect(img.attributes("src")).toBe("/bonjourr/background.jpg");
    // Le flou n’est plus une style en ligne : il passe par la variable d’origine
    // `--blur` posée sur <html> (features/backgrounds/index.ts l.778).
    expect(document.documentElement.style.getPropertyValue("--blur")).toBe(`${store.blur}px`);
  });

  it("ouvre le panneau de réglages via l'engrenage en bas à droite, et la météo s'y coupe", async () => {
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
    const pinia = createPinia();
    setActivePinia(pinia);
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 13, 22, 6));
    const wrapper = mount(BonjourrView, { global: { plugins: [pinia] } });
    await flushPromises();
    expect(wrapper.find(".weather-line").exists()).toBe(true);
    expect(wrapper.find(".settings-panel").exists()).toBe(false);
    await wrapper.find(".settings-toggle").trigger("click");
    expect(wrapper.find(".settings-panel").exists()).toBe(true);
    // Depuis la case 13, la section Horloge porte elle aussi des cases à cocher :
    // l'invariant testé est le comportement « couper la météo », pas la position de
    // sa case → le sélecteur vise la section Météo du panneau.
    const weatherSection = wrapper
      .findAll(".settings-panel .panel-section")
      .find((part) => part.find(".panel-section-title").text() === "Météo");
    const checkbox = weatherSection?.find("input[type=checkbox]");
    expect(checkbox?.exists()).toBe(true);
    await checkbox?.setValue(false);
    await wrapper.vm.$nextTick();
    expect(wrapper.find(".weather-line").exists()).toBe(false);
    vi.useRealTimers();
    vi.unstubAllGlobals();
    Object.defineProperty(navigator, "geolocation", { value: geolocation, configurable: true });
  });
});
