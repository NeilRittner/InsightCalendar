import { CalendarsModule } from './calendars.module';

describe('CalendarsModule', () => {
  let calendarsModule: CalendarsModule;

  beforeEach(() => {
    calendarsModule = new CalendarsModule();
  });

  it('should create an instance', () => {
    expect(calendarsModule).toBeTruthy();
  });
});
