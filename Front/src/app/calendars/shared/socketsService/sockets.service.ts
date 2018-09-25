import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SocketsService {

  constructor(private socket: Socket) { }

  /**
   * This function catches the event 'eventRemoved' and send the data to the Observer
   * @return {Observable<any>}: Obsevable with data (JSON Object) about the removed event
   */
  eventRemoved(): Observable<any> {
    return new Observable(observer => {
      this.socket.on('eventRemoved', data => {
        observer.next(data);
      });
    });
  }

  /**
   * This function catches the event 'eventInserted' and send the data to the Observer
   * @return {Observable<any>}: Obsevable with data (JSON Object) about the inserted event
   */
  eventInserted(): Observable<any> {
    return new Observable(observer => {
      this.socket.on('eventInserted', data => {
        observer.next(data);
      });
    });
  }

  /**
   * This function catches the event 'updateOccupancy' and send the data to the Observer
   * @return {Observable<any>}: Obsevable with data (JSON Object) about the occupancy of a room
   */
  updateOccupancy(): Observable<any> {
    return new Observable(observer => {
      this.socket.on('updateOccupancy', data => {
        observer.next(data);
      });
    });
  }
}
