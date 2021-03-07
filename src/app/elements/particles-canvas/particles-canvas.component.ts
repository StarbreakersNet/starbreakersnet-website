import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-particles-canva',
  templateUrl: './particles-canvas.component.html',
  styleUrls: ['./particles-canvas.component.sass']
})
export class ParticlesCanvasComponent implements OnInit {

  id = 'tsparticles';

  particlesOptions = {
    fpsLimit: 60,
    interactivity: {
      detectsOn: 'canvas',
      events: {
        onClick: {
          enable: false,
          mode: 'push'
        },
        onHover: {
          enable: false,
          mode: 'repulse'
        },
        resize: false
      }
    },
    particles: {
      color: {
        value: ['#8D1C1A', '#FAED4F']
      },
      links: {
        color: 'random',
        distance: 150,
        enable: true,
        opacity: 0.4,
        width: 1
      },
      collisions: {
        enable: true
      },
      move: {
        direction: 'top',
        enable: true,
        outMode: 'bounce',
        random: true,
        speed: 1,
        straight: false
      },
      number: {
        density: {
          enable: true,
          value_area: 800
        },
        value: 40
      },
      opacity: {
        value: 0.5
      },
      shape: {
        type: 'circle'
      },
      size: {
        random: true,
        value: 3
      }
    },
    detectRetina: true
  };

  particlesLoaded(container): void {
    console.log(container);
  }

  constructor() { }

  ngOnInit() {
  }

}
