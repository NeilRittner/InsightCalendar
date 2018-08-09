import { environment } from './../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from '../../node_modules/rxjs';

@Injectable({
  providedIn: 'root'
})

export class RemoteService {

  constructor(private http: HttpClient) { }

  postGoogleToken(token: string) {
    const url = `${environment.serveur_url}api/googleAccess`;
    const httpOptions = { withCredentials: true, idToken: token };
    return this.http
      .post(url, httpOptions);
  }

  postCardId(idCard: string) {
    const url = `${environment.serveur_url}api/cardAccess`;
    const httpOptions = { withCredentials: true, idCard: idCard, responseType: 'text' };
    return this.http
      .post(url, httpOptions);
  }

  postRegisterCard(token: string, idCard: string) {
    const url = `${environment.serveur_url}api/registerCard`;
    const httpOptions = { withCredentials: true, idToken: token, idCard: idCard };
    return this.http
      .post(url, httpOptions);
  }

  postCode(code: string) {
    const url = `${environment.serveur_url}api/code`;
    const httpOptions = { withCredentials: true, code: code };
    return this.http
      .post(url, httpOptions);
  }

  getUser(): Observable<any> {
    const url = `${environment.serveur_url}api/currentUser`;
    const httpOptions = { withCredentials: true };
    return this.http
      .get(url, httpOptions);
  }

  getCalendar() {
    const url = `${environment.serveur_url}api/userCalendar`;
    const httpOptions = { withCredentials: true };
    return this.http
      .get(url, httpOptions);
  }

}
