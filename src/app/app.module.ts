import { BrowserModule, Title } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { UnderConstructionComponent } from './under-construction/under-construction.component';
import { SliderComponent } from './home-screen/slider/slider.component';
import { SliderNavComponent } from './home-screen/slider-nav/slider-nav.component';
import { ParticlesCanvaComponent } from './particles-canva/particles-canva.component';
import { FeedbackComponent } from './developer/feedback/feedback.component';
import { DiscordComponent } from './applications/discord/discord.component';
import { YoutubeComponent } from './applications/youtube/youtube.component';
import { HomeScreenComponent } from './home-screen/home-screen.component';
import { BackButtonComponent } from './elements/back-button/back-button.component';
import { RouteAnimationComponent } from './elements/route-animation/route-animation.component';

@NgModule({
  declarations: [
    AppComponent,
    UnderConstructionComponent,
    SliderComponent,
    SliderNavComponent,
    ParticlesCanvaComponent,
    FeedbackComponent,
    DiscordComponent,
    YoutubeComponent,
    HomeScreenComponent,
    BackButtonComponent,
    RouteAnimationComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [
    Title
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
