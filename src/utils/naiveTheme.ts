import { darkTheme, lightTheme } from "naive-ui";
import naiveDark from "@/assets/themes/naive.dark";
import naiveLight from "@/assets/themes/naive.light";
import type { ThemeType } from "@/types/User";

type ThemeChoice = ThemeType | "system";

const THEMES = {
  dark: { base: darkTheme, overrides: naiveDark },
  light: { base: lightTheme, overrides: naiveLight },
};

export function getOsTheme(): ThemeType {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function resolveTheme(theme: ThemeChoice): ThemeType {
  return theme === "system" || !theme ? getOsTheme() : theme;
}

export function getNaiveTheme(theme: ThemeChoice) {
  return THEMES[resolveTheme(theme)].base;
}

export function getNaiveOverrideTheme(theme: ThemeChoice) {
  return THEMES[resolveTheme(theme)].overrides;
}
