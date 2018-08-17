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

  roomsControl = new FormControl(); // FormControl for room
  roomsAutocomplete = []; // Autocomplete of rooms
  filteredRooms: Observable<any>; // List of rooms filtered according to box content
  selectedRoom;

  faTimes = faTimes;

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


  getCalendar(calendarId, timeScale?: string) {
    this.httpService.getCalendar(calendarId, timeScale)
      .subscribe(events => {
        this.timescale = events['timescale'];
        this.dataService.userTimeScale = events['timescale'];
        this.events = events['events'];
        this.events.forEach(event => {
          this.httpService.getNameFromEmail(event['organizer']['email']).subscribe(name => {
            event['organizer']['name'] = name['FirstName'] + ' ' + name['LastName'];
          }, (err: HttpErrorResponse) => {
            // Traiter l'erreur 500
          });
          event['date'] = this.extractDate(event['start']['dateTime']);
          event['start']['dateTime'] = this.extractTime(event['start']['dateTime']);
          event['end']['dateTime'] = this.extractTime(event['end']['dateTime']);
        });
      }, (err: HttpErrorResponse) => {
        // console.log(err['status']);
        // 500: Internal Error Component
      });
  }


  extractDate(dateISOS: string): string {
    return formatDate(dateISOS, 'fullDate', 'en-US');
  }

  extractTime(dateISOS: string): string {
    return formatDate(dateISOS, 'mediumTime', 'en-US');
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
    this.getCalendar(this.selectedRoom['Email']);
  }


  clearRoom(): void {
    this.events = [];
    this.timescale = '';
    this.roomsControl.reset();
  }


  ngOnInit() {
    if (JSON.stringify(this.dataService.user) === '{}') {
      this.getUser();
    }
    this.getRooms();
  }

}
