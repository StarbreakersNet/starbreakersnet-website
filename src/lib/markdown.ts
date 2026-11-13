import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "@tiptap/markdown";

// Extensions TipTap du widget Note, communes à l'affichage (MarkdownWidget.vue, en lecture seule)
// et à l'éditeur (NoteEditor.vue) : la note s'affiche exactement comme on l'a écrite.
//
// Pas d'injection possible : le Markdown, et le HTML qu'il contiendrait, est lu selon le schéma
// de l'éditeur. Toute balise ou tout attribut que ces extensions ne déclarent pas est écarté
// (script, iframe, style, onclick…), et un lien dont l'adresse n'est pas http, https, mailto,
// tel… est affiché sans adresse (href vide). Les liens s'ouvrent dans un nouvel onglet, sans
// accès à la page du site (rel="noopener noreferrer nofollow", réglage par défaut de TipTap).
export function markdownExtensions() {
  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
      // Pas de soulignement en Markdown
      underline: false,
      link: { openOnClick: false, autolink: true, defaultProtocol: "https" },
    }),
    // Retour à la ligne simple = saut de ligne
    Markdown.configure({ markedOptions: { breaks: true, gfm: true } }),
  ];
}
