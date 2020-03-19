import { TestBed, async } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AppComponent } from './app.component';
import {UnderConstructionComponent} from './under-construction/under-construction.component';
import {SliderComponent} from './home-screen/slider/slider.component';
import {SliderNavComponent} from './home-screen/slider-nav/slider-nav.component';
import {ParticlesCanvaComponent} from './particles-canva/particles-canva.component';
import {FeedbackComponent} from './developer/feedback/feedback.component';
import {DiscordComponent} from './applications/discord/discord.component';

describe('AppComponent', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule
      ],
      declarations: [
        AppComponent,
        UnderConstructionComponent,
        SliderComponent,
        SliderNavComponent,
        ParticlesCanvaComponent,
        FeedbackComponent,
        DiscordComponent
      ],
    }).compileComponents();
  }));

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  });
});
