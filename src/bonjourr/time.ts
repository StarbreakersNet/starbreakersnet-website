// Le temps de l'original, partagé entre les citations et les fonds : période
// daylight et horodatage de changement. Reproduit Bonjourr/src/scripts/shared/
// time.ts : `minutator` l.8-11, `daylightPeriod` l.65-87, `needsChange`
// l.109-137. Le fork garde les fonctions pures, comme pour les autres modules.

import type { Frequency } from "./config";

export type Suntime = { rise: number; set: number };
export type DaylightPeriod = "night" | "noon" | "day" | "evening";

/** Lever/coucher par défaut, en minutes (shared/time.ts l.9-11). */
export const SUNTIME: Suntime = { rise: 420, set: 1320 };

/** Minutes écoulées depuis minuit (shared/time.ts l.8). */
export function minutator(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

/** Autour du lever et du coucher, à ± 60 minutes (shared/time.ts l.65-87). */
export function daylightPeriod(time?: number, sun: Suntime = SUNTIME): DaylightPeriod {
  const mins = minutator(time === undefined ? new Date() : new Date(time));

  if (mins >= 0 && mins <= sun.rise - 60) {
    return "night";
  }

  if (mins <= sun.rise + 60) {
    return "noon";
  }

  if (mins <= sun.set - 60) {
    return "day";
  }

  if (mins <= sun.set + 60) {
    return "evening";
  }

  if (mins >= sun.set + 60) {
    return "night";
  }

  return "day";
}

/** Faut-il une valeur neuve ? (shared/time.ts l.109-137) */
export function needsChange(
  every: Frequency,
  last: number,
  now: Date = new Date(),
  sun: Suntime = SUNTIME,
): boolean {
  const lastDate = last !== undefined ? new Date(last) : now;
  const changed = {
    date: now.getDate() !== lastDate.getDate(),
    hour: now.getHours() !== lastDate.getHours(),
  };

  switch (every) {
    case "day":
      return changed.date;

    case "hour":
      return changed.date || changed.hour;

    case "tabs":
      return true;

    case "pause":
      return last === 0;

    case "period":
      return last === 0 ? true : daylightPeriod(now.getTime(), sun) !== daylightPeriod(+lastDate, sun);

    default:
      return false;
  }
}
