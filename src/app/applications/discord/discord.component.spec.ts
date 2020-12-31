import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DiscordComponent } from './discord.component';
import {RouterTestingModule} from '@angular/router/testing';

describe('DiscordComponent', () => {
  let component: DiscordComponent;
  let fixture: ComponentFixture<DiscordComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      declarations: [ DiscordComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DiscordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
