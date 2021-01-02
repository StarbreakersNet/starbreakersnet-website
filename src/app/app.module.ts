import { BrowserModule, Title } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { UnderConstructionComponent } from './developer/under-construction/under-construction.component';
import { SliderComponent } from './home-screen/slider/slider.component';
import { SliderNavComponent } from './home-screen/slider-nav/slider-nav.component';
import { ParticlesCanvasComponent } from './elements/particles-canvas/particles-canvas.component';
import { FeedbackComponent } from './developer/feedback/feedback.component';
import { DiscordComponent } from './applications/discord/discord.component';
import { YoutubeComponent } from './applications/youtube/youtube.component';
import { HomeScreenComponent } from './home-screen/home-screen.component';
import { BackButtonComponent } from './elements/back-button/back-button.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterAnimationsComponent } from './elements/animations/route-transition-animations/router-animations.component';
import { NgParticlesModule } from 'ng-particles';
import { FlowFieldCanvasComponent } from './elements/flow-field-canvas/flow-field-canvas.component';

@NgModule({
  declarations: [
    AppComponent,
    UnderConstructionComponent,
    SliderComponent,
    SliderNavComponent,
    ParticlesCanvasComponent,
    FeedbackComponent,
    DiscordComponent,
    YoutubeComponent,
    HomeScreenComponent,
    BackButtonComponent,
    RouterAnimationsComponent,
    FlowFieldCanvasComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    NgParticlesModule
  ],
  providers: [
    Title
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
