import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-particles-canva',
  templateUrl: './particles-canva.component.html',
  styleUrls: ['./particles-canva.component.sass']
})
export class ParticlesCanvaComponent implements OnInit {

  myStyle: object = {};
  myParams: object = {};
  width = 100;
  height = 100;

  constructor() { }

  ngOnInit() {
    this.myStyle = {
      position: 'absolute',
      width: '100vw',
      height: '100vh',
      'z-index': -1,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    };
    this.myParams = {
      particles: {
        number: {
          value: 200,
        },
        color: {
          value: '#ff0000'
        },
        shape: {
          type: 'triangle',
        },
      }
    };
  }

}
