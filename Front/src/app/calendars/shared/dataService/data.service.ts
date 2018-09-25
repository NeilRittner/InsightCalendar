import { Router } from '@angular/router';
import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { CalendarsService } from './../httpService/calendars.service';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  constructor(
    private httpService: CalendarsService,
    private router: Router
    ) { }

  public user = {};

  /**
   * This function calls a function to get some information about the user
   * @return {Promise<any>}: Promise with information about the user
   */
  getUser(): Promise<any> {
    return new Promise((resolve) => {
      this.httpService.getUser()
        .subscribe(user => {
          this.user = user;
          resolve();
        }, (err: HttpErrorResponse) => {
          this.router.navigate(['/server-error', 'Internal Error']);
        });
    });
  }
}
