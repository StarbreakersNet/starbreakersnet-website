// Fork natif TypeScript de Bonjourr : liens rapides (quick links).
// Modèle et règles repris de Bonjourr/src/scripts/features/links/{index,helpers,groups}.ts
// et de Bonjourr/src/types/{shared,sync}.ts.
// Écart assumé : la liste des liens vit dans `config.links` (tableau), alors que
// l'original stocke chaque lien sous sa propre clé (`sync[link._id]`, index.ts l.582) ;
// le modèle d'objet LinkElem reste identique (types/shared.ts l.77-85).

import type { LinkElem, LinkGroups, LinkIcon } from "@/bonjourr/config";

export type { LinkElem, LinkGroups, LinkIcon, LinkIconType } from "@/bonjourr/config";

/** `API_DOMAIN` de defaults.ts l.13, service de favicons de l'origine. */
export const API_DOMAIN = "https://services.bonjourr.fr";

/** Icône de repli quand le favicon ne charge pas (index.ts l.345, l.354). */
export const ICON_FALLBACK = `${API_DOMAIN}/favicon/blob/error`;

/** État combiné : l'original manipule liens et groupes ensemble (groups.ts l.135-207). */
export type LinksState = { links: LinkElem[]; linkgroups: LinkGroups };

const RANDOM_CHARS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

// stringMaxSize (shared/generic.ts) : troncature simple, sans ellipse.
function stringMaxSize(input: string, max: number): string {
  return input.slice(0, max);
}

// randomString (shared/generic.ts) : l'original s'en sert pour les _id (index.ts l.864).
export function randomString(length: number): string {
  let output = "";

  for (let i = 0; i < length; i++) {
    output += RANDOM_CHARS[Math.floor(Math.random() * RANDOM_CHARS.length)];
  }

  return output;
}

/**
 * Préfixage d'URL de `validateLink` (index.ts l.855-868) : pages de config du
 * navigateur en « # », localhost en http, sinon https si l'utilisateur n'a rien mis.
 */
export function normalizeUrl(url: string): string {
  const startsWithEither = (prefixes: string[]) => prefixes.some((p) => url.startsWith(p));
  const isConfig = startsWithEither(["about:", "chrome://", "edge://"]);
  const isLocalhost = url.startsWith("localhost") || url.startsWith("127.0.0.1");
  const noProtocol = !startsWithEither(["https://", "http://"]);
  const prefix = isConfig ? "#" : isLocalhost ? "http://" : noProtocol ? "https://" : "";
  return prefix + stringMaxSize(url, 512);
}

/** `validateLink` (index.ts l.854-870). */
export function validateLink(title: string, url: string, parent?: string): LinkElem {
  return {
    _id: `links${randomString(6)}`,
    ...(parent === undefined ? {} : { parent }),
    order: Date.now(),
    title: stringMaxSize(title, 64),
    url: normalizeUrl(url),
  };
}

/** Titre de repli de `createTitle` (helpers.ts l.49) : hostname sans « www. ». */
export function titleFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return "";
  }
}

/** `getDefaultIcon` (helpers.ts l.8-14). */
export function defaultIcon(url: string, refresh?: number): string {
  return refresh ? `${API_DOMAIN}/favicon/blob/${url}?r=${refresh}` : `${API_DOMAIN}/favicon/blob/${url}`;
}

/** `getIconFromLinkElem` (index.ts l.904-919). */
export function iconFor(link: LinkElem & { icon?: LinkIcon }): string {
  if (!link.icon?.value) {
    try {
      const { origin, pathname } = new URL(link.url);
      return defaultIcon(origin + pathname);
    } catch {
      return defaultIcon(link.url);
    }
  }

  if (link.icon.type === "file") {
    return link._id;
  }

  return link.icon.value;
}

// Ordre d'ajout : l'original utilise `Date.now()` (index.ts l.866) pour arriver en
// dernier. Deux ajouts dans la même milliseconde se suivent donc, ce qui garantit
// l'ordre d'affichage sans contredire la source.
function nextOrder(links: LinkElem[]): number {
  const highest = links.reduce((max, l) => Math.max(max, l.order), 0);
  return Math.max(Date.now(), highest + 1);
}

export type NewLink = { title: string; url: string; parent?: string };

export function addLink(links: LinkElem[], input: NewLink): LinkElem[] {
  const created = validateLink(input.title, input.url, input.parent ?? "default");
  return [...links, { ...created, order: nextOrder(links) }];
}

export function updateLink(
  links: LinkElem[],
  id: string,
  patch: { title?: string; url?: string; icon?: LinkIcon },
): LinkElem[] {
  return links.map((link) => {
    if (link._id !== id) return link;
    return {
      ...link,
      ...(patch.title === undefined ? {} : { title: stringMaxSize(patch.title, 64) }),
      ...(patch.url === undefined ? {} : { url: normalizeUrl(patch.url) }),
      ...(patch.icon === undefined ? {} : { icon: patch.icon }),
    };
  });
}

/** Suppression multiple, comme `deleteLinks` (index.ts), qui retire les clés concernées. */
export function deleteLinks(links: LinkElem[], ids: string[]): LinkElem[] {
  return links.filter((link) => !ids.includes(link._id));
}

/**
 * Déplacement puis réindexation de l'ordre (correctLinksOrder, index.ts l.879-899 :
 * `link.order = i`).
 */
export function moveLink(links: LinkElem[], id: string, toIndex: number): LinkElem[] {
  const moved = links.filter((link) => link._id === id);
  const rest = links.filter((link) => link._id !== id);

  if (moved.length === 0) return links;

  const index = Math.max(0, Math.min(toIndex, rest.length));
  const reordered = [...rest.slice(0, index), ...moved, ...rest.slice(index)];
  return reordered.map((link, i) => ({ ...link, order: i }));
}

/** `getLinksInGroup` (helpers.ts l.70-83) : filtre sur `parent`, trie par `order`. */
export function linksInGroup(links: LinkElem[], group: string): LinkElem[] {
  return links.filter((link) => (link.parent ?? 0) === group).sort((a, b) => a.order - b.order);
}

/** `toggleGroups` (groups.ts l.129-133). */
export function toggleGroups(state: LinksState, on: boolean): LinksState {
  return { ...state, linkgroups: { ...state.linkgroups, on } };
}

/** Sélection d'un groupe (changeGroup, groups.ts l.72-127, côté données seulement). */
export function selectGroup(state: LinksState, group: string): LinksState {
  if (!state.linkgroups.groups.includes(group)) return state;
  return { ...state, linkgroups: { ...state.linkgroups, selected: group } };
}

/** `addGroup` (groups.ts l.151-178) : noms réservés « default » et « » refusés ; le titre vide est refusé de la même façon. */
export function addGroup(state: LinksState, title: string): LinksState {
  const { groups } = state.linkgroups;
  const isReserved = title === "default" || title === "+" || title === "";
  const isAlreadyUsed = groups.includes(title);

  if (isReserved || isAlreadyUsed) return state;

  const links = state.links.map((link) =>
    link.parent === "+" ? { ...link, parent: title } : link,
  );

  return {
    links,
    linkgroups: {
      ...state.linkgroups,
      groups: [...groups, title],
      selected: title,
    },
  };
}

/** `changeGroupTitle` (groups.ts l.135-149). */
export function renameGroup(state: LinksState, oldTitle: string, newTitle: string): LinksState {
  const { groups, selected } = state.linkgroups;
  const index = groups.indexOf(oldTitle);

  if (index === -1 || newTitle === "") return state;

  return {
    links: state.links.map((link) => (link.parent === oldTitle ? { ...link, parent: newTitle } : link)),
    linkgroups: {
      ...state.linkgroups,
      groups: groups.map((group, i) => (i === index ? newTitle : group)),
      selected: selected === oldTitle ? newTitle : selected,
    },
  };
}

/** `deleteGroup` (groups.ts l.180-207) : le dernier groupe est indestructible. */
export function deleteGroup(state: LinksState, group: string): LinksState {
  const { groups, pinned, synced, selected } = state.linkgroups;
  const isBroken = groups.indexOf(group) === -1;
  const isMinimum = groups.length === 1;

  if (isMinimum || isBroken) return state;

  return {
    links: state.links.filter((link) => (link.parent ?? 0) !== group),
    linkgroups: {
      ...state.linkgroups,
      selected: group === selected || pinned.includes(group) ? groups[0] : selected,
      pinned: groups.length === 2 ? [] : pinned.filter((name) => name !== group),
      synced: synced.filter((name) => name !== group),
      groups: groups.filter((name) => name !== group),
    },
  };
}
