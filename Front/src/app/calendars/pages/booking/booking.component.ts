import { Component, OnInit } from '@angular/core';
import { HttpErrorResponse } from '../../../../../node_modules/@angular/common/http';

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
    private dataService: DataService
  ) { }

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

  ngOnInit() {
    if (JSON.stringify(this.dataService.user) === '{}') {
      this.getUser();
    }
  }

}
