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
    color: "rgb(126, 216, 178)",
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
    label: "GitLab",
    externalLink: "https://gitlab.com/starbreakersdevteam",
    icon: ["fab", "gitlab"],
    color: "rgb(226, 67, 41)",
  },
  {
    routeName: "youtube",
    label: "Le Zap",
    icon: ["fab", "youtube"],
    color: "rgb(255, 0, 0)",
    textColor: "rgb(255, 255, 255)",
  },
];
