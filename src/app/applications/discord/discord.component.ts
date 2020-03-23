import {Component, OnInit} from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import {ApplicationBrowserService} from '../../services/application-browser/application-browser.service';

declare var $: any;

@Component({
  selector: 'app-discord',
  templateUrl: './discord.component.html',
  styleUrls: ['./discord.component.sass']
})
export class DiscordComponent implements OnInit {

  APPLICATION_NAME = this.applicationBrowser.APP_ONE;

  url = 'https://discordapp.com/widget?id=674668711566639114&theme=dark';
  urlSafe: SafeResourceUrl;

  constructor(public sanitizer: DomSanitizer, public applicationBrowser: ApplicationBrowserService) { }

  ngOnInit() {
    this.urlSafe = this.sanitizer.bypassSecurityTrustResourceUrl(this.url);
    $('.modal' + '.' + this.APPLICATION_NAME).modal({
      detachable: false,
      dimmerSettings: {
        dimmerName: this.APPLICATION_NAME
      }
    });
  }
}
