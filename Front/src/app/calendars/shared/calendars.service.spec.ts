import { TestBed, inject } from '@angular/core/testing';

import { CalendarsService } from './calendars.service';

describe('CalendarsService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CalendarsService]
    });
  });

  it('should be created', inject([CalendarsService], (service: CalendarsService) => {
    expect(service).toBeTruthy();
  }));
});
