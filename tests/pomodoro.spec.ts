import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import BonjourrView from "@/views/BonjourrView.vue";
import { STORAGE_KEY, useBonjourrStore } from "@/stores/bonjourr";
import type { BonjourrConfig } from "@/bonjourr/config";
import {
  TIME_BEFORE_RESET,
  alarmPlan,
  countSessions,
  formatTime,
  isDefaultStopped,
  isRunning,
  minutesToSeconds,
  pushSession,
  remainingAfterPause,
  secondsLeft,
  secondsToMinutes,
  startFromButton,
  tabTitleFor,
} from "@/bonjourr/pomodoro";

// Case 18 : minuteur Pomodoro. Sources : Bonjourr/src/scripts/features/pomodoro.ts
// (l.247-360 pour la montre, l.362-397 pour l’affichage et le titre d’onglet,
// l.471-535 pour l’alarme et les séances, l.577-595 pour l’historique et les
// durées), types/sync.ts l.223-237, defaults.ts l.206-221, index.html l.587-660,
// settings.html l.1669-1781 et _locales/fr/translations.json l.61-75.

const state = (over: Partial<BonjourrConfig["pomodoro"]> = {}): BonjourrConfig["pomodoro"] => ({
  on: true,
  mode: "pomodoro",
  pause: 0,
  end: 0,
  timeFor: { pomodoro: 1500, break: 300, longbreak: 1200 },
  focus: false,
  sound: true,
  alarm: "marimba",
  volume: 0.7,
  history: [],
  ...over,
});

describe("montre (pomodoro.ts l.262-360, l.362-376)", () => {
  it("affiche minutes:secondes sans zéro initial sur les minutes", () => {
    expect(formatTime(1500)).toBe("25:00");
    expect(formatTime(305)).toBe("5:05");
    expect(formatTime(59)).toBe("0:59");
    expect(formatTime(0)).toBe("0:00");
  });

  it("arrondit le temps restant en secondes (l.343-344)", () => {
    expect(secondsLeft(10_000, 4000)).toBe(6);
    expect(secondsLeft(10_000, 9600)).toBe(0);
  });

  it("reconnaît une montre qui tourne de celle qui est à zéro (l.248-249)", () => {
    expect(isRunning(state({ end: 2000 }), 1000)).toBe(true);
    expect(isRunning(state({ end: 1000 }), 2000)).toBe(false);
    expect(isRunning(state({ end: 0 }), 1000)).toBe(false);
    expect(isDefaultStopped(state({ end: 0 }), 1000)).toBe(true);
    expect(isDefaultStopped(state({ end: 2000 }), 1000)).toBe(false);
  });

  it("démarre depuis le bouton, à l’heure ou en reprenant la pause (l.275-299)", () => {
    expect(startFromButton(state(), 1000)).toEqual({ end: 1_501_000, pause: 0 });
    expect(startFromButton(state({ mode: "break" }), 1000)).toEqual({ end: 301_000, pause: 0 });

    // Reprendre : `end - pause` secondes de reste, à partir de maintenant.
    const paused = state({ end: 10_000, pause: 6000 });
    expect(remainingAfterPause(paused)).toBe(4000);
    expect(startFromButton(paused, 20_000)).toEqual({ end: 24_000, pause: 0 });
  });

  it("convertit les minutes du panneau en secondes rangées (l.592, settings.ts l.237-240)", () => {
    expect(minutesToSeconds(25)).toBe(1500);
    expect(secondsToMinutes(300)).toBe(5);
  });
});

describe("séances et alarme (pomodoro.ts l.471-535, l.577-581)", () => {
  it("compte les séances du jour, de la semaine de lundi et du mois", () => {
    // Mercredi 14 octobre 2026 à 12 h : lundi 12 octobre, mois d’octobre.
    const now = new Date(2026, 9, 14, 12, 0);
    const entry = (date: Date) => ({ endedAt: String(date.getTime()), duration: 1500 });
    const history = [
      entry(new Date(2026, 9, 14, 9, 0)), // aujourd’hui
      entry(new Date(2026, 9, 13, 9, 0)), // hier, cette semaine
      entry(new Date(2026, 9, 12, 9, 0)), // lundi de cette semaine
      entry(new Date(2026, 9, 11, 9, 0)), // dimanche dernier : hors semaine
      entry(new Date(2026, 8, 30, 9, 0)), // septembre : hors mois
    ];

    expect(countSessions(history, now)).toEqual({ today: 1, week: 3, month: 4 });
    expect(countSessions([], now)).toEqual({ today: 0, week: 0, month: 0 });
  });

  it("ne garde une séance que d’une fin de pomodoro, avec sa durée (l.482-488)", () => {
    const history = pushSession([], 1_000, 1500);
    expect(history).toEqual([{ endedAt: "1000", duration: 1500 }]);
    expect(pushSession(history, 2_000, 300)).toHaveLength(2);
  });

  it("l’alarme suit l’interrupteur, au volume demandé (l.477, l.497-503)", () => {
    expect(alarmPlan(false, 0.3)).toEqual({ ring: false, volume: 0.3 });
    expect(alarmPlan(true, 0.3)).toEqual({ ring: true, volume: 0.3 });
    expect(alarmPlan(true, undefined)).toEqual({ ring: true, volume: 0.7 });
  });
});

describe("titre d’onglet (pomodoro.ts l.378-397)", () => {
  const timesUp = "Temps écoulé !";

  it("place le minuteur devant le titre, l’enlève en pause", () => {
    expect(tabTitleFor("5:00", true, "Starbreakers | Bonjourr", timesUp)).toBe("5:00 | Bonjourr");
    expect(tabTitleFor("5:00", false, "Starbreakers | Bonjourr", timesUp)).toBe("Bonjourr");
    expect(tabTitleFor("0:00", true, "Starbreakers | Bonjourr", timesUp)).toBe("Temps écoulé ! | Bonjourr");
    expect(tabTitleFor("5:00", true, "Starbreakers", timesUp)).toBe("5:00 | Starbreakers");
  });
});

describe("minuteur sur la page (index.html l.587-660, pomodoro.ts l.75-88, l.247-360)", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
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
  });

  function mountView(patch?: Partial<BonjourrConfig["pomodoro"]>) {
    const pinia = createPinia();
    setActivePinia(pinia);
    const store = useBonjourrStore();
    if (patch) {
      store.patch({ pomodoro: patch });
    }
    return { wrapper: mount(BonjourrView, { global: { plugins: [pinia] } }), store };
  }

  it("masqué par défaut, il montre la durée du mode choisi", async () => {
    const { wrapper } = mountView();
    expect(wrapper.find("#pomodoro_container").classes()).toContain("hidden");

    const { wrapper: shown } = mountView({ on: true });
    await shown.vm.$nextTick();
    const container = shown.find("#pomodoro_container");
    expect(container.classes()).not.toContain("hidden");
    expect(container.find("#pmdr_timer").text()).toBe("25:00");
    expect(container.classes()).not.toContain("started");
  });

  it("le départ date la fin, la minute s’égrenne ensuite", async () => {
    const { wrapper, store } = mountView({ on: true });
    await wrapper.vm.$nextTick();

    await wrapper.find("#pmdr_start").trigger("click");
    expect(wrapper.find("#pomodoro_container").classes()).toContain("started");
    expect(store.config.pomodoro.end).toBe(Date.now() + 1_500_000);
    expect(store.config.pomodoro.pause).toBe(0);

    vi.advanceTimersByTime(60_000);
    await wrapper.vm.$nextTick();
    expect(wrapper.find("#pmdr_timer").text()).toBe("24:00");
  });

  it("la pause fige l’heure restante, le reprise la remet en marche", async () => {
    const { wrapper, store } = mountView({ on: true });
    await wrapper.vm.$nextTick();

    await wrapper.find("#pmdr_start").trigger("click");
    vi.advanceTimersByTime(600_000);

    await wrapper.find("#pmdr_pause").trigger("click");
    expect(wrapper.find("#pomodoro_container").classes()).not.toContain("started");
    expect(store.config.pomodoro.pause).toBeGreaterThan(0);

    const remaining = store.config.pomodoro.end - store.config.pomodoro.pause;
    expect(Math.round(remaining / 1000)).toBe(900);

    vi.advanceTimersByTime(600_000);
    await wrapper.find("#pmdr_start").trigger("click");
    expect(store.config.pomodoro.end).toBe(Date.now() + remaining);
    expect(store.config.pomodoro.pause).toBe(0);
    expect(wrapper.find("#pmdr_timer").text()).toBe("15:00");
  });

  it("au bout du temps, sonne l’heure, inscrit la séance puis remet à zéro", async () => {
    const { wrapper, store } = mountView({ on: true });
    await wrapper.vm.$nextTick();

    await wrapper.find("#pmdr_start").trigger("click");
    vi.advanceTimersByTime(1_500_000);
    await wrapper.vm.$nextTick();

    expect(wrapper.find("#pmdr_timer").text()).toBe("0:00");

    // `calculateSecondsLeft` rend 0 dès que l’arrondi tombe à zéro, une demi-seconde
    // avant l’heure (l.343-359) : la séance est inscrite à cet instant-là.
    const [session] = store.config.pomodoro.history;
    expect(Number(session.endedAt)).toBeLessThanOrEqual(Date.now());
    expect(Number(session.endedAt)).toBeGreaterThan(Date.now() - 1000);
    expect(session.duration).toBe(1500);

    vi.advanceTimersByTime(TIME_BEFORE_RESET + 1000);
    await wrapper.vm.$nextTick();
    expect(wrapper.find("#pmdr_timer").text()).toBe("25:00");
    expect(store.config.pomodoro.end).toBe(0);
  });

  it("une pause inscrite ne fait pas de séance (l.482)", async () => {
    const { wrapper, store } = mountView({ on: true, mode: "break" });
    await wrapper.vm.$nextTick();
    expect(wrapper.find("#pmdr_timer").text()).toBe("5:00");

    await wrapper.find("#pmdr_start").trigger("click");
    vi.advanceTimersByTime(300_000);
    await wrapper.vm.$nextTick();
    expect(wrapper.find("#pmdr_timer").text()).toBe("0:00");
    expect(store.config.pomodoro.history).toEqual([]);
  });

  it("changer de mode remet la montre à l’heure de ce mode (l.190-199)", async () => {
    const { wrapper, store } = mountView({ on: true });
    await wrapper.vm.$nextTick();

    await wrapper.find("#pmdr_start").trigger("click");
    vi.advanceTimersByTime(60_000);

    await wrapper.find("#pmdr-longbreak").setValue("longbreak");
    expect(store.config.pomodoro.mode).toBe("longbreak");
    expect(store.config.pomodoro.end).toBe(0);
    expect(store.config.pomodoro.pause).toBe(0);
    expect(wrapper.find("#pmdr_timer").text()).toBe("20:00");
    expect(wrapper.find("#pomodoro_container").classes()).not.toContain("started");
  });

  it("le mode concentration masque le reste de la page (l.403-468)", async () => {
    const { wrapper } = mountView({ on: true, focus: true });
    await wrapper.vm.$nextTick();
    expect(wrapper.find("#pomodoro_container").classes()).toContain("onFocus");
    expect(document.body.classList.contains("pomodoro-focus")).toBe(true);

    await wrapper.find("#pmdr-focus").setValue(false);
    expect(wrapper.find("#pomodoro_container").classes()).toContain("outOfFocus");
    expect(document.body.classList.contains("pomodoro-focus")).toBe(false);
    expect(useBonjourrStore().config.pomodoro.focus).toBe(false);
  });

  it("une montre déjà lancée reprend toute seule au montage (l.247-259)", async () => {
    const { wrapper } = mountView({ on: true, end: Date.now() + 600_000 });
    await flushPromises();
    await wrapper.vm.$nextTick();
    expect(wrapper.find("#pomodoro_container").classes()).toContain("started");
    expect(wrapper.find("#pmdr_timer").text()).toBe("10:00");

    vi.advanceTimersByTime(60_000);
    await wrapper.vm.$nextTick();
    expect(wrapper.find("#pmdr_timer").text()).toBe("9:00");
  });

  it("changer la durée d’un mode remet la montre qui tourne (l.604-606)", async () => {
    const { wrapper, store } = mountView({ on: true });
    await wrapper.vm.$nextTick();

    await wrapper.find("#pmdr_start").trigger("click");
    vi.advanceTimersByTime(60_000);
    await wrapper.vm.$nextTick();
    expect(wrapper.find("#pmdr_timer").text()).toBe("24:00");

    store.patch({ pomodoro: { timeFor: { ...store.config.pomodoro.timeFor, pomodoro: 600 } } });
    await wrapper.vm.$nextTick();

    expect(wrapper.find("#pmdr_timer").text()).toBe("10:00");
    expect(wrapper.find("#pomodoro_container").classes()).not.toContain("started");
    expect(store.config.pomodoro.end).toBe(0);
    expect(store.config.pomodoro.pause).toBe(0);
  });

  it("les séances inscrites se lisent dans le minuteur (l.506-535)", async () => {
    const ended = String(new Date(2026, 9, 14, 9, 0).getTime());
    vi.setSystemTime(new Date(2026, 9, 14, 12, 0));
    const { wrapper } = mountView({ on: true, history: [{ endedAt: ended, duration: 1500 }] });
    await wrapper.vm.$nextTick();

    expect(wrapper.find("#poms-today").text()).toBe("1");
    expect(wrapper.find("#poms-week").text()).toBe("1");
    expect(wrapper.find("#poms-month").text()).toBe("1");

    const persisted = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
    expect(persisted.pomodoro.history).toHaveLength(1);
  });
});
