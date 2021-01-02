import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FlowFieldCanvasComponent } from './flow-field-canvas.component';

describe('FlowFieldCanvasComponent', () => {
  let component: FlowFieldCanvasComponent;
  let fixture: ComponentFixture<FlowFieldCanvasComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FlowFieldCanvasComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FlowFieldCanvasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
