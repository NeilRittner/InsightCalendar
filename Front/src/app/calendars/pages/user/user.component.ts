import { Component, OnInit } from '@angular/core';
import { HttpErrorResponse } from '../../../../../node_modules/@angular/common/http';
import { formatDate } from '../../../../../node_modules/@angular/common';

import { CalendarsService } from './../../shared/calendars.service';

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.css']
})
export class UserComponent implements OnInit {

  constructor(
    private service: CalendarsService
  ) { }

  user = {};
  timescale: string;
  events = [];

  getUser(): void {
    this.service.getUser()
      .subscribe(user => {
        // Do something else?
        this.user = user;
      }, (err: HttpErrorResponse) => {
          // console.log(err['status']);
          // 500: Internal Error Component
      });
  }

  // getEvents(): void {
  //   this.service.getCalendar()
  //     .subscribe(events => {
  //       this.timescale = events['timescale'];
  //       this.events = events['events'];
  //       this.events.forEach(event => {
  //         this.service.getName(event['organizer']['email']).subscribe(name => {
  //           event['organizer']['name'] = name['FirstName'] + ' ' + name['LastName'];
  //         }, (err: HttpErrorResponse) => {
  //           // Traiter l'erreur 500
  //         });
  //         event['date'] = this.extractDate(event['start']['dateTime']);
  //         event['start']['dateTime'] = this.extractTime(event['start']['dateTime']);
  //         event['end']['dateTime'] = this.extractTime(event['end']['dateTime']);
  //       });
  //     }, (err: HttpErrorResponse) => {
  //         // console.log(err['status']);
  //         // 500: Internal Error Component
  //     });
  // }

  extractDate(dateISOS: string): string {
    return formatDate(dateISOS, 'fullDate', 'en-US');
  }

  extractTime(dateISOS: string): string {
    return formatDate(dateISOS, 'mediumTime', 'en-US');
  }

  changeTimeScale(newTimeScale: string) {
    this.service.setNewTimeScale(newTimeScale)
      .subscribe(events => {
        this.timescale = events['timescale'];
        this.events = events['events'];
        this.events.forEach(event => {
          this.service.getName(event['organizer']['email']).subscribe(name => {
            event['organizer']['name'] = name['FirstName'] + ' ' + name['LastName'];
          }, (err: HttpErrorResponse) => {
            // Traiter l'erreur 500
          });
          event['date'] = this.extractDate(event['start']['dateTime']);
          event['start']['dateTime'] = this.extractTime(event['start']['dateTime']);
          event['end']['dateTime'] = this.extractTime(event['end']['dateTime']);
        });
      }, (err: HttpErrorResponse) => {
        // console.log(err['status']);
        // 500: Internal Error Component
      });
  }

  getCalendar(timeScale?: string) {
    this.service.getCalendar(timeScale)
      .subscribe(events => {
        this.timescale = events['timescale'];
        this.events = events['events'];
        this.events.forEach(event => {
          this.service.getName(event['organizer']['email']).subscribe(name => {
            event['organizer']['name'] = name['FirstName'] + ' ' + name['LastName'];
          }, (err: HttpErrorResponse) => {
            // Traiter l'erreur 500
          });
          event['date'] = this.extractDate(event['start']['dateTime']);
          event['start']['dateTime'] = this.extractTime(event['start']['dateTime']);
          event['end']['dateTime'] = this.extractTime(event['end']['dateTime']);
        });
      }, (err: HttpErrorResponse) => {
        // console.log(err['status']);
        // 500: Internal Error Component
      });
  }

  ngOnInit() {
    this.getUser();
    this.getCalendar();
  }

}
