import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {

  constructor(
    private http: HttpClient
  ) { }

  postGoogleToken(token: string): Observable<any> {
    const url = `${environment.serveur_url}api/googleAccess`;
    const httpBody = { idToken: token };
    const httpOptions = { withCredentials: true };
    return this.http
      .post(url, httpBody, httpOptions)
      .pipe(catchError(err => throwError(err)));
  }

  postCardId(idCard: string) {
    const url = `${environment.serveur_url}api/cardAccess`;
    const httpBody = { idCard: idCard, observe: 'response' };
    const httpOptions = { withCredentials: true };
    return this.http
      .post(url, httpOptions, { withCredentials: true })
      .pipe(catchError(err => throwError(err)));
  }

  postRegisterCard(token: string, idCard: string) {
    const url = `${environment.serveur_url}api/registerCard`;
    const httpBody = { idToken: token, idCard: idCard };
    const httpOptions = { withCredentials: true };
    return this.http
      .post(url, httpBody, httpOptions)
      .pipe(catchError(err => throwError(err)));
  }

  postCode(code: string) {
    const url = `${environment.serveur_url}api/code`;
    const httpBody = { code: code };
    const httpOptions = { withCredentials: true };
    return this.http
      .post(url, httpBody, httpOptions)
      .pipe(catchError(err => throwError(err)));
  }
}
