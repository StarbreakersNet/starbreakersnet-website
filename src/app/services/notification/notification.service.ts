import { Injectable } from '@angular/core';

declare var jQuery: any;

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  constructor() {
    jQuery.fn.toast.settings.position = 'top right';
    jQuery.fn.toast.settings.showIcon = true;
    jQuery.fn.toast.settings.pauseOnHover = true;
    jQuery.fn.toast.settings.displayTime = 'auto';
    jQuery.fn.toast.settings.wordsPerMinute = 120;
    jQuery.fn.toast.settings.showEasing = 'easeInOut';
    jQuery.fn.toast.settings.closeEasing = 'easeInOut';
  }

  static notify(text: string) {
    jQuery('body').toast({
      class: 'info',
      showIcon: 'info',
      message: text,
      showProgress: 'bottom',
    });
  }

  static featureComing() {
    jQuery('body').toast({
      class: 'info',
      showIcon: 'info',
      message: 'Cette fonctionnalitée du site n\'est pas encore disponible',
    });
  }
}
