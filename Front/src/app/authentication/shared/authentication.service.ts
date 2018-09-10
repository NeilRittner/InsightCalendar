import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
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
    const httpHeader = new HttpHeaders();
    httpHeader.append('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
    const httpOptions = { headers: httpHeader, withCredentials: true };
    return this.http
      .post(url, httpBody, httpOptions)
      .pipe(catchError(err => throwError(err)));
  }

  postCardId(idCard: string) {
    const url = `${environment.serveur_url}api/cardAccess`;
    const httpHeader = new HttpHeaders();
    httpHeader.append('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
    const httpBody = { idCard: idCard };
    const httpOptions = { headers: httpHeader, withCredentials: true };
    return this.http
      .post(url, httpBody, httpOptions)
      .pipe(catchError(err => throwError(err)));
  }

  postRegisterCard(token: string, idCard: string) {
    const url = `${environment.serveur_url}api/registerCard`;
    const httpBody = { idToken: token, idCard: idCard };
    const httpHeader = new HttpHeaders();
    httpHeader.append('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
    const httpOptions = { headers: httpHeader, withCredentials: true };
    return this.http
      .post(url, httpBody, httpOptions)
      .pipe(catchError(err => throwError(err)));
  }

  postCode(code: string) {
    const url = `${environment.serveur_url}api/code`;
    const httpBody = { code: code };
    const httpHeader = new HttpHeaders();
    httpHeader.append('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
    const httpOptions = { headers: httpHeader, withCredentials: true };
    return this.http
      .post(url, httpBody, httpOptions)
      .pipe(catchError(err => throwError(err)));
  }
}
