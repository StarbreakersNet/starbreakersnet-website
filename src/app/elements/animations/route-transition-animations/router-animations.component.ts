import { Component, OnInit } from '@angular/core';
import {
  trigger,
  transition,
  style,
  query,
  animateChild,
  group,
  animate
} from '@angular/animations';

@Component({
  selector: 'app-route-transition-animations',
  templateUrl: './router-animations.component.html',
  styleUrls: ['./router-animations.component.sass']
})
export class RouterAnimationsComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}

export const slideInAnimation =
  trigger('routeAnimations', [
    transition('* <=> *', [
      style({position: 'relative'}),
      query(':enter, :leave', [
        style({
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%'
        })
      ]),
      query(':enter', [
        style({
          opacity: 0,
          transform: 'scale(0)',
        })
      ]),
      query(':enter', [
        style({
          opacity: 1,
          transform: 'scale(1)',
        })
      ]),
      group([
        query(':leave', [
          animate('600ms ease', style({opacity: 0, transform: 'scale(0) translateY(20%)'}))
        ]),
        query(':enter', [
          animate('600ms ease', style({opacity: 1, transform: 'scale(1) translateY(0)'}))
        ])
      ]),
    ])
  ]);

export const faderAnimation =
  trigger('routeAnimations', [
    transition('* <=> *', [
      // Set a default  style for enter and leave
      query(':enter, :leave', [
        style({
          position: 'absolute',
          left: 0,
          width: '100%',
          opacity: 0,
          transform: 'scale(0) translateY(100%)',
        }),
      ]),
      // Animate the new page in
      query(':enter', [
        animate('600ms ease', style({ opacity: 1, transform: 'scale(1) translateY(0)' })),
      ])
    ]),
  ]);
