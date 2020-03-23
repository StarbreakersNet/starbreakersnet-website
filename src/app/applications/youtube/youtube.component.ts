import { Component, OnInit } from '@angular/core';
import {NotificationService} from '../../services/notification/notification.service';

@Component({
  selector: 'app-youtube',
  templateUrl: './youtube.component.html',
  styleUrls: ['./youtube.component.sass']
})
export class YoutubeComponent implements OnInit {

  constructor() { }

  ngOnInit() {
    NotificationService.notify('Youtube works !');
  }

}
