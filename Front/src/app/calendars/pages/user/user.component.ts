import { Router } from '@angular/router';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpErrorResponse } from '../../../../../node_modules/@angular/common/http';
import { formatDate } from '../../../../../node_modules/@angular/common';
import { CalendarsService } from '../../shared/httpService/calendars.service';
import { DataService } from './../../shared/dataService/data.service';
import { SocketsService } from './../../shared/socketsService/sockets.service';

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.css']
})
export class UserComponent implements OnInit, OnDestroy {

  constructor(
    private httpService: CalendarsService,
    private dataService: DataService,
    private socketsService: SocketsService,
    private router: Router
  ) { }

  // Global information
  timescale;
  events = [];

  // Time
  timeRefreshMiutes = 10;
  timeOutRefresh = this.timeRefreshMiutes * 60 * 1000;

  // Sockets
  removeEventConnection;
  insertEventConnection;

  /**
   * @param {string} dateISOS: a date in the format ISO
   * This function extracts the date (Year, Month, Day) in the given date
   * @return {string}: a string which gives the Year, Month, Day
   */
  extractDate(dateISOS: string): string {
    return formatDate(dateISOS, 'fullDate', 'en-US');
  }

  /**
   * @param {string} dateISOS: a date in the format ISO
   * This function extracts the time (Hour, Minute) in the given date
   * @return {string}: a string which gives the Hour and Minute
   */
  extractTime(dateISOS: string): string {
    return formatDate(dateISOS, 'shortTime', 'en-US');
  }

  /**
   * @param {string} timescale: a timescale (optional)
   * This function calls a function to get the calendar of the user, and then, another one to do treatmens on the data
   */
  setCalendar(timescale?: string): void {
    if (timescale) {
      this.timescale = timescale;
    }
    this.getCalendar(timescale)
      .then(data => {
        this.calendarTreatments(data);
      });
  }

  /**
   * @param timescale: a timescale (optional)
   * This function calls a function to get the calendar of the user
   * @return {Promise<any>}: Promise with an array of events (JSON Object)
   */
  getCalendar(timescale?: string): Promise<any> {
    return new Promise((resolve) => {
      this.httpService.getCalendar('primary', timescale)
        .subscribe(data => {
          resolve(data);
        }, (err: HttpErrorResponse) => {
          if (err['status'] === 500) {
            this.router.navigate(['/server-error', 'Internal Error']);
          }
        });
    });
  }

  /**
   * This function refresh automatically the page
   */
  refreshCalendarTimer(): void {
    setTimeout(() => {
      this.setCalendar();
      this.refreshCalendarTimer();
    }, this.timeOutRefresh);
  }

  /**
   * @param {any} data: the array of events
   * This function do some treatments on the events (on the dates and type) and determine the next event
   */
  calendarTreatments(data: any): void {
    for (let i = 0; i < data.length; i++) {
      const event = data[i];
      event['date'] = this.extractDate(event['start']['dateTime']);
      event['start']['dateTime'] = this.extractTime(event['start']['dateTime']);
      event['end']['dateTime'] = this.extractTime(event['end']['dateTime']);
      event['type'] = 'danger';
    }
    this.events = data;
  }

  /**
   * This function sets up the sockets to allow the real time
   * and do some treatments if necessary when data are received
   */
  setupSockets(): void {
    // When there is an event created through the application
    this.insertEventConnection = this.socketsService.eventInserted()
      .subscribe(dataInsert => {
        if (this.userInMeeting(this.dataService.user['Email'], dataInsert['attendees'])) {
          this.getCalendar()
            .then(dataGet => {
              this.timescale = 'Week';
              const newEventStartTime = new Date(dataInsert['start']['dateTime'].split('+')[0]).getTime();
              let index = -1;
              let dataFinal = [];

              for (let i = 0; i < dataGet.length; i++) {
                const event = dataGet[i];
                const eventStartTime = new Date(event['start']['dateTime'].split('+')[0]).getTime();
                if (eventStartTime > newEventStartTime) {
                  index = i;
                }
              }

              if (index === -1) {
                index = dataGet.length;
              }

              dataFinal = dataGet.slice(0, index);
              dataFinal.push(dataInsert);
              dataFinal = (dataFinal).concat(dataGet.slice(index));
              this.calendarTreatments(dataFinal);
            });
        }
      });

    // When there an event is removed
    this.removeEventConnection = this.socketsService.eventRemoved()
      .subscribe(data => {
        if (this.userInMeeting(this.dataService.user['Email'], data['attendees'])) {
          this.removeEvent(data['id']);
        }
      });
  }

  /**
   * @param {string} userEmail: the user's email
   * @param {Array<any>} newEventAttendees: the attendees of an event
   * This function checks if the user is an attendee of an cancelled event.
   * @return {boolean}: true if user is an attendee, false if not
   */
  userInMeeting(userEmail: string, newEventAttendees: Array<any>): boolean {
    let inAttendees = false;
    for (let i = 0; i < newEventAttendees.length; i++) {
      const attendee = newEventAttendees[i];
      if (!attendee['resource'] && userEmail === attendee['email']) {
        inAttendees = true;
      }
    }
    return inAttendees;
  }

  /**
   * @param eventId: the id of an event
   * This function calls a function remove the event with the given id from the array of events
   * and calls another function with the updated array
   */
  removeEvent(eventId): void {
    this.getCalendar()
      .then(data => {
        data = this.removeEventInList(data, eventId);
        this.calendarTreatments(data);
      });
  }

  /**
   * @param events: array of events
   * @param eventId: the id of the event to remove in the array
   * This function removes the event with the given id in the given array of events
   */
  removeEventInList(events, eventId): Array<any> {
    let index = -1;
    for (let i = 0; i < events.length; i++) {
      if (events[i]['id'] === eventId) {
        index = i;
      }
    }
    if (index !== -1) {
      events = (events.slice(0, index)).concat(events.slice(index + 1));
    }
    return events;
  }

  /**
   * This function removes the sockets if they are set
   */
  removeSockets(): void {
    if (this.insertEventConnection !== undefined) {
      this.insertEventConnection.unsubscribe();
    }
    if (this.removeEventConnection !== undefined) {
      this.removeEventConnection.unsubscribe();
    }
  }

  ngOnInit() {
    if (JSON.stringify(this.dataService.user) === '{}') {
      this.dataService.getUser();
    }
    this.setCalendar('Week');
    this.setupSockets();
  }

  ngOnDestroy() {
    this.removeSockets();
  }

}
