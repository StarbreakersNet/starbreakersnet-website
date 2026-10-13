import { describe, expect, it } from "vitest";
import { greeting } from "@/bonjourr/greeting";

describe("greeting (spec affichage_bonjourr.png : « Bonsoir » à 22h)", () => {
  it("dit Bonsoir le soir, comme sur la capture à 22:06", () => {
    expect(greeting(new Date(2026, 9, 13, 22, 6))).toBe("Bonsoir");
  });

  it("couvre les bornes des créneaux (parité avec greetings.ts de l'original : 0-3 = soir)", () => {
    expect(greeting(new Date(2026, 9, 13, 0, 0))).toBe("Bonsoir");
    expect(greeting(new Date(2026, 9, 13, 3, 0))).toBe("Bonne nuit");
    expect(greeting(new Date(2026, 9, 13, 4, 59))).toBe("Bonne nuit");
    expect(greeting(new Date(2026, 9, 13, 5, 0))).toBe("Bonjour");
    expect(greeting(new Date(2026, 9, 13, 12, 0))).toBe("Bonjour");
    expect(greeting(new Date(2026, 9, 13, 17, 59))).toBe("Bonjour");
    expect(greeting(new Date(2026, 9, 13, 18, 0))).toBe("Bonsoir");
    expect(greeting(new Date(2026, 9, 13, 23, 59))).toBe("Bonsoir");
  });
});
