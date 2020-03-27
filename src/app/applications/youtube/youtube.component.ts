import { Component, OnInit } from '@angular/core';
import {NotificationService} from '../../services/notification/notification.service';
import {DomSanitizer, SafeResourceUrl} from '@angular/platform-browser';

@Component({
  selector: 'app-youtube',
  templateUrl: './youtube.component.html',
  styleUrls: ['./youtube.component.sass']
})
export class YoutubeComponent implements OnInit {

  url = 'https://www.youtube.com/embed/videoseries?list=PLRyncVRdYNSJIUIHfr8f5Tewxmab2BtIj';
  urlSafe: SafeResourceUrl;

  constructor(public sanitizer: DomSanitizer) { }

  ngOnInit() {
    this.urlSafe = this.sanitizer.bypassSecurityTrustResourceUrl(this.url);
    NotificationService.notify('Youtube works !');
  }

}
