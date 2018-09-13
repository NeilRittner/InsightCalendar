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

  extractDate(dateISOS: string): string {
    return formatDate(dateISOS, 'fullDate', 'en-US');
  }

  extractTime(dateISOS: string): string {
    return formatDate(dateISOS, 'shortTime', 'en-US');
  }

  setCalendar(timescale?: string): void {
    if (timescale) {
      this.timescale = timescale;
    }
    this.getCalendar(timescale)
      .then(data => {
        this.calendarTreatments(data);
      });
  }

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

  refreshCalendarTimer(): void {
    setTimeout(() => {
      this.setCalendar();
      this.refreshCalendarTimer();
    }, this.timeOutRefresh);
  }

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

  setupSockets(): void {
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

    this.removeEventConnection = this.socketsService.eventRemoved()
      .subscribe(data => {
        if (this.userInMeeting(this.dataService.user['Email'], data['attendees'])) {
          this.removeEvent(data['id']);
        }
      });
  }

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

  removeEvent(eventId): void {
    this.getCalendar()
      .then(data => {
        data = this.removeEventInList(data, eventId);
        this.calendarTreatments(data);
      });
  }

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

  ngOnInit() {
    if (JSON.stringify(this.dataService.user) === '{}') {
      this.dataService.getUser();
    }
    this.setCalendar('Week');
    this.setupSockets();
  }

  ngOnDestroy() {
    if (this.insertEventConnection !== undefined) {
      this.insertEventConnection.unsubscribe();
    }
    if (this.removeEventConnection !== undefined) {
      this.removeEventConnection.unsubscribe();
    }
  }

}
