import { environment } from './../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})

export class RemoteService {

  constructor(private http: HttpClient) { }

  postGoogleToken(token: string): Observable<any> {
    const url = `${environment.serveur_url}api/googleAccess`;
    const httpOptions = { withCredentials: true, idToken: token };
    return this.http
      .post(url, httpOptions)
      .pipe(catchError(err => throwError(err)));
  }

  postCardId(idCard: string) {
    const url = `${environment.serveur_url}api/cardAccess`;
    const httpOptions = { withCredentials: true, idCard: idCard, observe: 'response' };
    return this.http
      .post(url, httpOptions)
      .pipe(catchError(err => throwError(err)));
  }

  postRegisterCard(token: string, idCard: string) {
    const url = `${environment.serveur_url}api/registerCard`;
    const httpOptions = { withCredentials: true, idToken: token, idCard: idCard, observe: 'response' };
    return this.http
      .post(url, httpOptions)
      .pipe(catchError(err => throwError(err)));
  }

  postCode(code: string) {
    const url = `${environment.serveur_url}api/code`;
    const httpOptions = { withCredentials: true, code: code, observe: 'response' };
    return this.http
      .post(url, httpOptions)
      .pipe(catchError(err => throwError(err)));
  }

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
