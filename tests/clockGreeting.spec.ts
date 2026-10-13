import { beforeEach, describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import BonjourrView from "@/views/BonjourrView.vue";
import { useBonjourrStore } from "@/stores/bonjourr";
import {
  analogAngles,
  formatClock,
  formatFrenchDate,
  worldClockTimes,
} from "@/bonjourr/clock";
import { selectGreeting } from "@/bonjourr/greeting";

describe("formatClock enrichi (clock.ts de l'original : ampm, secondes, fuseau)", () => {
  const utc = (h: number, m: number, s = 0) => new Date(Date.UTC(2026, 9, 13, h, m, s));

  it("24h par défaut, secondes en option", () => {
    expect(formatClock(utc(22, 6), { timezone: "UTC" })).toBe("22:06");
    expect(formatClock(utc(9, 5), { timezone: "UTC" })).toBe("09:05");
    expect(formatClock(utc(22, 6, 30), { seconds: true, timezone: "UTC" })).toBe("22:06:30");
  });

  it("12h (ampm) : 0h→12 AM, 12h→12 PM, 22h→10 PM (l.120-140 de l'original)", () => {
    expect(formatClock(utc(0, 6), { ampm: true, timezone: "UTC" })).toBe("12:06 AM");
    expect(formatClock(utc(12, 0), { ampm: true, timezone: "UTC" })).toBe("12:00 PM");
    expect(formatClock(utc(22, 6), { ampm: true, timezone: "UTC" })).toBe("10:06 PM");
  });

  it("fuseau : la même instante s'affiche selon la timezone", () => {
    const instant = new Date(Date.UTC(2026, 9, 13, 0, 0));
    expect(formatClock(instant, { timezone: "Asia/Tokyo" })).toBe("09:00");
    expect(formatClock(instant, { timezone: "America/New_York" })).toBe("20:00");
  });
});

describe("analogAngles (mêmes formules que analog() de l'original)", () => {
  it("calcule les degrés des aiguilles (l.151-153)", () => {
    const angles = analogAngles(new Date(2026, 9, 13, 22, 6, 30));
    expect(angles.hours).toBeCloseTo(303, 1);
    expect(angles.minutes).toBeCloseTo(39, 1);
    expect(angles.seconds).toBeCloseTo(180, 1);
  });
});

describe("formatFrenchDate avec dateformat auto|eu|us|cn (date.ts de l'original)", () => {
  const date = new Date(2026, 9, 13, 22, 6);

  it("auto = semaine jour mois (capture « Mardi 13 octobre »)", () => {
    expect(formatFrenchDate(date, "auto")).toBe("Mardi 13 octobre");
  });

  it("eu = semaine jour mois, us = semaine mois jour, cn = mois jour semaine", () => {
    expect(formatFrenchDate(date, "eu")).toBe("Mardi 13 octobre");
    expect(formatFrenchDate(date, "us")).toBe("Mardi octobre 13");
    expect(formatFrenchDate(date, "cn")).toBe("octobre 13 Mardi");
  });
});

describe("worldClockTimes (clock.ts l.32-40 : worldclocks filtrées sur region)", () => {
  it("utilise les heures du monde quand actives, sinon l'heure locale", () => {
    const instant = new Date(Date.UTC(2026, 9, 13, 0, 0));
    const times = worldClockTimes(instant, {
      ampm: false,
      seconds: false,
      worldclocks: true,
      entries: [
        { region: "Tokyo", timezone: "Asia/Tokyo" },
        { region: "", timezone: "Europe/Paris" },
        { region: "New York", timezone: "America/New_York" },
      ],
    });
    expect(times).toEqual([
      { region: "Tokyo", time: "09:00" },
      { region: "New York", time: "20:00" },
    ]);
  });

  it("sans heures du monde, une seule entrée au fuseau principal", () => {
    const instant = new Date(Date.UTC(2026, 9, 13, 9, 5));
    const times = worldClockTimes(instant, {
      ampm: false,
      seconds: false,
      worldclocks: false,
      entries: [],
      timezone: "UTC",
    });
    // digital() de l'original affiche les minutes exactement (clock.ts l.118 fixunits,
    // l.145 mm.textContent) : aucune raison d'arrondir à l'heure.
    expect(times).toEqual([{ region: "", time: "09:05" }]);
  });
});

describe("selectGreeting (greetings.ts de l'original, traduction fr)", () => {
  const at = (hour: number, minute = 0) => new Date(2026, 9, 13, hour, minute);
  const auto = { mode: "auto" as const, custom: undefined };

  it("périodes 0-3 soir, 3-5 nuit, 5-12 matin, 12-18 après-midi, 18-24 soir", () => {
    expect(selectGreeting(at(0), auto)).toBe("Bonsoir");
    expect(selectGreeting(at(2, 59), auto)).toBe("Bonsoir");
    expect(selectGreeting(at(3), auto)).toBe("Bonne nuit");
    expect(selectGreeting(at(4, 59), auto)).toBe("Bonne nuit");
    expect(selectGreeting(at(5), auto)).toBe("Bonjour");
    expect(selectGreeting(at(17, 59), auto)).toBe("Bonjour");
    expect(selectGreeting(at(18), auto)).toBe("Bonsoir");
    expect(selectGreeting(at(22, 6), auto)).toBe("Bonsoir");
  });

  it("ajoute le prénom après une virgule (l.52-53)", () => {
    expect(selectGreeting(at(22), { ...auto, name: "Paul" })).toBe("Bonsoir, Paul");
  });

  it("mode custom : gabarit du créneau avec $name, sinon repli par défaut", () => {
    const opts = {
      mode: "custom" as const,
      name: "Paul",
      custom: {
        morning: "Lève-toi $name",
        afternoon: "",
        evening: "Couchon $name",
        night: "",
      },
    };
    expect(selectGreeting(at(22), opts)).toBe("Couchon Paul");
    // créneau sans gabarit → repli sur la salutation par défaut, prénom ajouté après
    // virgule comme dans la branche « else » de l'original (greetings.ts l.49-53).
    expect(selectGreeting(at(14), opts)).toBe("Bonjour, Paul");
  });
});

describe("analogAngles au fuseau (cadran réglé sur un autre fuseau)", () => {
  it("utilise les heures du fuseau, pas celles de la machine", () => {
    const instant = new Date(Date.UTC(2026, 9, 13, 22, 6, 30));
    // 22:06:30 UTC = 07:06:30 à Tokyo : (7 + 6/60) * 30 = 213° (clock.ts analog() l.152).
    const angles = analogAngles(instant, "Asia/Tokyo");
    expect(angles.hours).toBeCloseTo(213, 1);
    expect(angles.minutes).toBeCloseTo(39, 1);
    expect(angles.seconds).toBeCloseTo(180, 1);
  });
});

describe("section Horloge du panneau (case 13)", () => {
  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
  });

  function mountView() {
    const pinia = createPinia();
    setActivePinia(pinia);
    return mount(BonjourrView, { global: { plugins: [pinia] } });
  }

  function panelSection(wrapper: ReturnType<typeof mountView>, title: string) {
    return wrapper
      .findAll(".settings-panel .panel-section")
      .find((part) => part.find(".panel-section-title").text() === title);
  }

  it("les commutateurs 12 h et secondes écrivent la config et l'horloge de la vue", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 13, 22, 6, 30));
    const wrapper = mountView();
    await wrapper.find(".settings-toggle").trigger("click");
    const switches = panelSection(wrapper, "Horloge")?.findAll("input[type=checkbox]");
    expect(switches?.length).toBeGreaterThanOrEqual(4);
    await switches?.[0].setValue(true);
    expect(wrapper.find(".clock-time").text()).toBe("10:06 PM");
    await switches?.[1].setValue(true);
    await vi.advanceTimersByTimeAsync(1000);
    expect(wrapper.find(".clock-time").text()).toBe("10:06:31 PM");
    vi.useRealTimers();
  });

  it("le prénom de salutation et les heures du monde atteignent la vue", async () => {
    const wrapper = mountView();
    await wrapper.find(".settings-toggle").trigger("click");
    const horloge = panelSection(wrapper, "Horloge");

    await horloge?.find('input[placeholder="Prénom"]').setValue("Paul");
    expect(wrapper.find(".greeting").text()).toContain("Paul");

    const worldSwitches = horloge?.findAll("input[type=checkbox]");
    await worldSwitches?.[3].setValue(true);
    const cities = wrapper.findAll('.settings-panel input[aria-label="Ajouter une ville"]');
    expect(cities).toHaveLength(3);
    await cities[0].setValue("Tokyo");
    expect(wrapper.findAll(".clock-wrapper")).toHaveLength(1);
    expect(wrapper.find(".clock-region").text()).toBe("Tokyo");
  });
});

describe("vue : réglages d'horloge appliqués", () => {
  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
  });

  function mountView(options: { attachTo?: Element } = {}) {
    const pinia = createPinia();
    setActivePinia(pinia);
    return mount(BonjourrView, { global: { plugins: [pinia] }, ...options });
  }

  it("l'analogique affiche un cadran SVG et le prénom apparaît dans la salutation", async () => {
    useBonjourrStore().patch({
      clock: { analog: true },
      greeting: "Paul",
    });
    const wrapper = mountView();
    expect(wrapper.find(".analog-clock svg").exists()).toBe(true);
    expect(wrapper.find(".greeting").text()).toContain("Paul");
  });

  it("le cadran analogique suit le fuseau réglé (analog() passe l’heure du fuseau)", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(Date.UTC(2026, 9, 13, 22, 6, 30)));
    useBonjourrStore().patch({ clock: { analog: true, timezone: "Asia/Tokyo" } });
    const wrapper = mountView();
    const transform = wrapper.find(".analog-hours").attributes("transform") ?? "";
    const degrees = Number(/rotate\(([-\d.]+)/.exec(transform)?.[1] ?? NaN);
    expect(degrees).toBeCloseTo(213, 1);
    vi.useRealTimers();
  });

  it("hide.clock laisse l'horloge en place et lui pose he_hidden (hide.ts l.18-22)", async () => {
    useBonjourrStore().patch({ hide: { clock: true } });
    // `hideElements` consulte `document` (hide.ts l.19) : montage rattaché.
    const wrapper = mountView({ attachTo: document.body });
    const clock = wrapper.find(".clock");
    expect(clock.exists()).toBe(true);
    expect(clock.attributes("data-hide")).toBe("clock");
    expect(clock.classes()).toContain("he_hidden");
    await wrapper.unmount();
  });
});
