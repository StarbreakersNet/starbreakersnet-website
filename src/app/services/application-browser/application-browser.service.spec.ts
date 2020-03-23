import { TestBed } from '@angular/core/testing';

import { ApplicationBrowserService } from './application-browser.service';

describe('ApplicationBrowserService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ApplicationBrowserService = TestBed.get(ApplicationBrowserService);
    expect(service).toBeTruthy();
  });
});
