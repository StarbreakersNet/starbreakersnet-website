import { marked } from "marked";
import DOMPurify from "dompurify";

// Liens du texte ouverts dans un nouvel onglet, sans accès à la page du site
DOMPurify.addHook("afterSanitizeAttributes", node => {
  if (node.tagName === "A") {
    node.setAttribute("target", "_blank");
    node.setAttribute("rel", "noopener noreferrer");
  }
});

// Markdown saisi par l'utilisateur, converti en HTML nettoyé par DOMPurify (sans script ni
// attribut d'évènement) : seul HTML de ce type à passer par v-html
export function renderMarkdown(source: string): string {
  return DOMPurify.sanitize(marked.parse(source, { async: false, breaks: true, gfm: true }));
}
