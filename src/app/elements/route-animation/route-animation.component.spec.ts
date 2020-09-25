import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RouteAnimationComponent } from './route-animation.component';

describe('RouteAnimationComponent', () => {
  let component: RouteAnimationComponent;
  let fixture: ComponentFixture<RouteAnimationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RouteAnimationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RouteAnimationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
