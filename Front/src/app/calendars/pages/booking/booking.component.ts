import { Component, OnInit } from '@angular/core';
import { HttpErrorResponse } from '../../../../../node_modules/@angular/common/http';
import { Router } from '@angular/router';

import { CalendarsService } from '../../shared/httpService/calendars.service';
import { DataService } from './../../shared/dataService/data.service';

@Component({
  selector: 'app-booking',
  templateUrl: './booking.component.html',
  styleUrls: ['./booking.component.css']
})
export class BookingComponent implements OnInit {

  constructor(
    private httpService: CalendarsService,
    private dataService: DataService,
    private router: Router
  ) { }

  title: string;
  startDate: Date;
  endDate: Date;

  getUser(): void {
    this.httpService.getUser()
      .subscribe(user => {
        // Do something else?
        this.dataService.user = user;
      }, (err: HttpErrorResponse) => {
        // console.log(err['status']);
        // 500: Internal Error Component
      });
  }

  createEvent(): void {
    // Some verifications about the time
    if (this.startDate < this.endDate) {
      this.httpService.postEvent(this.title, this.startDate, this.endDate)
        .subscribe(() => {
          this.router.navigate(['/user']);
        }, (err: HttpErrorResponse) => {
          // console.log(err['status']);
          // 500: Internal Error Component
        });
    } else {
      // Probleme date de fin < date de début
      console.log('issue in the date');
    }
  }

  ngOnInit() {
    if (JSON.stringify(this.dataService.user) === '{}') {
      this.getUser();
    }
    const now = new Date();
    const min = now.getMinutes() + 5 - (now.getMinutes() % 5);
    this.startDate = new Date();
    this.startDate.setMinutes(min);
    this.startDate.setSeconds(0);
    this.endDate = new Date();
    this.endDate.setMinutes(min);
    this.endDate.setSeconds(0);
  }

}
