import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SliderNavComponent } from './slider-nav.component';
import {RouterTestingModule} from '@angular/router/testing';

describe('SliderNavComponent', () => {
  let component: SliderNavComponent;
  let fixture: ComponentFixture<SliderNavComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule
      ],
      declarations: [ SliderNavComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SliderNavComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
