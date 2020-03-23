import { Injectable } from '@angular/core';
import {NotificationService} from '../notification/notification.service';

declare var $: any;

@Injectable({
  providedIn: 'root'
})
export class ApplicationBrowserService {

  APP_ONE = 'discord';
  APP_TWO = 'community';
  APP_THREE = 'youtube';

  navElements = [
    {
      name: 'Accueil',
      src: '/assets/images/applications/starbreakersnet/logo.png',
      color: '#9A0310'
    },
    {
      name: 'Onset',
      src: '/assets/images/applications/games/onset/icon_onset.png',
      color: '#1D1D1D'
    },
    {
      name: 'Battlefield V',
      src: '/assets/images/applications/games/bfv/icon_bfv.png',
      color: '#E68C33'
    },
    {
      name: 'Heroes of the Storm',
      src: '/assets/images/applications/games/hots/icon_heroes.png',
      color: '#393766'
    },
    {
      name: 'World of Warcraft',
      src: '/assets/images/applications/games/wow/icon_wow.png',
      color: '#382314'
    },
    {
      name: 'Grand Theft Auto Online',
      src: '/assets/images/applications/games/gtav/icon_gtav.png',
      color: '#DAE5D6'
    },
    {
      name: 'League of Legends',
      src: '/assets/images/applications/games/lol/icon_lol.png',
      color: '#1C3747'
    },
    {
      name: 'Counter Striker: GO',
      src: '/assets/images/applications/games/csgo/icon_csgo.png',
      color: '#FFA200'
    },
    {
      name: 'Minecraft',
      src: '/assets/images/applications/games/minecraft/icon_minecraft.png',
      color: '#9BB490'
    },
  ];
  appElements = [
    {
      name: this.APP_ONE,
      logo: [
        {
          src: 'assets/images/applications/discord/discord-logo-white.svg',
          scale: '0.7'
        }
      ],
      color: '#7289DA'
    },
    {
      name: this.APP_TWO,
      logo: [
        {
          src: 'assets/images/applications/community/community-icon-b.png',
          scale: '0.9'
        },
        {
          src: 'assets/images/applications/community/community-icon-a.png',
          scale: '0.9'
        }
      ],
      color: '#2980B9'
    },
    {
      name: this.APP_THREE,
      logo: [
        {
          src: 'assets/images/applications/youtube/yt_logo_rgb_dark.png',
          scale: '0.6'
        }
      ],
      color: '#282828'
    },
  ];

  constructor(public notification: NotificationService) { }

  openApplication(applicationName: string) {
    if (this.isFeatureAvaible(applicationName)) {
      this.showApp(applicationName);
    }
  }

  isFeatureAvaible(featureName) {
    // TODO: Les valeurs des return pourraient être stoqués en bdd pour être administrable
    switch (featureName) {
      case this.APP_ONE:
        return true;
      case this.APP_TWO:
        NotificationService.featureComing();
        return false;
      case this.APP_THREE:
        return true;
      default:
        NotificationService.featureComing();
        return false;
    }
  }

  showApp(applicationName) {
    switch (applicationName) {
      case this.APP_ONE:
        $('.modal' + '.' + this.APP_ONE)
          .modal('show');
        break;
      case this.APP_TWO:
        $('.modal' + '.' + this.APP_TWO)
          .modal('show');
        break;
      case this.APP_THREE:
        NotificationService.notify('Youtube works !');
        break;
      default:
        break;
    }
  }
}
