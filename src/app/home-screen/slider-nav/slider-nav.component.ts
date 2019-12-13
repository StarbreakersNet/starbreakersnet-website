import {Component, AfterViewInit} from '@angular/core';
import VanillaTilt from 'vanilla-tilt';

@Component({
  selector: 'app-slider-nav',
  templateUrl: './slider-nav.component.html',
  styleUrls: ['./slider-nav.component.sass']
})

export class SliderNavComponent implements AfterViewInit {

  navElements = [
    {
      name: 'Accueil',
      src: '/assets/images/applications/starbreakersnet/logo.png',
      color: '#9A0310'
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
      name: 'League of Legends',
      src: '/assets/images/applications/games/lol/icon_lol.png',
      color: '#1C3747'
    },
    {
      name: 'Grand Theft Auto Online',
      src: '/assets/images/applications/games/gtav/icon_gtav.png',
      color: '#DAE5D6'
    },
    {
      name: 'Counter Striker: GO',
      src: '/assets/images/applications/games/csgo/icon_csgo.png',
      color: '#FFA200'
    },
  ];
  appElements = [
    {
      name: 'TeamSpeak',
      logo: [
        {
          src: 'assets/images/applications/teamspeak/ts_stacked_bluelight.png',
          scale: '0.7'
        }
      ],
      color: '#1C2537'
    },
    {
      name: 'StarbreakersNet',
      logo: [
        {
          src: 'assets/images/applications/starbreakersnet/logo-circle.png',
          scale: '0.9'
        },
        {
          src: 'assets/images/applications/starbreakersnet/logo.png',
          scale: '0.9'
        }
      ],
      color: '#282828'
    },
    {
      name: 'Youtube',
      logo: [
        {
          src: 'assets/images/applications/youtube/yt_icon_rgb.png',
          scale: '0.5'
        }
      ],
      color: '#FFFFFF'
    },
  ];

  constructor() { }

  ngAfterViewInit() {
    // @ts-ignore
    VanillaTilt.init(document.querySelectorAll('.atvButton'),
      {
        perspective: 3000,
        max: 7,
        scale: 1.03,
        speed: 300,
        easing: 'ease-out',
        glare: true,
        'max-glare': 0.15
      }
    );
  }
}
