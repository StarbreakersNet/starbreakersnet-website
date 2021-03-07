import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HomeScreenComponent } from './home-screen.component';
import {RouterTestingModule} from '@angular/router/testing';
import {SliderComponent} from './slider/slider.component';
import {DiscordComponent} from '../applications/discord/discord.component';
import {FeedbackComponent} from '../developer/feedback/feedback.component';
import {ParticlesCanvasComponent} from '../elements/particles-canvas/particles-canvas.component';
import {SliderNavComponent} from './slider-nav/slider-nav.component';

describe('HomeScreenComponent', () => {
  let component: HomeScreenComponent;
  let fixture: ComponentFixture<HomeScreenComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      declarations: [
        HomeScreenComponent,
        SliderComponent,
        SliderNavComponent,
        DiscordComponent,
        FeedbackComponent,
        ParticlesCanvasComponent
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HomeScreenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
