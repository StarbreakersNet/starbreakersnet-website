// Fork natif TypeScript de Bonjourr : module horloge + date française.
// Rendu visé (affichage_bonjourr.png) : « 22:06 » puis « Mardi 13 octobre ».
// Options reprises de l'original (Bonjourr/src/scripts/features/clock/) :
// - 12h/24h et secondes : clock.ts digital() l.111-147 (h % 12, 0 → 12, fixunits) ;
// - fuseau : shared/time.ts userDate() l.15-59 (repli silencieux si fuseau invalide) ;
// - heures du monde : clock.ts l.32-40 (filtrées sur region, sinon fuseau principal) ;
// - formats de date : date.ts clockDate() l.8-53 (auto/eu/us/cn) ;
// - formules du cadran : clock.ts analog() l.149-153.
import type { DateFormat } from "@/bonjourr/config";

const FR = "fr-FR";

export type ClockOptions = {
  ampm?: boolean;
  seconds?: boolean;
  timezone?: string;
};

export type WorldClockEntry = {
  region: string;
  timezone: string;
};

export type WorldClockTime = {
  region: string;
  time: string;
};

// Liste des fuseaux du panneau (settings.html l.2300-2318 pour les décalages UTC,
// zones IANA courantes pour le reste ; les abréviations HST/PST/… de l'original ne sont
// pas des fuseaux Intl valides → écart assumé, consigné journal-de-bord.md).
export const UTC_OFFSETS = [
  "-10:00",
  "-09:00",
  "-08:00",
  "-07:00",
  "-06:00",
  "-05:00",
  "-04:00",
  "-03:00",
  "+00:00",
  "+01:00",
  "+02:00",
  "+03:00",
  "+05:30",
  "+08:00",
  "+09:00",
  "+10:00",
  "+12:00",
];

export const IANA_TIMEZONES = [
  "Africa/Cairo",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/New_York",
  "America/Sao_Paulo",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Seoul",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Atlantic/Reykjavik",
  "Australia/Sydney",
  "Europe/Berlin",
  "Europe/Lisbon",
  "Europe/London",
  "Europe/Madrid",
  "Europe/Moscow",
  "Europe/Paris",
  "Pacific/Auckland",
  "UTC",
];

// Fixunits de helpers.ts l.5-7 : zéro initial sous 10.
function fixunits(val: number): string {
  return (val < 10 ? "0" : "") + val.toString();
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

// Composantes « murales » de l'instante dans un fuseau (userDate() de l'original,
// rendu par Intl plutôt que par un Date reconstitué) ; fuseau invalide → heure locale.
export function zoneParts(date: Date, timezone?: string): { hour: number; minute: number; second: number } {
  if (!timezone || timezone === "auto") {
    return { hour: date.getHours(), minute: date.getMinutes(), second: date.getSeconds() };
  }

  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hourCycle: "h23",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).formatToParts(date);
    const number = (type: Intl.DateTimeFormatPartTypes) =>
      Number(parts.find((part) => part.type === type)?.value ?? "0");
    return { hour: number("hour"), minute: number("minute"), second: number("second") };
  } catch {
    console.info("Your timezone is not valid");
    return { hour: date.getHours(), minute: date.getMinutes(), second: date.getSeconds() };
  }
}

export function formatClock(date: Date, options: ClockOptions = {}): string {
  const { hour, minute, second } = zoneParts(date, options.timezone);

  let hours: string;
  let ampm = "";

  if (options.ampm) {
    const h12 = hour % 12 === 0 ? 12 : hour % 12;
    hours = h12.toString();
    ampm = hour < 12 ? " AM" : " PM";
  } else {
    hours = fixunits(hour);
  }

  const base = `${hours}:${fixunits(minute)}`;
  return options.seconds ? `${base}:${fixunits(second)}${ampm}` : `${base}${ampm}`;
}

// Degrés des aiguilles, formules de analog() l.151-153 ; l'original passe l'heure du
// fuseau (userDate(timezone)) → le fork accepte le même fuseau que l'horloge digitale.
export function analogAngles(date: Date, timezone?: string): {
  hours: number;
  minutes: number;
  seconds: number;
} {
  const { hour, minute, second } = zoneParts(date, timezone);
  const minutes = (minute + second / 60) * 6;
  const hours = ((hour % 12) + minute / 60) * 30;
  const seconds = second * 6;
  return { hours, minutes, seconds };
}

export function worldClockTimes(
  instant: Date,
  options: {
    ampm: boolean;
    seconds: boolean;
    worldclocks: boolean;
    entries: WorldClockEntry[];
    timezone?: string;
  },
): WorldClockTime[] {
  const clocks: WorldClockEntry[] = options.worldclocks
    ? options.entries.filter(({ region }) => region)
    : [];

  if (clocks.length === 0) {
    clocks.push({ region: "", timezone: options.timezone ?? "auto" });
  }

  return clocks.map(({ region, timezone }) => ({
    region,
    time: formatClock(instant, {
      ampm: options.ampm,
      seconds: options.seconds,
      timezone,
    }),
  }));
}

// Date française, formats auto/eu/us/cn de clockDate() (date.ts l.24-47) :
// le jour de semaine prend la majuscule, le mois reste en minuscule (capture).
export function formatFrenchDate(date: Date, format: DateFormat = "auto", timezone?: string): string {
  const tz = timezone && timezone !== "auto" ? timezone : undefined;

  if (format === "auto") {
    return capitalize(
      new Intl.DateTimeFormat(FR, { timeZone: tz, weekday: "long", day: "numeric", month: "long" }).format(date),
    );
  }

  const weekday = new Intl.DateTimeFormat(FR, { timeZone: tz, weekday: "long" }).format(date);
  const day = new Intl.DateTimeFormat(FR, { timeZone: tz, day: "numeric" }).format(date);
  const month = new Intl.DateTimeFormat(FR, { timeZone: tz, month: "long" }).format(date);

  if (format === "us") {
    return `${capitalize(weekday)} ${month} ${day}`;
  }

  if (format === "cn") {
    return `${month} ${day} ${capitalize(weekday)}`;
  }

  return `${capitalize(weekday)} ${day} ${month}`;
}
