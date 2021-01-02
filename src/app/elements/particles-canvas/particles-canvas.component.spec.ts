import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ParticlesCanvasComponent } from './particles-canvas.component';

describe('ParticlesCanvaComponent', () => {
  let component: ParticlesCanvasComponent;
  let fixture: ComponentFixture<ParticlesCanvasComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ParticlesCanvasComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ParticlesCanvasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
