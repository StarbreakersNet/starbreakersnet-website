import { TestBed } from '@angular/core/testing';

import { ApplicationBrowserService } from './application-browser.service';
import {RouterTestingModule} from '@angular/router/testing';

describe('ApplicationBrowserService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [RouterTestingModule]
  }));

  it('should be created', () => {
    const service: ApplicationBrowserService = TestBed.get(ApplicationBrowserService);
    expect(service).toBeTruthy();
  });
});
