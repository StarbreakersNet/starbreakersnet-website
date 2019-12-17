import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ParticlesCanvaComponent } from './particles-canva.component';

describe('ParticlesCanvaComponent', () => {
  let component: ParticlesCanvaComponent;
  let fixture: ComponentFixture<ParticlesCanvaComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ParticlesCanvaComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ParticlesCanvaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
