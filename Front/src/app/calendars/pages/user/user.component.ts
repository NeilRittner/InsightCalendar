import { Component, OnInit } from '@angular/core';
import { HttpErrorResponse } from '../../../../../node_modules/@angular/common/http';
import { formatDate } from '../../../../../node_modules/@angular/common';

import { CalendarsService } from '../../shared/httpService/calendars.service';
import { DataService } from './../../shared/dataService/data.service';

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.css']
})
export class UserComponent implements OnInit {

  constructor(
    private httpService: CalendarsService,
    private dataService: DataService
  ) { }

  timescale: string;
  events = [];

  getUser(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.httpService.getUser()
        .subscribe(user => {
          // Do something else?
          this.dataService.user = user;
          resolve('');
        }, (err: HttpErrorResponse) => {
          // console.log(err['status']);
          // 500: Internal Error Component
          // reject
        });
    });
  }

  extractDate(dateISOS: string): string {
    return formatDate(dateISOS, 'fullDate', 'en-US');
  }

  extractTime(dateISOS: string): string {
    return formatDate(dateISOS, 'mediumTime', 'en-US');
  }

  getCalendar(timeScale?: string) {
    this.httpService.getCalendar(this.dataService.user['Email'], timeScale)
      .subscribe(events => {
        this.timescale = events['timescale'];
        this.dataService.userTimeScale = events['timescale'];
        this.events = events['events'];
        this.events.forEach(event => {
          this.httpService.getNameFromEmail(event['organizer']['email']).subscribe(name => {
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
    if (JSON.stringify(this.dataService.user) === '{}') {
      this.getUser()
        .then(() => {
          if (this.dataService.userTimeScale) {
            this.getCalendar(this.dataService.userTimeScale);
          } else {
            this.getCalendar();
          }
        });
    }
  }

}
