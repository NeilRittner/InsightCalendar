import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { CalendarsService } from './../httpService/calendars.service';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  constructor(private httpService: CalendarsService) { }

  public user = {};

  getUser(): Promise<any> {
    return new Promise((resolve) => {
      this.httpService.getUser()
        .subscribe(user => {
          this.user = user;
          resolve();
        }, (err: HttpErrorResponse) => {
          // console.log(err['status']);
          // 500: Internal Error Component
        });
    });
  }
}
