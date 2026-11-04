// Case 20 — Visuel & onglet. Fonctions pures (thème, variables de police, de
// page, d'ombre, CSS, titre, favicon, masquage) + application au document,
// d'après Bonjourr/src/scripts/features/others.ts, features/fonts.ts,
// features/css.ts, features/hide.ts et shared/generic.ts. Les écritures DOM
// reçoivent le document en paramètre pour rester testables.

import { minutator, SUNTIME, type Suntime } from "./time";
import type { BonjourrConfig, DarkMode } from "./config";

/** `stringMaxSize(val, 80)` (others.ts l.42) et `maxlength="80"` (settings.html l.89). */
export const TABTITLE_MAX = 80;
/** `stringMaxSize(value, 8080)` (css.ts l.11, l.43). */
export const CSS_MAX = 8080;
/** `maxlength="2"` du champ favicon (settings.html l.77). */
export const FAVICON_MAX = 2;
/** Largeur, écart et ombre par défaut (defaults.ts l.110-116). */
export const PAGE_WIDTH_DEFAULT = 1600;
export const PAGE_GAP_DEFAULT = 1;
export const TEXT_SHADOW_DEFAULT = 0.2;
/** Repli du favicon maison, équivalent de `/src/assets/favicons/favicon.ico` (others.ts l.14). */
export const FAVICON_FALLBACK = "/icon.svg";

export type Theme = "light" | "dark";

/** Liste de graisses d'une police système (fonts.ts l.34-44). */
export type SystemFont = { placeholder: string; weights: string[] };

/** Clés de masquage, telles que `data-hide="..."` (index.html l.476-680, hide.ts l.18-22). */
export type HideEntries = Partial<Record<keyof BonjourrConfig["hide"], boolean>>;

/** `stringMaxSize` (shared/generic.ts l.1-3). */
export function stringMaxSize(str: string, size: number): string {
  return str.length > size ? str.slice(0, size) : str;
}

/** `hexToRGB` (shared/generic.ts l.22-28). */
export function hexToRGB(hex: string): { r: number; g: number; b: number } {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  return { r, g, b };
}

/**
 * `systemfont` (fonts.ts l.34-60) : la source choisit la liste selon SYSTEM_OS ;
 * le fork lit le `userAgent` du navigateur et retombe sur la liste linux, comme
 * la source quand l'OS n'est ni windows, android, mac ni ios.
 */
export function systemFontFor(userAgent = ""): SystemFont {
  if (/Windows/i.test(userAgent)) {
    return { placeholder: "Segoe UI", weights: ["300", "400", "600", "700", "800"] };
  }
  if (/Android/i.test(userAgent)) {
    return { placeholder: "Roboto", weights: ["100", "300", "400", "500", "700", "900"] };
  }
  if (/Mac|iPhone|iPad/i.test(userAgent)) {
    return {
      placeholder: "SF Pro Display",
      weights: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
    };
  }
  return {
    placeholder: "Fira Sans",
    weights: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  };
}

/**
 * `darkmode` (others.ts l.74-115) : « disable » -> light, « enable » -> dark,
 * « system » -> prefers-color-scheme, « auto » -> la nuit, c'est-à-dire avant le
 * lever ou après le coucher (l.95-97, shared/time.ts l.9-10 pour 07 h et 22 h).
 */
export function themeFor(
  dark: DarkMode,
  {
    now = new Date(),
    sun = SUNTIME,
    prefersDark = false,
  }: { now?: Date; sun?: Suntime; prefersDark?: boolean } = {},
): Theme {
  switch (dark) {
    case "disable":
      return "light";
    case "enable":
      return "dark";
    case "system":
      return prefersDark ? "dark" : "light";
    default: {
      const minutes = minutator(now);
      return minutes <= sun.rise || minutes > sun.set ? "dark" : "light";
    }
  }
}

/**
 * `pageControl` (others.ts l.53-71) : `--page-width` en px, `--page-gap` en em.
 * La largeur n'est écrite que si elle est vraie, l'écart dès que c'est un nombre
 * (donc `0` est écrit, `undefined` non).
 */
export function pageVarsFor(val: { width?: number; gap?: number }): Record<string, string> {
  const vars: Record<string, string> = {};

  if (val.width) {
    vars["--page-width"] = `${val.width ?? PAGE_WIDTH_DEFAULT}px`;
  }

  if (typeof val.gap === "number") {
    vars["--page-gap"] = `${val.gap ?? PAGE_GAP_DEFAULT}em`;
  }

  return vars;
}

/** `textShadow` (others.ts l.123-130) : `--text-shadow-alpha`, 0.2 par défaut. */
export function textShadowVarFor(val?: number): Record<string, string> {
  return { "--text-shadow-alpha": (val ?? TEXT_SHADOW_DEFAULT).toString() };
}

/**
 * `displayFont`/`setFontSize`/`setFontColor` (fonts.ts l.227-267). L'horloge de
 * la source prend une graise de moins quand la famille reste système (l.228-231),
 * et la taille est convertie en `em` sur une base de 16 px (l.260).
 */
export function fontVarsFor(
  font: BonjourrConfig["font"],
  system: SystemFont = systemFontFor(),
): Record<string, string | null> {
  const weight = font.weight;
  const clockWeight =
    Number.parseInt(weight) > 100 ? system.weights[system.weights.indexOf(weight) - 1] : weight;

  return {
    "--font-family": font.family ? `"${font.family}"` : null,
    "--font-weight": weight,
    "--font-weight-clock": font.family ? weight : clockWeight,
    "--font-size": `${Number.parseInt(font.size) / 16}em`,
    "--font-color": rgbFor(font.color),
  };
}

/** `rgbColor.r, rgbColor.g, rgbColor.b` consommé par `rgb(var(--font-color))` (fonts.ts l.263-267). */
export function rgbFor(color: string): string {
  const { r, g, b } = hexToRGB(color);
  return `${r}, ${g}, ${b}`;
}

/**
 * Règle `@font-face` de Fontsource (fonts.ts l.236-245), famille en minuscules
 * et espaces remplacés par des tirets (l.233). L'URL est d'abord écrite en
 * « latin » ; un sous-jeu différent ajoute une copie de la règle où ce premier
 * « latin » est remplacé (l.243-245), donc les deux règles restent dans le texte.
 */
export function fontFaceFor(family: string, weight: string, subset = "latin"): string {
  const id = family.toLocaleLowerCase().replaceAll(" ", "-");
  let fontface = `
      @font-face {font-family: "${family}";
        src: url(https://cdn.jsdelivr.net/fontsource/fonts/${id}@latest/latin-${weight}-normal.woff2) format('woff2');
      }
    `;

  if (subset !== "latin") {
    fontface += fontface.replace("latin", subset);
  }

  return fontface;
}

/** `customCss` écrit dans `style#styles`, tronqué (css.ts l.11, l.20). */
export function customCssFor(val: string): string {
  return stringMaxSize(val ?? "", CSS_MAX);
}

/**
 * `tabTitle` (others.ts l.39-51) : 80 caractères max, sinon le libellé de
 * l'onglet neuf — « Nouvel onglet » en français (_locales/fr/translations.json l.3).
 */
export function tabTitleFor(val: string, lang = "fr"): string {
  return stringMaxSize(val ?? "", TABTITLE_MAX) || (lang.startsWith("fr") ? "Nouvel onglet" : "New tab");
}

/**
 * `favicon` (others.ts l.9-37) : l'original n'accepte qu'un emoji ou un glyphe
 * U+25A0-U+25FF, refusé dès qu'il reste une lettre ou un chiffre (l.27), et le
 * convertit en SVG data-URI (l.11-13). Écart assumé, demandé par le PLAN :
 * le fork accepte aussi une URL http(s) explicite.
 */
export function faviconHrefFor(val: string): { kind: "emoji" | "url" | "default"; href: string } {
  const value = val ?? "";

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return { kind: "url", href: value };
  }

  const isEmojiOrShape = value.match(/[\p{Emoji}\u25A0-\u25FF]/gu) && !value.match(/[0-9a-z]/g);

  if (!isEmojiOrShape) {
    return { kind: "default", href: FAVICON_FALLBACK };
  }

  const svgtext = `<text y=".9em" font-size="85">${value}</text>`;
  const svgtag = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${svgtext}</svg>`;

  return { kind: "emoji", href: `data:image/svg+xml,${svgtag}` };
}

/** `Object.entries(hide)` (hide.ts l.18). */
export function hideEntriesFor(hide: HideEntries): [string, boolean][] {
  return Object.entries(hide ?? {}).map(([key, val]) => [key, Boolean(val)]);
}

/**
 * `hideElements` (hide.ts l.18-22) : la classe `he_hidden` est posée sur chaque
 * élément portant `data-hide="<clé>"` ; la règle `body .he_hidden { display: none }`
 * vit dans le style non scopé du composant (_global.css l.234-238).
 */
export function hideElements(hide: HideEntries, doc: Document = document): void {
  for (const [key, val] of hideEntriesFor(hide)) {
    for (const element of doc.querySelectorAll(`[data-hide="${key}"]`)) {
      element.classList.toggle("he_hidden", val);
    }
  }
}

/** Écrire (ou retirer si `null`) une variable sur un élément. */
export function setVars(target: HTMLElement, vars: Record<string, string | null>): void {
  for (const [name, value] of Object.entries(vars)) {
    if (value === null || value === undefined) {
      target.style.removeProperty(name);
    } else {
      target.style.setProperty(name, value);
    }
  }
}

function ensureElement<K extends keyof HTMLElementTagNameMap>(
  doc: Document,
  tag: K,
  id: string,
  attrs: Record<string, string>,
): HTMLElementTagNameMap[K] {
  const existing = doc.getElementById(id) as HTMLElementTagNameMap[K] | null;

  if (existing) {
    return existing;
  }

  const created = doc.createElement(tag);
  created.id = id;

  for (const [name, value] of Object.entries(attrs)) {
    created.setAttribute(name, value);
  }

  doc.head.append(created);

  return created;
}

/** Options d'application, injectables pour les tests. */
export type VisualsOptions = {
  doc?: Document;
  now?: Date;
  sun?: Suntime;
  prefersDark?: boolean;
  userAgent?: string;
};

/**
 * Applique tous les réglages visuels au document : thème, variables de page,
 * d'ombre et de police, `@font-face`, CSS personnalisé, titre d'onglet, favicon
 * et classes de masquage. Écart assumé : la source met le CSS dans `style#styles`
 * déjà présent dans sa page (css.ts l.7), le fork le crée à la demande.
 */
export function applyVisuals(config: BonjourrConfig, options: VisualsOptions = {}): void {
  const { doc = document, now = new Date(), sun = SUNTIME, prefersDark = false, userAgent = "" } = options;
  const rootEl = doc.documentElement;

  rootEl.dataset.theme = themeFor(config.dark, { now, sun, prefersDark });

  setVars(rootEl, {
    ...pageVarsFor({ width: config.pagewidth, gap: config.pagegap }),
    ...textShadowVarFor(config.textShadow),
    ...fontVarsFor(config.font, systemFontFor(userAgent)),
  });

  const styles = ensureElement(doc, "style", "styles", {});
  styles.textContent = customCssFor(config.css);

  const fontface = ensureElement(doc, "style", "fontface", {});
  fontface.textContent =
    config.font.family && !config.font.system ? fontFaceFor(config.font.family, config.font.weight) : "";

  const title = tabTitleFor(config.tabtitle, config.lang);
  if (doc.title !== title) {
    doc.title = title;
  }

  const favicon = ensureElement(doc, "link", "favicon", { rel: "icon" });
  favicon.setAttribute("href", faviconHrefFor(config.favicon).href);

  hideElements(config.hide, doc);
}

/** État du document avant que le fork Bonjourr n'y touche (titre, favicon, styles du site). */
export type VisualsState = {
  title: string;
  theme: string | null;
  blurred: boolean;
  styles: string | null;
  fontface: string | null;
  favicon: string | null;
};

/**
 * Photographie ce que `applyVisuals` va modifier dans le document, pour que
 * `revertVisuals` le rende. Dans le navigateur d'onglet d'origine, le fork est
 * seul maître à bord et n'a jamais à rendre quoi que ce soit ; intégré au site
 * (demande du 26/10), il quitte les lieux en laissant le site tel quel : titre
 * « StarbreakersNet », favicon du site, sans CSS personnalisé injecté.
 */
export function captureVisuals(doc: Document = document): VisualsState {
  const textOf = (id: string) => doc.getElementById(id)?.textContent ?? null;
  const favicon = doc.getElementById("favicon") as HTMLLinkElement | null;

  return {
    title: doc.title,
    theme: doc.documentElement.dataset.theme ?? null,
    blurred: doc.body.classList.contains("blurred"),
    styles: textOf("styles"),
    fontface: textOf("fontface"),
    favicon: favicon?.getAttribute("href") ?? null,
  };
}

/** Rend l'état photographié par `captureVisuals` (supprime ce qui a été créé). */
export function revertVisuals(state: VisualsState, doc: Document = document): void {
  doc.title = state.title;

  if (state.theme === null) {
    delete doc.documentElement.dataset.theme;
  } else {
    doc.documentElement.dataset.theme = state.theme;
  }

  doc.body.classList.toggle("blurred", state.blurred);

  const restore = (id: string, value: string | null, attribute?: string) => {
    const el = doc.getElementById(id);

    if (!el) {
      return;
    }

    if (value === null) {
      el.remove();
      return;
    }

    if (attribute) {
      el.setAttribute(attribute, value);
    } else {
      el.textContent = value;
    }
  };

  restore("styles", state.styles);
  restore("fontface", state.fontface);
  restore("favicon", state.favicon, "href");
}
