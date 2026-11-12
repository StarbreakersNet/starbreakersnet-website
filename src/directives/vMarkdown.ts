import type { Directive } from "vue";
import { renderMarkdown } from "@/lib/markdown";

// Affiche du Markdown saisi par l'utilisateur : <div v-markdown="texte" />.
// Le texte est converti puis nettoyé par DOMPurify (lib/markdown.ts) avant d'entrer dans la page.
// À utiliser à la place de v-html : le nettoyage ne peut pas être oublié, et la règle ESLint
// vue/no-v-html reste active partout ailleurs.
export const vMarkdown: Directive<HTMLElement, string> = {
  mounted(element, { value }) {
    element.innerHTML = renderMarkdown(value);
  },

  updated(element, { value, oldValue }) {
    if (value !== oldValue) {
      element.innerHTML = renderMarkdown(value);
    }
  },
};
