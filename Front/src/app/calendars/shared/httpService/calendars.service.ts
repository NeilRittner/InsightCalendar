import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

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

  getCalendar(calendarId, timeScale): Observable<any> {
    let url = `${environment.serveur_url}api/userCalendar?calendarId=${calendarId}`;
    if (timeScale) {
      url = url + `&timescale=${timeScale}`;
    }
    const httpOptions = { withCredentials: true };
    return this.http
      .get(url, httpOptions)
      .pipe(catchError(err => throwError(err)));
  }

  getNameFromEmail(email: string): Observable<any> {
    const url = `${ environment.serveur_url }api/nameFromEmail?email=${email}`;
    const httpOptions = { withCredentials: true };
    return this.http
      .get(url, httpOptions)
      .pipe(catchError(err => throwError(err)));
  }

  getAllRooms(): Observable<any> {
    const url = `${environment.serveur_url}api/allRooms`;

    return this.http
      .get(url)
      .pipe(catchError(err => throwError(err)));
  }

  getAllUsers(): Observable<any> {
    const url = `${environment.serveur_url}api/allUsers`;

    return this.http
      .get(url)
      .pipe(catchError(err => throwError(err)));
  }

  postEvent(event): Observable<any> {
    const url = `${environment.serveur_url}api/createEvent`;
    const httpOptions = event;
    return this.http
      .post(url, httpOptions)
      .pipe(catchError(err => throwError(err)));
  }


}
