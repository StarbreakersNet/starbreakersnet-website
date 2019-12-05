import {Component, AfterViewInit} from '@angular/core';
import * as atvImg from 'atvImg';

@Component({
  selector: 'app-slider-nav',
  templateUrl: './slider-nav.component.html',
  styleUrls: ['./slider-nav.component.sass']
})
export class SliderNavComponent implements AfterViewInit {

  elements = [
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

  constructor() { }

  ngAfterViewInit() {
    atvImg.atvStart();
  }
}
