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
    externalLink: "https://github.com/StarbreakersNet",
    label: "GitHub",
    icon: ["fab", "github"],
    color: "rgb(36, 41, 47)",
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
