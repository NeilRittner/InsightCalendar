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
    const httpOptions = { withCredentials: true, idToken: token, responseType: 'text' };

    return this.http
      .post<number>(url, httpOptions);
  }

  postCardId(idCard: string) {
    const url = `${environment.serveur_url}api/cardAccess`;
    const httpOptions = { withCredentials: true, idCard: idCard, responseType: 'text' };

    return this.http
      .post<number>(url, httpOptions);
  }

  postRegisterCard(token: string, idCard: string) {
    const url = `${environment.serveur_url}api/registerCard`;
    const httpOptions = { withCredentials: true, idToken: token, idCard: idCard, responseType: 'text' };

    return this.http
      .post<number>(url, httpOptions);
  }

  getUser(): Observable<any> {
    const url = `${environment.serveur_url}api/user`;
    const httpOptions = { withCredentials: true };

    return this.http
      .get(url, httpOptions);
  }

}
