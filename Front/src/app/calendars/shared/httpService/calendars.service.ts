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
    const httpOptions = { withCredentials: true };
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

  getRoomOccupancy(roomName): Observable<any> {
    const url = `${environment.serveur_url}api/roomOccupancy?roomName=${roomName}`;
    const httpOptions = { withCredentials: true };
    return this.http
      .get(url, httpOptions)
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

  verifyOccupancy(roomToVerify, eventToVerify): Observable<any> {
    const url = `${environment.serveur_url}api/verifyOccupancy`;
    const httpBody = {
      roomToVerify: roomToVerify,
      eventToVerify: eventToVerify
    };
    const httpOptions = { responseType: 'text' as 'text', withCredentials: true };
    return this.http
      .post(url, httpBody, httpOptions)
      .pipe(catchError(err => throwError(err)));
  }

  updateEndEvent(calendarId, eventId, newEnd): Observable<any> {
    const url = `${environment.serveur_url}api/updateEndEvent`;
    const httpBody = {
      calendarId: calendarId,
      eventId: eventId,
      newEnd: newEnd
    };
    const httpOptions = { withCredentials: true };
    return this.http
      .post(url, httpBody, httpOptions)
      .pipe(catchError(err => throwError(err)));
  }

  getCalendarAfterRemove(calendarId, eventId): Observable<any> {
    const url = `${environment.serveur_url}api/calendarAfterRemove?calendarId=${calendarId}&evetId=${eventId}`;
    const httpOptions = { withCredentials: true };
    return this.http
      .get(url, httpOptions)
      .pipe(catchError(err => throwError(err)));
  }

}
