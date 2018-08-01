import { environment } from './../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from '../../node_modules/rxjs';

@Injectable({
  providedIn: 'root'
})

export class RemoteService {

  constructor(private http: HttpClient) { }

  getUser(): Observable<any> {
    const url = `${environment.serveur_url}api/user`;

    return this.http
      .get(url, { withCredentials: true });
  }

}
