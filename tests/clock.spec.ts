import { describe, expect, it } from "vitest";
import { formatClock, formatFrenchDate } from "@/bonjourr/clock";

describe("formatClock (spec affichage_bonjourr.png : « 22:06 »)", () => {
  it("affiche heures et minutes sur deux chiffres, en 24h", () => {
    expect(formatClock(new Date(2026, 9, 13, 22, 6))).toBe("22:06");
    expect(formatClock(new Date(2026, 9, 13, 9, 5))).toBe("09:05");
    expect(formatClock(new Date(2026, 9, 13, 0, 0))).toBe("00:00");
    expect(formatClock(new Date(2026, 9, 13, 23, 59))).toBe("23:59");
  });
});

describe("formatFrenchDate (spec : « Mardi 13 octobre »)", () => {
  it("formate en français avec jour de semaine majuscule", () => {
    expect(formatFrenchDate(new Date(2026, 9, 13, 22, 6))).toBe("Mardi 13 octobre");
    expect(formatFrenchDate(new Date(2026, 11, 25))).toBe("Vendredi 25 décembre");
    expect(formatFrenchDate(new Date(2027, 0, 1))).toBe("Vendredi 1 janvier");
  });
});
