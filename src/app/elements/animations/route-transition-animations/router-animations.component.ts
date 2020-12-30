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
      query(':enter, :leave', [
        style({
          position: 'absolute',
          width: '100%'
        })
      ]),
      query(':enter', [
        style({
          opacity: 0,
          transform: 'scale(0) translateY(50%)',
        })
      ]),
      query(':leave', [
        style({
          opacity: 1,
          transform: 'scale(1) translateY(0)',
        })
      ]),
      group([
        query(':enter', [
          animate('600ms ease', style({opacity: 1, transform: 'scale(1) translateY(0)'}))
        ]),
        query(':leave', [
          animate('600ms ease', style({opacity: 0, transform: 'scale(0.50) translateY(20%)'}))
        ]),
      ]),
      query(':enter, :leave', animateChild()),
    ])
  ]);

export const slideOutAnimation =
  trigger('routeAnimations', [
    transition('* <=> *', [
      query(':enter, :leave', [
        style({
          position: 'absolute',
          width: '100%'
        })
      ]),
      query(':enter', [
        style({
          opacity: 1,
          transform: 'scale(1) translateY(0)',
        })
      ]),
      query(':leave', [
        style({
          opacity: 0,
          transform: 'scale(0) translateY(50%)',
        })
      ]),
      group([
        query(':enter', [
          animate('600ms ease', style({opacity: 0, transform: 'scale(0.50) translateY(20%)'}))
        ]),
        query(':leave', [
          animate('600ms ease', style({opacity: 1, transform: 'scale(1) translateY(0)'}))
        ]),
      ]),
      query(':enter, :leave', animateChild()),
    ])
  ]);

