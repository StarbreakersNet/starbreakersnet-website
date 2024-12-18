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

export function renderFontAwesomeIcon(option: { fas?: string; far?: string; fab?: string }) {
  if (option.fas) {
    return h(NIcon, null, () => h(FontAwesomeIcon, { icon: ["fas", option.fas] }));
  } else if (option.far) {
    return h(NIcon, null, () => h(FontAwesomeIcon, { icon: ["far", option.far] }));
  } else if (option.fab) {
    return h(NIcon, null, () => h(FontAwesomeIcon, { icon: ["fab", option.fab] }));
  } else {
    return null;
  }
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
