import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { darkTheme, lightTheme, NIcon } from "naive-ui";
import { h } from "vue";
import { naiveDark, naiveLight } from "@/assets/themes/naiveTheme";

type themeType = "dark" | "light" | "system";
type themeNaiveType = "naive" | "naiveOverride";

const themeMappings = {
  dark: { naive: naiveDark, naiveOverride: darkTheme },
  light: { naive: naiveLight, naiveOverride: lightTheme },
};

export function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function preferedOsTheme() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function getTheme(theme: themeType, type: themeNaiveType) {
  const osTheme = preferedOsTheme();

  if (theme === "system" || !theme) {
    theme = osTheme;
  }

  return themeMappings[theme][type] ?? themeMappings.dark[type];
}

export function getNaiveTheme(theme: themeType) {
  return getTheme(theme, "naiveOverride");
}

export function getNaiveOverrideTheme(theme: themeType) {
  return getTheme(theme, "naive");
}
