import { Component, OnInit } from '@angular/core';
import { HttpErrorResponse } from '../../../../../node_modules/@angular/common/http';
import { Router } from '@angular/router';
import { FormControl } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { CalendarsService } from '../../shared/httpService/calendars.service';
import { DataService } from './../../shared/dataService/data.service';

@Component({
  selector: 'app-booking',
  templateUrl: './booking.component.html',
  styleUrls: ['./booking.component.css']
})

export class BookingComponent implements OnInit {

  constructor(
    private httpService: CalendarsService,
    private dataService: DataService,
    private router: Router,
    private toastr: ToastrService
  ) { }

  title: string;  // Title of the event
  startDate: Date;  // Start date of the event
  endDate: Date;  // End date of the event
  eventLength = 60; // Length of the event, in minutes
  errorDate = false;

  roomsControl = new FormControl(); // FormControl for room
  roomsAutocomplete = []; // Autocomplete of rooms
  filteredRooms: Observable<any>; // List of rooms filtered according to box content
  selectedRoom;
  errorRoom = false;


  coOrgaControl = new FormControl();
  coOrga = null;

  attendeesControl = new FormControl();  // FormControl for autocomplete
  attendeesAutocomplete = []; // Autocomplete of attendees which are not selected
  filteredAttendees: Observable<any>; // List of attendees filtered according to box content
  attendeesList = []; // List of attendees which are selected

  faTimes = faTimes;  // Icon to remove a participant or clear the room

  timeToastr = 1500;


  init(): void {
    this.initTime();
    this.getRooms();
    this.getAllUsers();
  }

  /**
   *
   */
  initTime(): void {
    const now = new Date();
    const min = now.getMinutes() + 5 - (now.getMinutes() % 5);
    this.startDate = new Date();
    this.startDate.setMinutes(min);
    this.startDate.setSeconds(0);
    this.endDate = new Date();
    this.endDate.setMinutes(min + this.eventLength);
    this.endDate.setSeconds(0);
  }

  /**
   *
   */
  changeEnd(): void {
    this.endDate = new Date(this.startDate.getTime() + this.eventLength * 60 * 1000);
  }

  /**
   *
   */
  changeEventLength(): void {
    this.eventLength = (this.endDate.getTime() - this.startDate.getTime()) / (60 * 1000);
  }

  /**
   *
   */
  getRooms(): void {
    this.httpService.getAllRooms()
      .subscribe(rooms => {
        this.roomsAutocomplete = rooms;
        this.setFilteredRoomsAutocomplete();
      }, (err: HttpErrorResponse) => {
        if (err['status'] === 500) {
          this.router.navigate(['/server-error', 'Internal Error']);
        }
      });
  }

  /**
   *
   */
  roomsFilter(name: string) {
    const filterValue = name.toLowerCase();

    return this.roomsAutocomplete.filter(room => (room['Name']).toLowerCase().includes(filterValue));
  }

  /**
   *
   */
  setFilteredRoomsAutocomplete(): void {
    this.filteredRooms = this.roomsControl.valueChanges
      .pipe(
        startWith(''),
        map(name => name ? this.roomsFilter(name) : this.roomsAutocomplete.slice()),
      );
  }

  /**
   *
   */
  setRoom(room): void {
    this.selectedRoom = room;
  }

  /**
   *
   */
  clearRoom(): void {
    this.errorRoom = false;
    this.selectedRoom = null;
    this.roomsControl.reset();
  }

  /**
   *
   */
  setCoOrga(coOrga): void {
    this.coOrga = coOrga;
    this.addAttendee(coOrga);
  }

  /**
   *
   */
  clearCoOrga(): void {
    this.removeAttendee(this.coOrga);
    this.coOrga = null;
    this.coOrgaControl.reset();
  }

  /**
   *
   */
  getAllUsers(): void {
    this.httpService.getAllUsers()
      .subscribe(users => {
        this.attendeesAutocomplete = users;
        this.setFilteredAttendeesAutcomplete();
        this.addAttendee(this.dataService.user);
      }, (err: HttpErrorResponse) => {
        if (err['status'] === 500) {
          this.router.navigate(['/server-error', 'Internal Error']);
        }
      });
  }

  /**
   *
   */
  attendeesFilter(name: string) {
    const filterValue = name.toLowerCase();

    return this.attendeesAutocomplete
      .filter(attendee => (attendee['FirstName'] + ' ' + attendee['LastName'])
        .toLowerCase()
        .includes(filterValue));
  }

  /**
   *
   */
  setFilteredAttendeesAutcomplete(): void {
    this.filteredAttendees = this.attendeesControl.valueChanges
      .pipe(
        startWith(''),
      map(name => name ? this.attendeesFilter(name) : this.attendeesAutocomplete.slice()),
      );
  }

  /**
   *
   */
  addAttendee(attendee): void {
    this.attendeesList.push(attendee);
    const index = this.attendeesAutocomplete.findIndex(att => att['Email'] === attendee['Email']);
    this.attendeesAutocomplete.splice(index, 1);
    this.setFilteredAttendeesAutcomplete();
    this.attendeesControl.reset();
  }

  /**
   *
   */
  removeAttendee(attendee): void {
    const index = this.attendeesList.findIndex(att => att['Email'] === attendee['Email']);
    this.attendeesList.splice(index, 1);
    this.attendeesAutocomplete.push(attendee);
    this.setFilteredAttendeesAutcomplete();
  }

  /**
   *
   */
  createEvent(): void {
    if (this.eventLength > 0) {
      const event = {
        title: this.title,
        startDate: this.startDate,
        endDate: this.endDate,
        room: this.selectedRoom,
        attendees: this.attendeesList,
        organizer1: this.dataService.user['Email'],
        organizer2: this.coOrga
      };
      this.httpService.postEvent(event)
        .subscribe(data => {
          if (data) {
            this.toastr.error('Room not available', '', { timeOut: this.timeToastr });
          } else {
            this.router.navigate(['/user']);
            this.toastr.success('Booking successful', '', { timeOut: this.timeToastr });
          }
        }, (err: HttpErrorResponse) => {
          if (err['status'] === 500) {
            this.router.navigate(['/server-error', 'Internal Error']);
          }
        });
    } else {
      this.toastr.error('The event start after ending', '', { timeOut: this.timeToastr });
    }
  }

  ngOnInit() {
    if (JSON.stringify(this.dataService.user) === '{}') {
      this.dataService.getUser()
        .then(() => {
          this.init();
        });
    } else {
      this.init();
    }
  }

}
