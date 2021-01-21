import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UnderConstructionComponent } from './under-construction.component';
import {ParticlesCanvasComponent} from '../../elements/particles-canvas/particles-canvas.component';

describe('UnderConstructionComponent', () => {
  let component: UnderConstructionComponent;
  let fixture: ComponentFixture<UnderConstructionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        UnderConstructionComponent,
        ParticlesCanvasComponent
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UnderConstructionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
