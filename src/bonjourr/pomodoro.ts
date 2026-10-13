// Logique du minuteur Pomodoro du fork, pure de tout DOM.
// Règles reprises de Bonjourr/src/scripts/features/pomodoro.ts : montre
// l.262-319, pause l.321-327, temps restant l.343-360, affichage l.362-376,
// titre d'onglet l.378-397, alarme et séances l.471-535, historique et durées
// l.577-595 ; types/sync.ts l.223-237 ; defaults.ts l.206-221.
// Écart assumé : l'original ne sonne que sur l'onglet « actif » via un
// `lastActiveTab` et un TAB_ID propres à l'extension (l.471-495) ; le fork, une
// page unique, sonne toujours. Il n'embarque pas non plus les mp3 de la source.

import type { BonjourrConfig } from "./config";

export type PomodoroState = BonjourrConfig["pomodoro"];
export type PomodoroMode = PomodoroState["mode"];
export type SessionEntry = PomodoroState["history"][number];

/** Délai avant remise à zéro une fois le temps écoulé (pomodoro.ts l.47). */
export const TIME_BEFORE_RESET = 10000;

/** Volume par défaut de l'alarme (pomodoro.ts l.499, defaults.ts l.218). */
export const DEFAULT_VOLUME = 0.7;

/** `minutes:secondes`, sans zéro initial sur les minutes (l.367-369). */
export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${rest < 10 ? "0" : ""}${rest}`;
}

/** Secondes arrondies avant la fin, jamais négatives (l.343-359). */
export function secondsLeft(end: number, now: number): number {
  return Math.max(0, Math.round((end - now) / 1000));
}

/** La montre tourne encore (l.248). */
export function isRunning(pomodoro: Pick<PomodoroState, "end">, now: number): boolean {
  return Boolean(pomodoro.end) && now < pomodoro.end;
}

/** La montre est arrêtée sur sa durée par défaut (l.249). */
export function isDefaultStopped(pomodoro: Pick<PomodoroState, "end">, now: number): boolean {
  return !pomodoro.end || now > pomodoro.end;
}

/** Ce qu'il reste sous le pouce quand la montre est en pause (l.276). */
export function remainingAfterPause(pomodoro: Pick<PomodoroState, "end" | "pause">): number {
  return pomodoro.end - pomodoro.pause;
}

/** Appui sur « démarrer » : reprise de la pause, ou durée pleine du mode (l.275-299). */
export function startFromButton(pomodoro: PomodoroState, now: number): { end: number; pause: number } {
  if (pomodoro.pause !== 0) {
    return { end: now + remainingAfterPause(pomodoro), pause: 0 };
  }

  return { end: now + pomodoro.timeFor[pomodoro.mode] * 1000, pause: 0 };
}

/** Le panneau règle les durées en minutes, le magasin les garde en secondes (l.592). */
export function minutesToSeconds(minutes: number): number {
  return minutes * 60;
}

export function secondsToMinutes(seconds: number): number {
  return seconds / 60;
}

/** Séances du jour, de la semaine — lundi en tête — et du mois (l.506-530). */
export function countSessions(
  history: SessionEntry[],
  now: Date = new Date(),
): { today: number; week: number; month: number } {
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const startOfWeek = new Date(now);
  const day = (now.getDay() + 6) % 7;
  startOfWeek.setDate(now.getDate() - day);
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  let today = 0;
  let week = 0;
  let month = 0;

  for (const entry of history) {
    const endedAt = new Date(Number(entry.endedAt));

    if (endedAt >= startOfToday) today++;
    if (endedAt >= startOfWeek) week++;
    if (endedAt >= startOfMonth) month++;
  }

  return { today, week, month };
}

/** Une fin de pomodoro s'inscrit avec la durée du mode (l.482-488, l.577-581). */
export function pushSession(history: SessionEntry[], now: number, duration: number): SessionEntry[] {
  return [...history, { endedAt: String(now), duration }];
}

/** L'alarme ne sonne que si on l'a demandée, au volume choisi (l.477, l.497-503). */
export function alarmPlan(sound: boolean, volume?: number): { ring: boolean; volume: number } {
  return { ring: sound, volume: volume ?? DEFAULT_VOLUME };
}

/**
 * Titre d'onglet : l'heure devant ce qui suit le pipe, effacée en pause,
 * remplacée par « Temps écoulé ! » à zéro (l.378-397).
 */
export function tabTitleFor(
  displayTime: string,
  timerIsStarted: boolean,
  baseTitle: string,
  timesUp: string,
): string {
  const afterPipe = baseTitle.match(/\| (.*)/)?.[1] ?? baseTitle;

  if (displayTime !== "0:00") {
    return timerIsStarted ? `${displayTime} | ${afterPipe}` : afterPipe;
  }

  return `${timesUp} | ${afterPipe}`;
}

/**
 * Le son de l'alarme. L'original lit `src/assets/sounds/<mélodie>.mp3`
 * (l.497-504) ; le fork n'a pas ces fichiers et fabrique trois notes aiguës au
 * moyen de WebAudio. Jamais laissé sans surveillance : un navigateur sans
 * contexte audio doit rester muet, pas casser la page.
 */
export function playAlarmSound(volume: number, alarm?: string): void {
  try {
    const Context = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    if (!Context) {
      return;
    }

    const context = new Context();
    const gain = context.createGain();
    gain.gain.value = volume;
    gain.connect(context.destination);

    // « clock-alarm » tique plus grave et plus lentement que « marimba ».
    const low = alarm === "clock-alarm";
    const notes = low ? [440, 330] : [880, 1174.66, 1567.98];
    const step = low ? 0.32 : 0.18;

    notes.forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const start = context.currentTime + index * step;
      oscillator.type = low ? "square" : "triangle";
      oscillator.frequency.value = frequency;
      oscillator.connect(gain);
      oscillator.start(start);
      oscillator.stop(start + step * 0.9);
    });
  } catch (_error) {
    // Muet plutôt qu'en panne.
  }
}
