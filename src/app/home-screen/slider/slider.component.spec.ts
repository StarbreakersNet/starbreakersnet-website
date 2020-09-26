import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SliderComponent } from './slider.component';
import {SliderNavComponent} from '../slider-nav/slider-nav.component';
import {ParticlesCanvaComponent} from '../../elements/particles-canva/particles-canva.component';
import {DiscordComponent} from '../../applications/discord/discord.component';

describe('SliderComponent', () => {
  let component: SliderComponent;
  let fixture: ComponentFixture<SliderComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        SliderComponent,
        SliderNavComponent,
        ParticlesCanvaComponent,
        DiscordComponent
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SliderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
