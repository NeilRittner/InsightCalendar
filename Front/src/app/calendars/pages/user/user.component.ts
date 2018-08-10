import { Component, OnInit } from '@angular/core';
import { HttpErrorResponse } from '../../../../../node_modules/@angular/common/http';

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
  events = {};

  setUser(): void {
    this.service.getUser()
      .subscribe(user => {
        // Do something else
        this.user = user;
      }, (err: HttpErrorResponse) => {
          // console.log(err['status']);
          // 500: Internal Error Component
      });
  }

  setEvents(): void {
    this.service.getCalendar()
      .subscribe(events => {
        console.log(events);
      }, (err: HttpErrorResponse) => {
          // console.log(err['status']);
          // 500: Internal Error Component
      });
  }

  ngOnInit() {
    this.setUser();
    this.setEvents();
  }

}
