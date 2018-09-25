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

  /**
   * This function sends a http request (get) to the server to get information about the user
   * @return {Observable<any>}: Observable with the information (JSON Object)
   */
  getUser(): Observable<any> {
    const url = `${environment.serveur_url}api/currentUser`;
    const httpOptions = { withCredentials: true };
    return this.http
      .get(url, httpOptions)
      .pipe(catchError(err => throwError(err)));
  }

  /**
   * @param {string} calendarId: the id of the calendar to pool (usualy a mail address, can be primary as well)
   * @param {string} timeScale: the timescale (Day/Week/Month)
   * This function sends a http request (get) to the server to get the calendar
   * of the given user with the given timescale (optional, will be 'Week' by default)
   * @return {Observable<any>}: Observable with the information (Array)
   */
  getCalendar(calendarId: string, timeScale?: string): Observable<any> {
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

  /**
   * This function sends a http request (get) to the server to get the information of the 4 rooms
   * @return {Observable<any>}: Observable with the information (Array)
   */
  getAllRooms(): Observable<any> {
    const url = `${environment.serveur_url}api/allRooms`;
    const httpOptions = { withCredentials: true };
    return this.http
      .get(url, httpOptions)
      .pipe(catchError(err => throwError(err)));
  }

  /**
   * This function sends a http request (get) to the server to get the information of all users
   * @return {Observable<any>}: Observable with the information (Array)
   */
  getAllUsers(): Observable<any> {
    const url = `${environment.serveur_url}api/allUsers`;
    const httpOptions = { withCredentials: true };
    return this.http
      .get(url, httpOptions)
      .pipe(catchError(err => throwError(err)));
  }

  /**
   * @param event: The information about the event to create
   * This function sends a http request (post) to the server to create an event
   * @return {Observable<any>}: Observable to know if the event is created or not
   */
  postEvent(event): Observable<any> {
    const url = `${environment.serveur_url}api/createEvent`;
    const httpOptions = { responseType: 'text' as 'text', withCredentials: true };
    return this.http
      .post(url, event, httpOptions)
      .pipe(catchError(err => throwError(err)));
  }

  /**
   * @param userIdCard: the id/number of the scanned card
   * @param roomName: the name of the room where the users scanned his card
   * This function sends a http request (post) to the server to update the position of the user
   * according to the parameters
   * @return {Observable<any>}: Observable to know the message to display on the screen
   */
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

  /**
   * @param organizerEmail: the main organizer's email address
   * @param eventId: the id of the event to cancel
   * @param roomEmail: the email address of room of the event
   * This function sends a http request (post) to the server to cancel an event
   * @return {Observable<any>}: Observable to know if the event is cancelled or not
   */
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

  /**
   * @param organizerEmail: the main organizer's email address
   * @param eventId: the id of the event to update
   * @param newEnd: the new end (dateTime)
   * This function sends a http request (post) to the server
   * @return {Observable<any>}: Observable to know if the event is updated or not
   */
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

  /**
   * @param roomName: the name of a room
   * This function sends a http request (get) to the server to get some information about the given room
   * @return {Observable<any>}: Observable with the information (JSON Object)
   */
  getRoomInformation(roomName): Observable<any> {
    const url = `${environment.serveur_url}api/roomInformation?roomName=${roomName}`;
    const httpOptions = { withCredentials: true };
    return this.http
      .get(url, httpOptions)
      .pipe(catchError(err => throwError(err)));
  }

  /**
   * @param organizerEmail: the main organizer's email address
   * @param eventId: the id of the event that we want to verify the presence of the organizers
   * @param roomName: the name room of the event
   * This function sends a http request (get) to the server to know if one of the organizers
   * of the given event is in the room or not
   * @return {Observable<any>}: Observable with 'yes' (one of the organizers is in the room) or 'no'
   */
  organizersAttendance(organizerEmail, eventId, roomName): Observable<any> {
    const url = `${environment.serveur_url}api/organizersAttendance?` +
    `organizerEmail=${organizerEmail}&eventId=${eventId}&roomName=${roomName}`;
    const httpOptions = { responseType: 'text' as 'text', withCredentials: true };
    return this.http
      .get(url, httpOptions)
      .pipe(catchError(err => throwError(err)));
  }

  /**
   * @param idCard: the id/number of the scanned card
   * @param organizerEmail: the main organizer's email address
   * @param eventId: the id of an event
   * This function sends a http request (get) to the server to know if the person who scanned his card
   * is one of the organizers of the given event
   * @return {Observable<any>}: Observable with 'yes' (one of the organizers scanned his card) or 'no'
   */
  organizersScan(idCard, organizerEmail, eventId): Observable<any> {
    const url = `${environment.serveur_url}api/organizersScan?idCard=${idCard}` +
      `&organizerEmail=${organizerEmail}&eventId=${eventId}`;
    const httpOptions = { responseType: 'text' as 'text', withCredentials: true };
    return this.http
      .get(url, httpOptions)
      .pipe(catchError(err => throwError(err)));
  }
}
