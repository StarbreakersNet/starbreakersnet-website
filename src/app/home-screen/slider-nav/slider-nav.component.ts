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
      src: '/assets/icons/icon_strb_active.png',
      color: '#8D1C1A'
    },
    {
      name: 'Heroes of the Storm',
      src: '/assets/icons/icon_heroes_active.png',
      color: '#8D1C1A'
    },
    {
      name: 'World of Warcraft',
      src: '/assets/icons/icon_wow_active.png',
      color: '#8D1C1A'
    },
    {
      name: 'League of Legens',
      src: '/assets/icons/icon_lol_active.png',
      color: '#8D1C1A'
    },
    {
      name: 'Grand Theft Auto V',
      src: '/assets/icons/icon_gtav_active.png',
      color: '#8D1C1A'
    },
    {
      name: 'Counter Striker: GO',
      src: '/assets/icons/icon_csgo_active.png',
      color: '#8D1C1A'
    },
  ];
  appElements = [
    {
      name: 'TestTilt',
      logo: [
        'assets/icons/icon_wow_active.png',
        'assets/images/applications/atvImg/front.png',
      ],
      img: 'assets/images/applications/atvImg/back.png',
      color: '#1C2537'
    },
    {
      name: 'TeamSpeak',
      logo: [
        'assets/images/applications/teamspeak/ts_stacked_bluelight.png'
      ],
      color: '#1C2537'
    },
    {
      name: 'TeamSpeak',
      logo: [
        'assets/images/applications/teamspeak/ts_stacked_bluelight.png'
      ],
      color: '#1C2537'
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
