import { Component, OnInit } from '@angular/core';
import { environment } from '../../../environments/environment';

declare var jQuery: any;

@Component({
  selector: 'app-feedback',
  templateUrl: './feedback.component.html',
  styleUrls: ['./feedback.component.sass']
})
export class FeedbackComponent implements OnInit {

  appVersion = environment.appVersion;

  constructor() {}

  ngOnInit() {
    jQuery('.feedback-btn .icon.button').popup({
      position: 'left center',
      content: 'Signaler un problème'
    });
  }

  navigateToBugTrack() {
    window.open('https://gitlab.com/starbreakersdevteam/starbreakersnet-website/issues/new/');
  }
}
