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
  timeBeforeRemove = 1; // Time in minutes
  months = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
    'August', 'September', 'October', 'November', 'December'];
  timeToWait: number;
  numberScan: number;

  getUser(): void {
    this.httpService.getUser()
      .subscribe(user => {
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
        this.calendarTreatments(events);
      }, (err: HttpErrorResponse) => {
        // console.log(err['status']);
        // 500: Internal Error Component
      });
  }


  calendarTreatments(events): void {
    this.timescale = events['timescale'];
    this.events = events['events'];
    this.nextEvent = [];
    for (let i = 0; i < this.events.length; i++) {
      const event = this.events[i];
      event['date'] = this.extractDate(event['start']['dateTime']);
      event['start']['dateTime'] = this.extractTime(event['start']['dateTime']);
      event['end']['dateTime'] = this.extractTime(event['end']['dateTime']);

      const now = new Date();
      const startTimeArr = event['start']['dateTime'].split(':');
      const startTimeH = this.convert12To24(event['start']['dateTime'], startTimeArr[1].split(' ')[1]).toString();
      const nowBisTime = now.getTime() - this.timeBeforeRemove * 60 * 1000;
      const dateArr = event['date'].split(', ');
      const startBisTime = new Date(dateArr[2], this.months.indexOf(dateArr[1].split(' ')[0]),
        dateArr[1].split(' ')[1], parseInt(startTimeH, 10), parseInt(startTimeArr[1].split(' ')[0], 10)).getTime();

      if (nowBisTime <= startBisTime && this.nextEvent.length === 0) {
        this.nextEvent = event;
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
    this.httpService.postUserPosition(this.idCardControl.value, this.selectedRoom['Name'])
      .subscribe(move => {
        if (move === 'in') {
          this.occupancy = this.occupancy + 1;
        } else {
          this.occupancy = this.occupancy - 1;
          this.updateEndEvent();
        }
      }, (err: HttpErrorResponse) => {
        // console.log(err);
        // 500: Internal Error Component
      });
    this.idCardControl.reset();
  }


  updateEndEvent(): void {
    const res = this.eventCurrently();
    const currentEvent = res[0];
    const posInEvents = res[1];

    if (currentEvent) {
      this.httpService.updateEndEvent(currentEvent['organizer']['email'], currentEvent['id'], new Date())
        .subscribe(eventUpdated => {
          eventUpdated['date'] = this.extractDate(eventUpdated['start']['dateTime']);
          eventUpdated['start']['dateTime'] = this.extractTime(eventUpdated['start']['dateTime']);
          eventUpdated['end']['dateTime'] = this.extractTime(eventUpdated['end']['dateTime']);
          this.events[posInEvents] = eventUpdated;
          this.events = this.events.slice();
        }, (err: HttpErrorResponse) => {
          // console.log(err['status']);
          // 500: Internal Error Component
        });
    }
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
    if (this.occupancy === 0) {
      this.cancelEvent(eventToVerify, this.selectedRoom['Email']);
    } else {
      this.httpService.verifyOccupancy(this.selectedRoom['Name'], eventToVerify)
        .subscribe(res => {
          if (res === 'no') {
            this.cancelEvent(eventToVerify, this.selectedRoom['Email']);
          }
        }, (err: HttpErrorResponse) => {
          // console.log(err['status']);
          // 500: Internal Error Component
        });
    }
  }


  cancelEvent(eventToCancel, roomEmail): void {
    this.httpService.cancelEvent(eventToCancel['organizer']['email'], eventToCancel['id'], roomEmail)
      .subscribe(events => {
        if (this.selectedRoom) {
          let index = -1;
          for (let i = 0; i < events['events'].length; i++) {
            if (events['events'][i]['id'] === eventToCancel['id']) {
              index = i;
            }
          }
          if (index !== -1) {
            events['events'] = (events['events'].slice(0, index)).concat(events['events'].slice(index + 1));
          }
          this.calendarTreatments(events);
        }
      }, (err: HttpErrorResponse) => {
        // console.log(err['status']);
        // 500: Internal Error Component
      });
  }


  eventCurrently(): any {
    let currentEvent = null;
    let posInEvents = 0;
    const now = new Date();
    const nowDate = this.extractDate(now.toISOString());
    const nowTime = now.getTime();

    for (let i = 0; i < this.events.length; i++) {
      const event = this.events[i];
      const eventStartArr = event['start']['dateTime'].split(':');
      const eventEndArr = event['end']['dateTime'].split(':');
      const eventStartHour = eventStartArr[0];
      const eventStartMoment = eventStartArr[1].split(' ')[1];
      const eventStartHour24 = this.convert12To24(eventStartHour, eventStartMoment);
      const eventEndHour = eventEndArr[0];
      const eventEndMoment = eventEndArr[1].split(' ')[1];
      const eventEndHour24 = this.convert12To24(eventEndHour, eventEndMoment);
      const dateArr = event['date'].split(', ');
      const startTime = new Date(dateArr[2], this.months.indexOf(dateArr[1].split(' ')[0]),
        dateArr[1].split(' ')[1], eventStartHour24, parseInt(eventStartArr[1].split(' ')[0], 10)).getTime();
      const endTime = new Date(dateArr[2], this.months.indexOf(dateArr[1].split(' ')[0]),
        dateArr[1].split(' ')[1], eventEndHour24, parseInt(eventEndArr[1].split(' ')[0], 10)).getTime();

      if (nowDate === event['date'] && startTime <= nowTime && endTime >= nowTime) {
        currentEvent = event;
        posInEvents = i;
      }
    }

    return [currentEvent, posInEvents];
  }


  ngOnInit() {
    if (JSON.stringify(this.dataService.user) === '{}') {
      this.getUser();
    }
    this.getRooms();
  }

}
