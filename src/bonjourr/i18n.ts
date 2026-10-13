// i18n FR/EN du fork (case 21). La source Bonjourr ne traduit qu'en clés
// anglaises -> valeurs localisées (_locales/fr/translations.json) ; l'anglais
// EST donc la clé. `en-from-fr.json`, généré depuis ce fichier, donne la valeur
// anglaise de chaque libellé français ; FORK_SPECIFIC_EN complète avec les
// libellés propres au fork, absents de la source. `translate` est la version
// bicouche de `trads()` (src/scripts/utils/i18n.ts) : fr = clé telle quelle.
import enFromFr from "./locales/en-from-fr.json";

const FORK_SPECIFIC_EN: Record<string, string> = {
  "Réglages Bonjourr": "Bonjourr settings",
  Apparence: "Appearance",
  Fonds: "Backgrounds",
  Horloge: "Clock",
  Météo: "Weather",
  "Liens rapides": "Quick links",
  Citations: "Quotes",
  Données: "Data",
  "À propos": "About",
  "Prénom de salutation": "Greeting name",
  "Mode de salutation": "Greeting mode",
  "Les fichiers locaux ne sont pas disponibles dans le fork.":
    "Local files are not available in this fork.",
  "Écouter l'alarme": "Listen to alarm",
  "Appliquer la police": "Apply font",
  "Couper le son des vidéos": "Mute videos",
  "Heure sur 12 h": "12-hour time",
  "Cadran analogique": "Analog clock",
  "Forme du cadran": "Clock face shape",
  "Chiffres du cadran": "Clock face numbers",
  Aiguilles: "Clock hands",
  "Heures du monde": "World clocks",
  "Ajouter une ville": "Add a city",
  Prénom: "Your name",
  "Source des données": "Data source",
  "Afficher l’unité": "Show unit",
  Moteur: "Search engine",
  Placeholder: "Placeholder",
  "Requête (%s)": "Query (%s)",
  "Titre du nouveau lien": "New link title",
  "URL du nouveau lien": "New link URL",
  "Arrondi de l’icône": "Icon radius",
  "Afficher l’arrière-plan des liens": "Show link background",
  "Clic droit sur la grille pour ajouter un lien, clic droit sur un lien ou un groupe pour le modifier.":
    "Right-click the grid to add a link, right-click a link or a group to edit it.",
  Nuance: "Tint",
  Claire: "Light",
  Sombre: "Dark",
  "Toujours afficher l’auteur": "Always show author",
  Valider: "Confirm",
  Démarrer: "Start",
  "Lancer la recherche": "Submit search",
  "Écris directement sur la page : titres « # », listes « - », cases « [ ] », gras « ** », lien « [texte](url) ».":
    "Write directly on the page: headings with “#”, lists with “-”, checkboxes with “[ ]”, bold with “**”, links with “[text](url)”.",
  "Enregistrer les réglages": "Save settings",
  "Réinitialiser les réglages": "Reset settings",
  "Exporter la configuration": "Export configuration",
  "Importer un fichier de configuration": "Import configuration file",
  "Copier la configuration": "Copy configuration",
  "Appliquer la configuration saisie": "Apply pasted configuration",
  "Fonctionne hors ligne, aucune requête réseau.":
    "Works offline, no network request.",
};

export const TRANSLATIONS_EN: Record<string, string> = {
  ...(enFromFr as Record<string, string>),
  ...FORK_SPECIFIC_EN,
};

/** `trads()` (i18n.ts) restreint à fr (langue par défaut) et en. */
export function translate(lang: string, key: string): string {
  if (lang.startsWith("en")) {
    return TRANSLATIONS_EN[key] ?? key;
  }
  return key;
}
