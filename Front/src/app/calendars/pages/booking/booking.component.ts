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

  roomsControl = new FormControl(); // FormControl for room
  roomsAutocomplete = []; // Autocomplete of rooms
  filteredRooms: Observable<any>; // List of rooms filtered according to box content
  selectedRoom; // The room selected for the meeting

  coOrgaControl = new FormControl();  // FormControl for the co-organizer
  coOrga = null;  // The co-organizer

  attendeesControl = new FormControl();  // FormControl for autocomplete
  attendeesAutocomplete = []; // Autocomplete of attendees which are not selected
  filteredAttendees: Observable<any>; // List of attendees filtered according to box content
  attendeesList = []; // List of attendees which are selected

  faTimes = faTimes;  // Icon to remove a participant or clear the room

  timeToastr = 1500;  // Toastr notifications time


  /**
   * This function calls the functions to initialize the autocompletes and the timepickers
   */
  init(): void {
    this.initTime();
    this.getRooms();
    this.getAllUsers();
  }

  /**
   * This function initializes the timepickers
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
   * This function changes the end time of the event according to start time and the length
   */
  changeEnd(): void {
    this.endDate = new Date(this.startDate.getTime() + this.eventLength * 60 * 1000);
  }

  /**
   * This function changes the length of the event according to the start and end dates
   */
  changeEventLength(): void {
    this.eventLength = (this.endDate.getTime() - this.startDate.getTime()) / (60 * 1000);
  }

  /**
   * After getting the information about the rooms,
   * this function calls the function to initialize the room autocomplete
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
   * @param {string} name: the room autocomplete value
   * This function filters the rooms according to the name
   * @return: return the new list of rooms according to the autocomplete value
   */
  roomsFilter(name: string) {
    const filterValue = name.toLowerCase();
    return this.roomsAutocomplete.filter(room => (room['Name']).toLowerCase().includes(filterValue));
  }

  /**
   * This function initializes the room autocomplete
   */
  setFilteredRoomsAutocomplete(): void {
    this.filteredRooms = this.roomsControl.valueChanges
      .pipe(
        startWith(''),
        map(name => name ? this.roomsFilter(name) : this.roomsAutocomplete.slice()),
      );
  }

  /**
   * @param room: the room selected by the user in the autocomplete
   * This function sets the selected room according to the user choice
   */
  setRoom(room): void {
    this.selectedRoom = room;
  }

  /**
   * This function clear the autocomplete if the user wants to change the room
   */
  clearRoom(): void {
    this.selectedRoom = null;
    this.roomsControl.reset();
  }

  /**
   * @param coOrga: the co-organizer selected by the user
   * This function sets the co-organizer according to the user choice
   */
  setCoOrga(coOrga): void {
    this.coOrga = coOrga;
    this.addAttendee(coOrga);
  }

  /**
   * This function clear the autocomplete if the user wants to change the co-organizer
   */
  clearCoOrga(): void {
    this.removeAttendee(this.coOrga);
    this.coOrga = null;
    this.coOrgaControl.reset();
  }

  /**
   * After getting the information about the rooms,
   * this function calls the function to initialize the attendee autocomplete
   * This function adds also the connected user as attendee (not removable)
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
   * @param {string} name: the attendee autocomplete value
   * This function filters the attendees according to the name
   * @return: return the new list of attendees according to the autocomplete value
   */
  attendeesFilter(name: string) {
    const filterValue = name.toLowerCase();
    return this.attendeesAutocomplete
      .filter(attendee => (attendee['FirstName'] + ' ' + attendee['LastName'])
        .toLowerCase()
        .includes(filterValue));
  }

  /**
   * This function initializes the attendee autocomplete
   */
  setFilteredAttendeesAutcomplete(): void {
    this.filteredAttendees = this.attendeesControl.valueChanges
      .pipe(
        startWith(''),
        map(name => name ? this.attendeesFilter(name) : this.attendeesAutocomplete.slice()),
      );
  }

  /**
   * @param attendee: an attendee
   * This function adds the given attendee in the participants list
   */
  addAttendee(attendee): void {
    this.attendeesList.push(attendee);
    const index = this.attendeesAutocomplete.findIndex(att => att['Email'] === attendee['Email']);
    this.attendeesAutocomplete.splice(index, 1);
    this.setFilteredAttendeesAutcomplete();
    this.attendeesControl.reset();
  }

  /**
   * @param attendee: an attendee
   * This function removes the given attendee from the participants list
   */
  removeAttendee(attendee): void {
    const index = this.attendeesList.findIndex(att => att['Email'] === attendee['Email']);
    this.attendeesList.splice(index, 1);
    this.attendeesAutocomplete.push(attendee);
    this.setFilteredAttendeesAutcomplete();
  }

  /**
   * This function verifies the start and end dates of the event,
   * if the dates are good, it calls a function to post the event to the server
   */
  createEvent(): void {
    if (this.eventLength > 0 && this.selectedRoom) {
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
    } else if (this.eventLength <= 0) {
      this.toastr.error('The event start after ending', '', { timeOut: this.timeToastr });
    } else if (!this.selectedRoom) {
      this.toastr.error('Please select a room', '', { timeOut: this.timeToastr });
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
