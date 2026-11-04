// Fork natif TypeScript de Bonjourr : notes.
// Règles reprises de Bonjourr/src/scripts/features/notes.ts (classes d'alignement
// l.84-87, variables du document l.89-100, gabarit du texte l.102-113), de
// shared/dom.ts l.103-111 (molette de fond) et shared/generic.ts l.14-16 (opacité).
// Écart assumé : l'original confie l'édition à la librairie tierce PocketEditor
// (notes.ts l.6, l.75) ; le fork rend lui-même le sous-ensemble markdown utilisé par
// le gabarit (titres, listes, cases, liens, gras/italique), en HTML échappé.

export type NotesAlign = "left" | "center" | "right";
export type NotesShade = "light" | "dark";

/** Fond par défaut de `handleBackground` (notes.ts l.95). */
export const NOTES_FALLBACK_BACKGROUND = "#fff2";

/** `opacityFromHex` (shared/generic.ts l.14-16) : le 4e caractère est l'alpha. */
export function opacityFromHex(hex: string): number {
  return Number.parseInt(hex.slice(4), 16);
}

/** `hexColorFromSplitRange` (shared/dom.ts l.103-111) : molette 0-15 + nuance. */
export function hexFromSplitRange(opacity: number, shade: NotesShade): string {
  const clamped = Math.max(0, Math.min(15, Math.round(opacity)));
  const color = shade === "dark" ? "#000" : "#fff";
  return color + clamped.toString(16);
}

/** Classe `opaque` de notes.ts l.97 : fond blanc seulement, au-delà de 7. */
export function isOpaqueBackground(hex?: string): boolean {
  if (hex === undefined) return false;
  return hex.includes("#fff") && opacityFromHex(hex) > 7;
}

/** Classes d'alignement de `handleAlign` (notes.ts l.84-87). */
export function alignClasses(align: NotesAlign): string[] {
  if (align === "center") return ["center-align"];
  if (align === "right") return ["right-align"];
  return [];
}

/**
 * Gabarit du texte par défaut de `translateNotesText` (notes.ts l.102-113).
 * Écart assumé : le catalogue de traductions complet arrive à la case 21 ; seules
 * les deux chaînes française et anglaise du gabarit sont embarquées ici, la langue
 * inconnue retombant sur l'anglais comme l'original (l.105-107).
 */
export function notesDefaultText(lang: string): string {
  const french = lang.startsWith("fr");
  const line1 = french ? "Modifiez cette note" : "Edit this note";
  const line2 = french
    ? "Avec des titres markdown, listes, et cases à cocher"
    : "With markdown titles, lists, and checkboxes";
  const line3 = french ? "Plus d'infos sur" : "Learn more on";

  return `## ${line1}!\n\n[ ] ${line2}\n\n[ ] ${line3} https://bonjourr.fr/docs/widgets/notes/`;
}

function escapeHtml(input: string): string {
  return input.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Liens : seuls les schémas usuels sont conservés, `javascript:` serait exécuté.
function safeUrl(url: string): string | null {
  const value = url.trim();
  return /^(https?:|mailto:)/i.test(value) ? value : null;
}

function renderInline(text: string): string {
  let out = escapeHtml(text);

  out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (all, label: string, url: string) => {
    const href = safeUrl(url);
    if (href === null) return all;
    return `<a href="${href}" rel="noreferrer noopener" target="_blank">${label}</a>`;
  });

  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  return out;
}

function renderTaskLine(line: string): string {
  const done = /^\[x\] /i.test(line);
  const content = line.slice(4);
  const box = done ? '<input type="checkbox" checked disabled>' : '<input type="checkbox" disabled>';
  return `<li>${box} ${renderInline(content)}</li>`;
}

/** Rendu markdown du bloc-notes : le texte est échappé avant toute mise en forme. */
export function renderNotesMarkdown(text: string): string {
  const out: string[] = [];

  for (const block of text.replace(/\r\n/g, "\n").split(/\n[ \t]*\n/)) {
    const lines = block.split("\n").filter((line) => line.trim() !== "");
    if (lines.length === 0) continue;

    if (lines.every((line) => /^\[( |x|X)\] /.test(line))) {
      out.push(`<ul class="notes-tasks">${lines.map(renderTaskLine).join("")}</ul>`);
      continue;
    }

    if (lines.every((line) => /^[-*] /.test(line))) {
      out.push(`<ul>${lines.map((line) => `<li>${renderInline(line.slice(2))}</li>`).join("")}</ul>`);
      continue;
    }

    for (const line of lines) {
      const heading = /^(#{1,6}) (.*)$/.exec(line);
      if (heading) {
        const level = heading[1].length;
        out.push(`<h${level}>${renderInline(heading[2])}</h${level}>`);
      } else {
        out.push(`<p>${renderInline(line)}</p>`);
      }
    }
  }

  return out.join("");
}
