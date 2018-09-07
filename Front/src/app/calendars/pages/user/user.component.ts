import { Component, OnInit } from '@angular/core';
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
export class UserComponent implements OnInit {

  constructor(
    private httpService: CalendarsService,
    private dataService: DataService,
    private socketsService: SocketsService
  ) { }

  timescale: string;
  events = [];
  removeEventConnection;
  insertEventConnection;

  getUser(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.httpService.getUser()
        .subscribe(user => {
          this.dataService.user = user;
          resolve('');
        }, (err: HttpErrorResponse) => {
          // console.log(err['status']);
          // 500: Internal Error Component
        });
    });
  }

  extractDate(dateISOS: string): string {
    return formatDate(dateISOS, 'fullDate', 'en-US');
  }

  extractTime(dateISOS: string): string {
    return formatDate(dateISOS, 'shortTime', 'en-US');
  }

  setCalendar(timescale?: string): void {
    this.getCalendar(timescale)
      .then(data => {
        this.calendarTreatments(data);
      });
  }

  getCalendar(timeScale?: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.httpService.getCalendar('primary', timeScale)
        .subscribe(data => {
          resolve(data);
        }, (err: HttpErrorResponse) => {
          // console.log(err['status']);
          // 500: Internal Error Component
        });
    });
  }

  calendarTreatments(data: any): void {
    for (let i = 0; i < data['events'].length; i++) {
      const event = data['events'][i];
      event['date'] = this.extractDate(event['start']['dateTime']);
      event['start']['dateTime'] = this.extractTime(event['start']['dateTime']);
      event['end']['dateTime'] = this.extractTime(event['end']['dateTime']);
      event['type'] = 'danger';
    }
    this.timescale = data['timescale'];
    this.events = data['events'];
  }

  setupSockets(): void {
    this.insertEventConnection = this.socketsService.eventInserted()
      .subscribe(dataInsert => {
        if (this.userInMeeting(this.dataService.user['Email'], dataInsert['event']['attendees'])) {
          this.getCalendar()
            .then(dataGet => {
              const dataFinal = [];
              const newEventStartTime = new Date(dataInsert['event']['start']['dateTime'].split('+')[0]).getTime();
              let index = -1;

              if (dataGet['timescale'] === 'Month' || (dataGet['timescale'] === 'Week' && dataInsert['timescale'] === 'Day')) {
                dataFinal['timescale'] = dataInsert['timescale'];
              } else {
                dataFinal['timescale'] = dataGet['timescale'];
              }

              for (let i = 0; i < dataGet['events'].length; i++) {
                const event = dataGet['events'][i];
                const eventStartTime = new Date(event['start']['dateTime'].split('+')[0]).getTime();
                if (eventStartTime > newEventStartTime) {
                  index = i;
                }
              }

              if (index === -1) {
                index = dataGet['events'].length;
              }

              dataFinal['events'] = dataGet['events'].slice(0, index);
              dataFinal['events'].push(dataInsert['event']);
              dataFinal['events'] = (dataFinal['events']).concat(dataGet['events'].slice(index));
              this.calendarTreatments(dataFinal);
            });
        }
      });

    this.removeEventConnection = this.socketsService.eventRemoved()
      .subscribe(data => {
        if (this.userInMeeting(this.dataService.user['Email'], data['attendees'])) {
          this.removeEvent(data['id'], this.timescale);
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

  removeEvent(eventId, timescale): void {
    this.getCalendar(timescale)
      .then(data => {
        const newEvents = this.removeEventInList(data['events'], eventId);
        if (timescale === 'Month' || newEvents.length !== 0) {
          const newData = {
            'timescale': timescale,
            'events': newEvents
          };
          this.calendarTreatments(newData);
        } else {
          this.removeEvent(eventId, this.followingTimescale(timescale));
        }
      });
  }

  followingTimescale(timescale: string): string {
    if (timescale === 'Month' || timescale === 'Week') {
      return 'Month';
    } else {
      return 'Week';
    }
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
      this.getUser();
    }
    this.setCalendar();
    this.setupSockets();
  }

}
