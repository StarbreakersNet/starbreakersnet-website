import {Component, AfterViewInit} from '@angular/core';
import VanillaTilt from 'vanilla-tilt';
import {ApplicationBrowserService} from '../../services/application-browser/application-browser.service';

@Component({
  selector: 'app-slider-nav',
  templateUrl: './slider-nav.component.html',
  styleUrls: ['./slider-nav.component.sass']
})

export class SliderNavComponent implements AfterViewInit {

  constructor(public applicationBrowser: ApplicationBrowserService) { }

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
