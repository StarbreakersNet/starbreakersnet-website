import { Component, OnInit } from '@angular/core';

declare var jQuery: any;

@Component({
  selector: 'app-feedback',
  templateUrl: './feedback.component.html',
  styleUrls: ['./feedback.component.sass']
})
export class FeedbackComponent implements OnInit {

  constructor() { }

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
