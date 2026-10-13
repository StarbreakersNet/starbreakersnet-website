export type MenuItem = {
  routeName?: string;
  externalLink?: string;
  label: string;
  icon?: string[];
  color?: string;
  textColor?: string;
};

export const menuItems: MenuItem[] = [
  {
    routeName: "bonjourr",
    label: "Bonjourr",
    icon: ["fas", "home"],
    color: "rgb(100, 221, 187)",
    textColor: "rgb(255, 255, 255)",
  },
  {
    routeName: "discord",
    label: "Discord",
    icon: ["fab", "discord"],
    color: "rgb(88, 101, 242)",
    textColor: "rgb(255, 255, 255)",
  },
  {
    // D-006 (04/11/2026) : l'organisation GitLab n'existe plus ; le bouton
    // mène à l'organisation GitHub, avec son logo (marque FontAwesome free,
    // enregistrée en bloc par library.add(fab) dans main.js) et son noir de
    // marque #181717.
    externalLink: "https://github.com/StarbreakersNet",
    label: "GitHub",
    icon: ["fab", "github"],
    color: "rgb(24, 23, 23)",
    textColor: "rgb(255, 255, 255)",
  },
  {
    routeName: "youtube",
    label: "Le Zap",
    icon: ["fab", "youtube"],
    color: "rgb(255, 0, 0)",
    textColor: "rgb(255, 255, 255)",
  },
];
