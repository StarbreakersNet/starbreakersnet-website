import { Component, OnInit } from '@angular/core';
import * as jQuery from 'jquery';

@Component({
  selector: 'app-slider',
  templateUrl: './slider.component.html',
  styleUrls: ['./slider.component.sass']
})
export class SliderComponent implements OnInit {

  constructor() { }

  ngOnInit() {
    jQuery(document).ready(($) => {
      const slidesWrapper = $('.cd-hero-slider');
      if (slidesWrapper.length > 0) {
        var sliderNav = $('.ui.menu');
        var navigationMarker = $('.cd-marker');
        var slidesNumber = slidesWrapper.children('li').length;
        var autoPlayId = 10000;
        var autoPlayDelay = 10000;
        var visibleSlidePosition = 0;
        uploadVideo(slidesWrapper);
        setAutoplay(slidesWrapper, slidesNumber, autoPlayDelay);
        sliderNav.on('click', 'a', function(event) {
          event.preventDefault();
          const selectedItem = $(this);
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
        pagination.find('a').eq(n).addClass('selected');
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
        marker.removeClassPrefix('item').addClass('item-' + n);
      }
      $.fn.removeClassPrefix = function(prefix) {
        this.each((i, el) => {
          const classes = el.className.split(' ').filter((c) => {
            return c.lastIndexOf(prefix, 0) !== 0;
          });
          el.className = $.trim();
        });
        return this;
      };
    });
  }

}
