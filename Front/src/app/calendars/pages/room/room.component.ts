import { Component, OnInit } from '@angular/core';
import { HttpErrorResponse } from '../../../../../node_modules/@angular/common/http';
import { formatDate } from '../../../../../node_modules/@angular/common';
import { FormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { faTimes } from '@fortawesome/free-solid-svg-icons';

import { CalendarsService } from '../../shared/httpService/calendars.service';
import { DataService } from './../../shared/dataService/data.service';

@Component({
  selector: 'app-room',
  templateUrl: './room.component.html',
  styleUrls: ['./room.component.css']
})
export class RoomComponent implements OnInit {

  constructor(
    private httpService: CalendarsService,
    private dataService: DataService
  ) { }

  timescale: string;
  events = [];
  idCardControl = new FormControl();
  occupancy: number;
  roomsControl = new FormControl(); // FormControl for room
  roomsAutocomplete = []; // Autocomplete of rooms
  filteredRooms: Observable<any>; // List of rooms filtered according to box content
  selectedRoom;
  faTimes = faTimes;
  nextEvent: Array<any>;
  timeBeforeRemove = 10; // Time in minutes
  months = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
    'August', 'September', 'October', 'November', 'December'];
  timeToWait: number;

  getUser(): void {
    this.httpService.getUser()
      .subscribe(user => {
        // Do something else?
        this.dataService.user = user;
      }, (err: HttpErrorResponse) => {
        // console.log(err['status']);
        // 500: Internal Error Component
      });
  }


  getRooms(): void {
    this.httpService.getAllRooms()
      .subscribe(rooms => {
        this.roomsAutocomplete = rooms;
        this.setFilteredRoomsAutocomplete();
      }, (err: HttpErrorResponse) => {
        // console.log(err['status']);
        // 500: Internal Error Component
      });
  }


  roomsFilter(name: string) {
    const filterValue = name.toLowerCase();

    return this.roomsAutocomplete.filter(room => (room['Name']).toLowerCase().includes(filterValue));
  }


  setFilteredRoomsAutocomplete(): void {
    this.filteredRooms = this.roomsControl.valueChanges
      .pipe(
        startWith(''),
        map(name => name ? this.roomsFilter(name) : this.roomsAutocomplete.slice()),
      );
  }


  setRoom(room): void {
    this.selectedRoom = room;
    this.getOccupancy(this.selectedRoom['Name']);
    this.getCalendar(this.selectedRoom['Email']);
  }


  clearRoom(): void {
    this.events = [];
    this.timescale = '';
    this.selectedRoom = null;
    this.roomsControl.reset();
  }


  getCalendar(calendarId, timeScale?: string): void {
    this.httpService.getCalendar(calendarId, timeScale)
      .subscribe(events => {
        this.timescale = events['timescale'];
        this.events = events['events'];
        this.nextEvent = [];
        for (let i = 0; i < this.events.length; i++) {
          const event = this.events[i];
          this.httpService.getNameFromEmail(event['organizer']['email'])
            .subscribe(name => {
              if (name) {
                event['organizer']['name'] = name['FirstName'] + ' ' + name['LastName'];
              } else {
                event['organizer']['name'] = null;
              }
            }, (err: HttpErrorResponse) => {
              // Traiter l'erreur 500
            });
          event['date'] = this.extractDate(event['start']['dateTime']);
          event['start']['dateTime'] = this.extractTime(event['start']['dateTime']);
          event['end']['dateTime'] = this.extractTime(event['end']['dateTime']);

          const now = new Date();
          const startTimeArr = event['start']['dateTime'].split(':');
          const startTimeH = this.convert12To24(event['start']['dateTime'], startTimeArr[1].split(' ')[1]).toString();
          const nowISOS = now.toISOString();
          const nowDay = this.extractDate(nowISOS);
          const nowBisTime = now.getTime() - this.timeBeforeRemove * 60 * 1000;
          const dateArr = event['date'].split(', ');
          const startBisTime = new Date(dateArr[2], this.months.indexOf(dateArr[1].split(' ')[0]),
          dateArr[1].split(' ')[1], parseInt(startTimeH, 10), parseInt(startTimeArr[1].split(' ')[0], 10)).getTime();

          if (nowDay === event['date'] && nowBisTime <= startBisTime && this.nextEvent.length === 0) {
            this.nextEvent.push(event);
            if (now.getTime() >= startBisTime) {
              this.timeToWait = this.timeBeforeRemove * 60 * 1000 - (now.getTime() - startBisTime);
            } else {
              this.timeToWait = startBisTime - nowBisTime;
            }
          }
        }

        setTimeout(() => {
          this.verifyOccupancy(this.nextEvent);
        }, this.timeToWait);
      }, (err: HttpErrorResponse) => {
        // console.log(err['status']);
        // 500: Internal Error Component
      });
  }


  extractDate(dateISOS: string): string {
    return formatDate(dateISOS, 'fullDate', 'en-US');
  }


  extractTime(dateISOS: string): string {
    return formatDate(dateISOS, 'shortTime', 'en-US');
  }


  convert12To24(time, moment): number {
    if (moment === 'PM' && time !== '12') {
      return (parseInt(time, 10) + 12);
    } else {
      return parseInt(time, 10);
    }
  }


  setUserPosition(): void {
    // In this function, test if it's the meeting
    this.httpService.postUserPosition(this.idCardControl.value, this.selectedRoom['Name'])
      .subscribe(move => {
        if (move === 'in') {
          this.occupancy = this.occupancy + 1;
        } else {
          this.occupancy = this.occupancy - 1;
        }
      }, (err: HttpErrorResponse) => {
        console.log(err);
        // 500: Internal Error Component
      });
    this.idCardControl.reset();
  }


  getOccupancy(roomName): void {
    this.httpService.getRoomOccupancy(roomName)
      .subscribe(occupancy => {
        this.occupancy = occupancy['Occupancy'];
      }, (err: HttpErrorResponse) => {
        // console.log(err['status']);
        // 500: Internal Error Component
      });
  }


  verifyOccupancy(eventToVerify): void {
    console.log('il est 14h40 fdp');
    if (this.occupancy === 0) {
      console.log('je vais supprimer');
      this.httpService.cancelEvent(eventToVerify[0]['organizer']['email'], eventToVerify[0]['id'])
        .subscribe(() => {
          this.getCalendar(this.selectedRoom['Email']);
          console.log('j ai supprimé');
        }, (err: HttpErrorResponse) => {
          console.log('j ai pas supprimé');
          // console.log(err['status']);
          // 500: Internal Error Component
        });
    } else {
      this.httpService.verifyOccupancy(this.selectedRoom['Name'], eventToVerify)
        .subscribe(res => {
          if (res === 'no') {
            this.httpService.cancelEvent(eventToVerify[0]['organizer']['email'], eventToVerify[0]['id'])
              .subscribe(() => {
                console.log('j ai supprimé');
                this.getCalendar(this.selectedRoom['Email']);
              }, (err: HttpErrorResponse) => {
                console.log('j ai pas supprimé');
                // console.log(err['status']);
                // 500: Internal Error Component
              });
          }
        }, (err: HttpErrorResponse) => {
          console.log('erreur');
          // console.log(err['status']);
          // 500: Internal Error Component
        });
      // Requeter serveur to know if there is someone who is an attendee
      // If yes --> nothing, event is ok
      // Else --> no one of the meeting --> cancel the meeting
    }
  }


  ngOnInit() {
    if (JSON.stringify(this.dataService.user) === '{}') {
      this.getUser();
    }
    this.getRooms();
  }

}
