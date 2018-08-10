import { CalendarsRoutingModule } from './calendars-routing.module';

describe('CalendarsRoutingModule', () => {
  let calendarsRoutingModule: CalendarsRoutingModule;

  beforeEach(() => {
    calendarsRoutingModule = new CalendarsRoutingModule();
  });

  it('should create an instance', () => {
    expect(calendarsRoutingModule).toBeTruthy();
  });
});
