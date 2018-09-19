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

  getCalendar(calendarId, timeScale?: string): Observable<any> {
    let url = `${environment.serveur_url}api/userCalendar?calendarId=${calendarId}`;
    if (timeScale) {
      url = url + `&timescale=${timeScale}`;
    } else {
      url = url + `&timescale=Week`;
    }
    const httpOptions = { withCredentials: true };
    return this.http
      .get(url, httpOptions)
      .pipe(catchError(err => throwError(err)));
  }

  getAllRooms(): Observable<any> {
    const url = `${environment.serveur_url}api/allRooms`;
    const httpOptions = { withCredentials: true };
    return this.http
      .get(url, httpOptions)
      .pipe(catchError(err => throwError(err)));
  }

  getAllUsers(): Observable<any> {
    const url = `${environment.serveur_url}api/allUsers`;
    const httpOptions = { withCredentials: true };
    return this.http
      .get(url, httpOptions)
      .pipe(catchError(err => throwError(err)));
  }

  postEvent(event): Observable<any> {
    const url = `${environment.serveur_url}api/createEvent`;
    const httpOptions = { responseType: 'text' as 'text', withCredentials: true };
    return this.http
      .post(url, event, httpOptions)
      .pipe(catchError(err => throwError(err)));
  }

  postUserPosition(userIdCard, roomName): Observable<any> {
    const url = `${environment.serveur_url}api/updatePosition`;
    const httpBody = {
      userIdCard: userIdCard,
      roomName: roomName,
    };
    const httpOptions = { responseType: 'text' as 'text', withCredentials: true };
    return this.http
      .post(url, httpBody, httpOptions)
      .pipe(catchError(err => throwError(err)));
  }

  cancelEvent(organizerEmail, eventId, roomEmail): Observable<any> {
    const url = `${environment.serveur_url}api/cancelEvent`;
    const httpBody = {
      organizerEmail: organizerEmail,
      eventId: eventId,
      roomEmail: roomEmail
    };
    const httpOptions = { withCredentials: true };
    return this.http
      .post(url, httpBody, httpOptions)
      .pipe(catchError(err => throwError(err)));
  }

  updateEndEvent(organizerEmail, eventId, newEnd): Observable<any> {
    const url = `${environment.serveur_url}api/updateEndEvent`;
    const httpBody = {
      organizerEmail: organizerEmail,
      eventId: eventId,
      newEnd: newEnd
    };
    const httpOptions = { withCredentials: true };
    return this.http
      .post(url, httpBody, httpOptions)
      .pipe(catchError(err => throwError(err)));
  }

  getRoomInformation(roomName): Observable<any> {
    const url = `${environment.serveur_url}api/roomInformation?roomName=${roomName}`;
    const httpOptions = { withCredentials: true };
    return this.http
      .get(url, httpOptions)
      .pipe(catchError(err => throwError(err)));
  }

  organizersAttendance(organizerEmail, eventId, roomName): Observable<any> {
    const url = `${environment.serveur_url}api/organizersAttendance?` +
    `organizerEmail=${organizerEmail}&eventId=${eventId}&roomName=${roomName}`;
    const httpOptions = { responseType: 'text' as 'text', withCredentials: true };
    return this.http
      .get(url, httpOptions)
      .pipe(catchError(err => throwError(err)));
  }
}
