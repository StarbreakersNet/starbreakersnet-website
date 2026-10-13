// Fork natif TypeScript de Bonjourr : salutation selon l'heure.
// Créneaux et mots repris de Bonjourr/src/scripts/features/clock/greetings.ts l.22-47
// (0-3 soir, 3-5 nuit, 5-12 matin, 12-18 après-midi, 18-24 soir) et de la traduction fr
// (Bonjourr/_locales/fr/translations.json l.8-12) : matin et après-midi = « Bonjour »,
// soir = « Bonsoir », nuit = « Bonne nuit ». Rendu visé (affichage_bonjourr.png) :
// « Bonsoir » à 22:06. Écart assumé : la variante aléatique « Sweet dreams »
// (1 chance sur 5 chez l'original) n'est pas portée → journal-de-bord.md.

export type GreetingPeriod = "morning" | "afternoon" | "evening" | "night";

export type CustomGreetings = {
  morning: string;
  afternoon: string;
  evening: string;
  night: string;
};

export type GreetingOptions = {
  name?: string;
  mode: "auto" | "custom";
  custom?: CustomGreetings;
};

const FRENCH_GREETINGS: Record<GreetingPeriod, string> = {
  morning: "Bonjour",
  afternoon: "Bonjour",
  evening: "Bonsoir",
  night: "Bonne nuit",
};

export function greetingPeriod(date: Date): GreetingPeriod {
  const hour = date.getHours();

  if (hour < 3) return "evening";
  if (hour < 5) return "night";
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}

export function greeting(date: Date): string {
  return FRENCH_GREETINGS[greetingPeriod(date)];
}

export function selectGreeting(date: Date, options: GreetingOptions): string {
  const period = greetingPeriod(date);
  const name = options.name ?? "";
  const custom = options.custom?.[period];

  if (options.mode === "custom" && custom) {
    return name ? custom.replace("$name", name) : custom;
  }

  const greet = FRENCH_GREETINGS[period];
  return name ? `${greet}, ${name}` : greet;
}
