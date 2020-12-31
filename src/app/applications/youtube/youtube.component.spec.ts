import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { YoutubeComponent } from './youtube.component';
import {RouterTestingModule} from '@angular/router/testing';
import {BackButtonComponent} from '../../elements/back-button/back-button.component';

describe('YoutubeComponent', () => {
  let component: YoutubeComponent;
  let fixture: ComponentFixture<YoutubeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      declarations: [
        YoutubeComponent,
        BackButtonComponent
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(YoutubeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
