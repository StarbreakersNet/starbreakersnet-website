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
    label: "GitLab",
    externalLink: "https://gitlab.com/starbreakersdevteam/sb-hardware-monitor",
    icon: ["fab", "gitlab"],
    color: "rgb(226, 67, 41)",
  },
  {
    routeName: "discord",
    label: "Discord",
    icon: ["fab", "discord"],
    color: "rgb(88, 101, 242)",
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
