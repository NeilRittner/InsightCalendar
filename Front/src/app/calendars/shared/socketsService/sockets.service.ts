import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SocketsService {

  constructor(private socket: Socket) { }

  eventRemoved(): Observable<any> {
    return new Observable(observer => {
      this.socket.on('eventRemoved', data => {
        observer.next(data);
      });
    });
  }

  eventInserted(): Observable<any> {
    return new Observable(observer => {
      this.socket.on('eventInserted', data => {
        observer.next(data);
      });
    });
  }
}
