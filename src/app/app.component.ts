import {Component} from '@angular/core';
import {Title} from '@angular/platform-browser';
import {RouterOutlet} from '@angular/router';
import {slideInAnimation} from './elements/animations/route-transition-animations/router-animations.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.sass'],
  animations: [slideInAnimation]
})
export class AppComponent {
  public constructor(private titleService: Title) {
    this.titleService.setTitle('StarbreakersNet');
  }
  prepareRoute(outlet: RouterOutlet) {
    return outlet &&
      outlet.activatedRouteData &&
      outlet.activatedRouteData.animation;
  }
}
