<script setup lang="ts">
import { type CarouselItem, CAROUSEL_ITEMS } from "@/models/CarouselItem";
import { PARTICLES_OPTIONS } from "@/models/ParticlesConfig";
import HCarousel from "@/components/c/hCarousel.vue";
import HButton from "@/components/c/hButton.vue";
import HFlex from "@/components/c/hFlex.vue";
import HText from "@/components/c/hText.vue";
import HCard from "@/components/c/hCard.vue";
import HH1 from "@/components/c/hH1.vue";

const carouselItemsStyle = CAROUSEL_ITEMS.map(item => {
  const align = item.style.align;
  const delay = calculateDelays(item);

  return { align, delay };
});

function calculateDelays(item: CarouselItem) {
  const baseDelay = 0.1;
  let list;

  if (item.style.align === "center") {
    list = ["thumbnail", "title", "description", "actions"];
  } else {
    list = ["title", "description", "actions", "thumbnail"];
  }

  return list.map((_, index) => {
    return baseDelay * index + "s";
  });
}
</script>

<template>
  <main class="fullscreen-container">
    <vue-particles id="tsparticles" :options="PARTICLES_OPTIONS" />
    <h-carousel :interval="15000" autoplay dot-placement="top" dot-type="line" draggable keyboard>
      <div v-for="(item, itemIndex) in CAROUSEL_ITEMS" :key="item.title.toLowerCase()">
        <h-flex wrap :align="item.style.align" class="content-container" size="large" vertical>
          <div
            v-if="item.thumbnail"
            :class="{ absolute: item.style.align !== 'center' }"
            :style="{ transitionDelay: carouselItemsStyle[itemIndex]?.delay[0] }"
            class="thumbnail-container">
            <img :alt="item.thumbnail.alt" :src="item.thumbnail.src" class="thumbnail" />
          </div>
          <div
            :style="{ transitionDelay: carouselItemsStyle[itemIndex]?.delay[1] }"
            class="title-container">
            <h-h1>
              {{ item.title }}
            </h-h1>
          </div>
          <h-card
            :bordered="false"
            :style="{ transitionDelay: carouselItemsStyle[itemIndex]?.delay[2] }"
            class="description-container card-blurred">
            <h-text>{{ item.description }}</h-text>
          </h-card>
          <h-flex
            wrap
            align="stretch"
            :style="{ transitionDelay: carouselItemsStyle[itemIndex]?.delay[3] }"
            class="actions-container">
            <template v-for="action in item.actions" :key="action.label">
              <h-button
                :href="action.externalLink"
                :tag="action.externalLink ? 'a' : 'button'"
                :type="action.type"
                class="btn-action"
                target="_blank">
                <h-flex wrap align="stretch" size="small">
                  <font-awesome-icon :icon="action.icon" />
                  {{ action.label }}
                </h-flex>
              </h-button>
            </template>
          </h-flex>
        </h-flex>
        <div class="background-container">
          <video
            v-if="item.background?.videoSrc"
            :src="item.background?.videoSrc"
            autoplay
            loop
            muted
            playsinline />
          <img
            v-else-if="item.background?.imageSrc"
            :alt="item.background?.alt"
            :src="item.background?.imageSrc" />
        </div>
      </div>
    </h-carousel>
  </main>
</template>

<style lang="scss" scoped>
@use "@/assets/variables";
@use "@/assets/animations";

$x-margin: 10vw;
$y-margin: 10vh;
$slider-timing-function: cubic-bezier(0.4, 0, 0.2, 1);

main {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  z-index: 0;

  .content-container {
    padding-top: $y-margin;
    margin: 0 $x-margin $y-margin $x-margin;

    .n-h1,
    .n-card {
      max-width: 40vw;
    }

    .n-h1 {
      font-size: 5vmin;
      font-weight: bold;
      text-transform: uppercase;
      margin: unset;
      filter: drop-shadow(0 0 10px variables.$sn-default-dark);
    }

    .n-text {
      font-size: 1.5vmin;
    }

    .n-card {
      border-radius: 0.75rem;
      width: unset;
    }

    .n-button {
      border-radius: 0.75rem;
      height: 3rem;
      width: unset;
    }
  }

  .background-container {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: -1;
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;

    video,
    img {
      width: 100%;
      height: 120%;
      object-fit: cover;
      z-index: 0;
    }
  }

  .btn-action {
    position: relative;
    overflow: hidden;
    border: unset;
    transition: all animations.$default-animation;

    &:hover {
      scale: 1.1;
    }

    &:active {
      scale: 1.05;
    }

    &::after {
      content: "";
      position: absolute;
      bottom: 0;
      left: 100%;
      width: 100%;
      height: 3px;
      background: variables.$sn-primary-red;
      transition: left animations.$default-animation;
      transition-delay: 0.1s;
    }

    &:hover::after {
      left: 0;
    }

    ::v-deep() {
      .n-button__border,
      .n-button__state-border {
        border: unset !important;
      }
    }
  }

  .thumbnail-container {
    &.absolute {
      position: absolute;
      left: calc($x-margin / 2);
      bottom: calc($y-margin / 2);
      display: flex;
      justify-content: center;
      align-items: center;

      > img {
        width: 50vw;
      }
    }

    > img {
      width: 20vw;
      height: auto;
      object-fit: cover;
      border-radius: variables.$sn-apple-border-radius;
      filter: drop-shadow(variables.$sn-text-shadow);
    }
  }

  :deep() {
    .n-carousel__slide--prev,
    .n-carousel__slide--next,
    .n-carousel__slide--current {
      .title-container,
      .description-container,
      .actions-container,
      .thumbnail-container {
        transition: all 1s $slider-timing-function;
      }
    }

    .n-carousel__slide {
      .title-container,
      .description-container,
      .actions-container,
      .thumbnail-container {
        transform: translateX(40vw);
        opacity: 0;
        filter: blur(10px);
      }
    }

    .n-carousel__slide--prev {
      .title-container,
      .description-container,
      .actions-container,
      .thumbnail-container {
        transform: translateX(-40vw);
        opacity: 0;
        filter: blur(10px);
      }
    }

    .n-carousel__slide--next {
      .title-container,
      .description-container,
      .actions-container,
      .thumbnail-container {
        transform: translateX(40vw);
        opacity: 0;
        filter: blur(10px);
      }
    }

    .n-carousel__slide--current {
      .title-container,
      .description-container,
      .actions-container,
      .thumbnail-container {
        transform: translateX(0vw);
        opacity: 1;
        filter: blur(0);
      }
    }
  }
}
</style>
