import { Component, OnInit } from '@angular/core';
import * as Particles from 'particlesjs';

@Component({
  selector: 'app-particles-canva',
  templateUrl: './particles-canva.component.html',
  styleUrls: ['./particles-canva.component.sass']
})
export class ParticlesCanvaComponent implements OnInit {

  constructor() { }

  ngOnInit() {
    Particles.init({
      selector: '.constructionBackground',
      maxParticles: 100,
      sizeVariations: 3,
      speed: 0.1,
      color: ['#FAED4F', '#8D1C1A'],
      minDistance: 120,
      connectParticles: true,
      responsive: [
        {
          breakpoint: 1000,
          options: {
            maxParticles: 50
          }
        },
        {
          breakpoint: 500,
          options: {
            maxParticles: 25
          }
        }
      ]
    });
  }

}
