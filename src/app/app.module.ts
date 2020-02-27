import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { UnderConstructionComponent } from './under-construction/under-construction.component';
import { SliderComponent } from './home-screen/slider/slider.component';
import { SliderNavComponent } from './home-screen/slider-nav/slider-nav.component';
import { ParticlesCanvaComponent } from './particles-canva/particles-canva.component';
import { FeedbackComponent } from './developer/feedback/feedback.component';

@NgModule({
  declarations: [
    AppComponent,
    UnderConstructionComponent,
    SliderComponent,
    SliderNavComponent,
    ParticlesCanvaComponent,
    FeedbackComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
