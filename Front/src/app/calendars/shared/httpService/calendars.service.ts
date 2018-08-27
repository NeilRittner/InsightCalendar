import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { text } from '@angular/core/src/render3/instructions';

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

  postUserPosition(userIdCard, roomName): Observable<any> {
    const url = `${environment.serveur_url}api/updatePosition`;
    const httpOptions = {
      userIdCard: userIdCard,
      roomName: roomName,
    };
    return this.http
      .post(url, httpOptions, { responseType: 'text' })
      .pipe(catchError(err => throwError(err)));
  }

  getRoomOccupancy(roomName): Observable<any> {
    const url = `${environment.serveur_url}api/roomOccupancy?roomName=${roomName}`;
    return this.http
      .get(url)
      .pipe(catchError(err => throwError(err)));
  }

  cancelEvent(organizerEmail, eventId): Observable<any> {
    const url = `${environment.serveur_url}api/cancelEvent`;
    const httpOptions = {
      organizerEmail: organizerEmail,
      eventId: eventId
    };

    return this.http
      .post(url, httpOptions)
      .pipe(catchError(err => throwError(err)));
  }

  verifyOccupancy(roomToVerify, eventToVerify): Observable<any> {
    const url = `${environment.serveur_url}api/cancelEvent`;
    const httpOptions = {
      roomToVerify: roomToVerify,
      eventToVerify: eventToVerify
    };

    return this.http
      .post(url, httpOptions, { responseType: 'text' })
      .pipe(catchError(err => throwError(err)));
  }

}
