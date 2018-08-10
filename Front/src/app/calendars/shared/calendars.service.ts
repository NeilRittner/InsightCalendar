import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CalendarsService {

  constructor(
    private http: HttpClient
  ) { }

  getUser(): Observable<any> {
    const url = `${environment.serveur_url}api/currentUser`;
    const httpOptions = { withCredentials: true };
    return this.http
      .get(url, httpOptions)
      .pipe(catchError(err => throwError(err)));
  }

  getCalendar(): Observable<any> {
    const url = `${environment.serveur_url}api/userCalendar`;
    const httpOptions = { withCredentials: true };
    return this.http
      .get(url, httpOptions)
      .pipe(catchError(err => throwError(err)));
  }

}
