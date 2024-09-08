export type CarouselAction = {
  label: string;
  icon?: string[];
  routeName?: string;
  externalLink?: string;
  type: "default" | "tertiary" | "primary" | "success" | "info" | "warning" | "error";
}

export type CarouselItem = {
  title: string;
  description?: string;
  style: {
    align: "flex-start" | "center" | "flex-end";
  },
  background?: {
    videoSrc?: string;
    imageSrc?: string;
    color?: string;
    alt: string;
  };
  thumbnail?: {
    src: string;
    alt: string;
  };
  actions?: CarouselAction[];
}

export const carouselListItems: CarouselItem[] = [
  {
    title: "Les Starbreakers",
    description: "Une grande famille ouverte à tous, surtout aux plus marrants !",
    style: {
      align: "center",
    },
    thumbnail: {
      src: "/starbreakers/logo-star.png",
      alt: "Logo des Starbreakers",
    },
    actions: [
      {
        label: "Rejoindre",
        icon: ["fas", "sign-in-alt"],
        externalLink: "https://discord.gg/starbreakers",
        type: "primary",
      },
    ],
  },
  {
    title: "Valorant",
    description: "Prouvez la supériorité de votre expérience avec style dans une compétition mondiale. Alternez les phases d'attaque et de défense, et remportez 13 manches à l'aide de mécaniques de tir précises et de compétences tactiques. Avec une seule vie par manche, vous devrez réfléchir plus vite que votre adversaire pour survivre. Affrontez d'autres joueurs dans les modes Compétition et Non classé, mais aussi en Combat à mort et Spike Rush.",
    style: {
      align: "flex-end",
    },
    background: {
      videoSrc: "https://cmsassets.rgpub.io/sanity/files/dsfx7636/news/409ab2fc369ba5e1fe50bac10c6676d7d1365a9f.mp4",
      alt: "Trailer de Valorant",
    },
    thumbnail: {
      src: "https://cmsassets.rgpub.io/sanity/images/dsfx7636/news/1d62a3751be9d7abfce84da8ca89be7d79f07fed-1232x1232.png",
      alt: "Personnages de Valorant",
    },
    actions: [
      {
        label: "Jouez gratuitement",
        icon: ["fas", "download"],
        externalLink: "https://playvalorant.com/fr-fr/platform-selection/",
        type: "primary",
      },
      {
        label: "En savoir plus",
        icon: ["fas", "external-link-alt"],
        externalLink: "https://playvalorant.com/fr-fr/",
        type: "info",
      },
    ],
  },
  {
    title: "Battlefield 2042",
    description: "Retournez au combat, maintenant ! Emmenez votre meilleure escouade et replongez dans Contrôle, un mode de combat interarmées à 24 contre 24, où votre mission consiste à sécuriser tous les objectifs en rotations et à éliminer tous les adversaires qui se mettent sur votre chemin.",
    style: {
      align: "flex-end",
    },
    background: {
      videoSrc: "https://media.contentapi.ea.com/content/dam/battlefield/battlefield-2042/season-5/homepage/videos/2023/06/bf-2042-s5-mse-section-hero-video-s-xs.webm",
      alt: "Trailer de Battlefield 2042",
    },
    actions: [
      {
        label: "Acheter",
        icon: ["fas", "shopping-cart"],
        externalLink: "https://store.steampowered.com/app/1517290/Battlefield_2042/",
        type: "primary",
      },
      {
        label: "En savoir plus",
        icon: ["fas", "external-link-alt"],
        externalLink: "https://www.ea.com/fr-fr/games/battlefield/battlefield-2042",
        type: "info",
      },
    ],
  },
  {
    title: "League of Legends",
    description: "Un jeu de stratégie en équipe, où chaque joueur incarne un champion aux pouvoirs uniques.",
    style: {
      align: "flex-start",
    },
    background: {
      videoSrc: "/games/lol/lol_trailer.webm",
      alt: "Trailer de League of Legends",
    },
    actions: [
      {
        label: "Rejoindre la faille",
        icon: ["fas", "download"],
        externalLink: "https://www.leagueoflegends.com/fr-fr/download/",
        type: "primary",
      },
      {
        label: "En savoir plus",
        icon: ["fas", "external-link-alt"],
        externalLink: "https://leagueoflegends.com",
        type: "info",
      },
    ],
  },
  {
    title: "GTA Online",
    description: "Un jeu d'action-aventure en monde ouvert, fondez votre empire criminel et devenez le plus grand entrepreneur de Los Santos.",
    style: {
      align: "flex-end",
    },
    background: {
      videoSrc: "/games/gta/gtav_trailer.webm",
      alt: "Trailer de Grand Theft Auto V",
    },
    thumbnail: {
      src: "/games/gta/gta_characters.png",
      alt: "Personnages de GTA Online",
    },
    actions: [
      {
        label: "Acheter",
        icon: ["fas", "shopping-cart"],
        externalLink: "https://store.steampowered.com/app/271590/Grand_Theft_Auto_V/",
        type: "primary",
      },
      {
        label: "En savoir plus",
        icon: ["fas", "external-link-alt"],
        externalLink: "https://www.rockstargames.com/V/",
        type: "info",
      },
    ],
  }
];