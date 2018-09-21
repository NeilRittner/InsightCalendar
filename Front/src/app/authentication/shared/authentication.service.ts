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


  /**
   * @param {string} token: the token sent by google
   * This function requests the server to authenticate the token sent by google
   * @returns {Observable<any>}
   */
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

  /**
   * @param {string} idCard: the id/number of the scanned card
   * This function requests the server to verify if the scanned card is associated to a user
   * @returns {Observable<any>}
   */
  postCardId(idCard: string): Observable<any>  {
    const url = `${environment.serveur_url}api/cardAccess`;
    const httpHeader = new HttpHeaders();
    httpHeader.append('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
    const httpBody = { idCard: idCard };
    const httpOptions = { headers: httpHeader, withCredentials: true };
    return this.http
      .post(url, httpBody, httpOptions)
      .pipe(catchError(err => throwError(err)));
  }

  /**
   * @param {string} token: the token sent by google
   * @param {string} idCard: the id/number of the scanned card
   * This function requests the server to associate the scanned card to the google user (according to the token)
   * @returns {Observable<any>}
   */
  postRegisterCard(token: string, idCard: string): Observable<any>  {
    const url = `${environment.serveur_url}api/registerCard`;
    const httpBody = { idToken: token, idCard: idCard };
    const httpHeader = new HttpHeaders();
    httpHeader.append('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
    const httpOptions = { headers: httpHeader, withCredentials: true };
    return this.http
      .post(url, httpBody, httpOptions)
      .pipe(catchError(err => throwError(err)));
  }

  /**
   * @param {string} code: the code sent by google to get the access and refresh tokens
   * This function sends the code to exchange it against the tokens (done in the server-side)
   * @returns {Observable<any>}
   */
  postCode(code: string): Observable<any>  {
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
