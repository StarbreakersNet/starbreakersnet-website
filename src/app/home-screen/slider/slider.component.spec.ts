import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SliderComponent } from './slider.component';
import {SliderNavComponent} from '../slider-nav/slider-nav.component';
import {ParticlesCanvaComponent} from '../../elements/particles-canvas/particles-canvas.component';
import {DiscordComponent} from '../../applications/discord/discord.component';
import {RouterTestingModule} from '@angular/router/testing';

describe('SliderComponent', () => {
  let component: SliderComponent;
  let fixture: ComponentFixture<SliderComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule
      ],
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
