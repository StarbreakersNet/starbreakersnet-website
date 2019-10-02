import {Component, OnInit} from '@angular/core';
import * as Particles from 'particlesjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.sass']
})
export class AppComponent implements OnInit {
  title = 'StarbreakersNet';
  ngOnInit() {
    Particles.init({
      selector: '.constructionBackground',
      maxParticles: 150,
      sizeVariations: 3,
      speed: 0.3,
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
