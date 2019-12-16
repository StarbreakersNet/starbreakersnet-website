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

  notify() {
    jQuery('body').toast({
      class: 'info',
      showIcon: 'info',
      message: 'Ceci est une notification',
      showProgress: 'bottom',
    });
  }

  featureComing() {
    jQuery('body').toast({
      class: 'warning',
      showIcon: 'info',
      message: 'Cette fonctionnalitée du site n\'est pas encore disponible',
    });
  }
}
