import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RouterAnimationsComponent } from './router-animations.component';

describe('RouteTransitionAnimationsComponent', () => {
  let component: RouterAnimationsComponent;
  let fixture: ComponentFixture<RouterAnimationsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RouterAnimationsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RouterAnimationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
