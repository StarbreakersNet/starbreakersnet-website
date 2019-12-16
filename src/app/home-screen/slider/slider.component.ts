import { Component, OnInit } from '@angular/core';
import * as jQuery from 'jquery';
import {NotificationService} from '../../services/notification/notification.service';

@Component({
  selector: 'app-slider',
  templateUrl: './slider.component.html',
  styleUrls: ['./slider.component.sass']
})
export class SliderComponent implements OnInit {

  elements = [
    {
      type: 'cd-full-width',
      name: 'Accueil',
      src: {
        slider: '/assets/images/applications/starbreakersnet/slider/bg_strb.png'
      },
      content: {
        img: '/assets/images/applications/starbreakersnet/logo.png',
        title: 'Starbreakers Gaming',
        text: 'Une grande famille ouverte à tous, surtout aux plus marrant',
        btn: [
          {
            type: 'primary',
            title: 'Devenir Membre',
            link: '#0?register'
          },
          {
            type: 'secondary',
            title: 'En savoir plus',
            link: '#0?about'
          }
        ]
      }
    },
    {
      type: 'cd-half-width',
      orientation: 'left',
      name: 'HOTS',
      src: {
        slider: '/assets/images/applications/games/hots/slider/bg_heroes.png',
        img: '/assets/images/applications/games/hots/slider/char_heroes_kael.png',
        video: '/assets/videos/heroes_trailer.webm',
      },
      content: {
        title: 'Heroes of the Storm',
        text: 'Les héros légendaires de Blizzard sont téléportés dans le Nexus.' +
          'Menez des actions intenses sur des champs de bataille variés.' +
          'Choisissez votre héros et battez-vous dans Heroes of the Storm !',
        btn: [
          {
            type: 'primary',
            title: 'Rejoindre l\'Équipe',
            link: '#0?register'
          },
          {
            type: 'secondary',
            title: 'Contacter nos Leader',
            link: '#0?contact'
          }
        ]
      }
    },
    {
      type: 'cd-full-width',
      name: 'Wow',
      src: {
        slider: '/assets/images/applications/games/wow/slider/bg_wow.png',
        video: '/assets/videos/wow_animated.webm',
      },
      content: {
        title: 'World of Warcraft',
        text: 'Le voile entre la vie et la mort s’est déchiré.' +
          'Découvrez ce qui se terre au-delà du monde que vous connaissez dans le prochain chapitre de la saga World of Warcraft,' +
          'Shadowlands !',
        btn: [
          {
            type: 'primary',
            title: 'Rejoindre la Guilde',
            link: '#0?register'
          },
          {
            type: 'secondary',
            title: 'Contacter nos Officiers',
            link: '#0?contact'
          }
        ]
      }
    },
    {
      type: 'cd-full-width',
      name: 'Lol',
      src: {
        slider: '/assets/images/applications/games/lol/slider/bg_lol.png',
        video: '/assets/videos/lol_trailer.webm',
      },
      content: {
        title: 'League of Legends',
        text: 'Rejoignez la league et devenez une légende !',
        btn: [
          {
            type: 'primary',
            title: 'Rejoindre l\'Équipe',
            link: '#0?register'
          },
          {
            type: 'secondary',
            title: 'Contacter nos Leader',
            link: '#0?contact'
          }
        ]
      }
    },
    {
      type: 'cd-half-width',
      orientation: 'right',
      name: 'GTA V',
      src: {
        slider: '/assets/images/applications/games/gtav/slider/bg_gtav.png',
        img: '/assets/images/applications/games/gtav/slider/char_gtav.png',
        video: '/assets/videos/gtav_trailer.webm',
      },
      content: {
        title: 'Grand Theft Auto Online',
        text: 'Réalisez le braquage le plus sophistiqué et le plus audacieux jamais vu à Los Santos dans le Braquage du Diamond Casino',
        btn: [
          {
            type: 'primary',
            title: 'Rejoindre le Crew',
            link: '#0?register'
          }
        ]
      }
    },
    {
      type: 'cd-half-width',
      orientation: 'right',
      name: 'CS:GO',
      src: {
        slider: '/assets/images/applications/games/csgo/slider/bg_csgo.png',
        img: '/assets/images/applications/games/csgo/slider/char_csgo.png',
        video: '/assets/videos/csgo_trailer.webm',
      },
      content: {
        title: 'Counter Strike: GO',
        text: 'Tactique et précision sont maîtres mots.' +
          'Compétition pour but et plaisir pour rêgle,' +
          'l\'escouade vous attend sur le champ de tir !',
        btn: [
          {
            type: 'primary',
            title: 'Rejoindre l\'escouade',
            link: '#0?register'
          },
          {
            type: 'secondary',
            title: 'Contacter nos Chefs d\'escouades',
            link: '#0?contact'
          }
        ]
      }
    },
  ];

  constructor(private notification: NotificationService) { }

  ngOnInit() {
    jQuery(document).ready(($) => {
      const slidesWrapper = $('.cd-hero-slider');
      const targetNavContainer = 'div';
      const targetNavElement = 'a';
      if (slidesWrapper.length > 0) {
        var sliderNav = $('.ui.menu');
        var navigationMarker = $('.cd-marker');
        var slidesNumber = slidesWrapper.children('li').length;
        var autoPlayId = 20000;
        var autoPlayDelay = 20000;
        var visibleSlidePosition = 0;
        uploadVideo(slidesWrapper);
        setAutoplay(slidesWrapper, slidesNumber, autoPlayDelay);
        sliderNav.children().on('click', targetNavElement, function(event) {
          event.preventDefault();
          const selectedItem = $(this).parent();
          if (!selectedItem.hasClass('selected')) {
            const selectedPosition = selectedItem.index();
            const activePosition = slidesWrapper.find('li.selected').index();
            if (activePosition < selectedPosition) {
              nextSlide(slidesWrapper.find('.selected'), slidesWrapper, sliderNav, selectedPosition);
            } else {
              prevSlide(slidesWrapper.find('.selected'), slidesWrapper, sliderNav, selectedPosition);
            }
            visibleSlidePosition = selectedPosition;
            updateSliderNavigation(sliderNav, selectedPosition);
            updateNavigationMarker(navigationMarker, selectedPosition + 1);
            setAutoplay(slidesWrapper, slidesNumber, autoPlayDelay);
          }
        });
      }

      function nextSlide(visibleSlide, container, pagination, n) {
        visibleSlide
          .removeClass('selected from-left from-right')
          .addClass('is-moving').one('webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend', () => {
          visibleSlide.removeClass('is-moving');
        });
        container.children('li').eq(n)
          .addClass('selected from-right').prevAll()
          .addClass('move-left');
        checkVideo(visibleSlide, container, n);
      }

      function prevSlide(visibleSlide, container, pagination, n) {
        visibleSlide
          .removeClass('selected from-left from-right')
          .addClass('is-moving').one('webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend', () => {
          visibleSlide.removeClass('is-moving');
        });
        container.children('li').eq(n)
          .addClass('selected from-left')
          .removeClass('move-left').nextAll()
          .removeClass('move-left');
        checkVideo(visibleSlide, container, n);
      }

      function updateSliderNavigation(pagination, n) {
        const navigationDot = pagination.find('.selected');
        navigationDot.removeClass('selected');
        pagination.find(targetNavContainer).eq(n).addClass('selected');
      }

      function setAutoplay(wrapper, length, delay) {
        if (wrapper.hasClass('autoplay')) {
          clearInterval(autoPlayId);
          autoPlayId = window.setInterval(() => {
            autoplaySlider(length);
          }, delay);
        }
      }

      function autoplaySlider(length) {
        if (visibleSlidePosition < length - 1) {
          nextSlide(slidesWrapper.find('.selected'), slidesWrapper, sliderNav, visibleSlidePosition + 1);
          visibleSlidePosition += 1;
        } else {
          prevSlide(slidesWrapper.find('.selected'), slidesWrapper, sliderNav, 0);
          visibleSlidePosition = 0;
        }
        updateNavigationMarker(navigationMarker, visibleSlidePosition + 1);
        updateSliderNavigation(sliderNav, visibleSlidePosition);
      }

      function uploadVideo(container) {
        container.find('.cd-bg-video-wrapper').each(() => {
          const videoWrapper = $(this);
          if (videoWrapper.is(':visible')) {
            const videoUrl = videoWrapper.data('video');
            const video = $('<video loop>' +
                '<source src="' + videoUrl + '.mp4" type="video/mp4" />' +
                '<source src="' + videoUrl + '.webm" type="video/webm" /></video>');
            video.appendTo(videoWrapper);
            if (videoWrapper.parent('.cd-bg-video.selected').length > 0) {
              video.get(0).play();
            }
          }
        });
      }

      function checkVideo(hiddenSlide, container, n) {
        const hiddenVideo = hiddenSlide.find('video');
        if (hiddenVideo.length > 0) {
          hiddenVideo.get(0).pause();
        }
        const visibleVideo = container.children('li').eq(n).find('video');
        if (visibleVideo.length > 0) {
          visibleVideo.get(0).play();
        }
      }

      function updateNavigationMarker(marker, n) {
        marker.removeClassPrefix('item').addClass('item item-' + n);
      }
      $.fn.removeClassPrefix = function(prefix) {
        this.each((i, el) => {
          var classes = el.className.split(' ').filter((c) => {
            return c.lastIndexOf(prefix, 0) !== 0;
          });
          el.className = $.trim(classes.join(' '));
        });
        return this;
      };
    });
  }

}
