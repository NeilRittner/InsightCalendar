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

  getCalendar(timeScale): Observable<any> {
    let url = `${environment.serveur_url}api/userCalendar`;
    if (timeScale) {
      url = url + `?timescale=${timeScale}`;
    }
    const httpOptions = { withCredentials: true };
    return this.http
      .get(url, httpOptions)
      .pipe(catchError(err => throwError(err)));
  }

  getName(email: string): Observable<any> {
    const url = `${ environment.serveur_url }api/name?email=${email}`;
    const httpOptions = { withCredentials: true };
    return this.http
      .get(url, httpOptions)
      .pipe(catchError(err => throwError(err)));
  }

  setNewTimeScale(newTimeScale: string): Observable<any> {
    const url = `${environment.serveur_url}api/changeTimeScale?timescale=${newTimeScale}`;
    const httpOptions = { withCredentials: true };
    return this.http
      .get(url, httpOptions)
      .pipe(catchError(err => throwError(err)));
  }

  postEvent(title, startDate, endDate): Observable<any> {
    const url = `${environment.serveur_url}api/createEvent`;
    const httpOptions = {
      title: title,
      startDate: startDate,
      endDate: endDate,
    };
    return this.http
      .post(url, httpOptions)
      .pipe(catchError(err => throwError(err)));
  }

}
