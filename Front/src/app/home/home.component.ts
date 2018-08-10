import { RemoteService } from './../remote.service';
import { Component, OnInit } from '@angular/core';
import { HttpErrorResponse } from '../../../node_modules/@angular/common/http';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})

export class HomeComponent implements OnInit {
  constructor(private service: RemoteService) { }

  user = {};
  events = {};

  setUser(): void {
    this.service.getUser()
    .subscribe(user => {
      // Do something else
      this.user = user;
    },
    (err: HttpErrorResponse) => {
      // console.log(err['status']);
      // 500: Internal Error Component
    });
  }

  setEvents(): void {
    this.service.getCalendar()
      .subscribe(events => {
        console.log(events);
      },
      (err: HttpErrorResponse) => {
        // console.log(err['status']);
        // 500: Internal Error Component
      });
  }

  ngOnInit() {
    this.setUser();
    this.setEvents();
  }

}
