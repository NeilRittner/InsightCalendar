import { Component, OnInit, OnDestroy, ViewChild, ElementRef, HostListener } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { formatDate } from '@angular/common';
import { FormControl } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { faAngleDown, faCircle } from '@fortawesome/free-solid-svg-icons';
import { CalendarsService } from '../../shared/httpService/calendars.service';
import { DataService } from './../../shared/dataService/data.service';
import { SocketsService } from './../../shared/socketsService/sockets.service';
import { ActivatedRoute, Router } from '@angular/router';
import { interval } from 'rxjs';

@Component({
  selector: 'app-room',
  templateUrl: './room.component.html',
  styleUrls: ['./room.component.css']
})
export class RoomComponent implements OnInit, OnDestroy {
  constructor(
    private httpService: CalendarsService,
    private dataService: DataService,
    private socketsService: SocketsService,
    private route: ActivatedRoute,
    private router: Router,
    private toastr: ToastrService
  ) { }

  // Room Information
  selectedRoom = []; // Array with the 'Name', the 'Email', and the 'Occupancy' of the selected room

  // Events
  events = [];  // The events
  nextEvent;  // The next event (= the next which can be deleted automatically)
  nextEventPos: number; // The position in 'events' of the next event
  currentTitle = 'Free';  // The title of the event in progress (or Free is no event)
  currentColor = '';  // The color of the title displayed

  // Time and timers
  timeBeforeRemoveMinutes = 1; // Time in minutes before cancel an event
  timeBeforeRemoveMilliSeconds = this.timeBeforeRemoveMinutes * 60 * 1000;  // Time in milliseconds before cancel an event
  timeRefreshMinutes = 1; // Time in minutes before refresh the calendar
  timeRefresh = this.timeRefreshMinutes * 60 * 1000;  // Time in milliseconds before refresh the calendar
  timeToastr = 1500;  // Toastr notifications time
  timeOutCancel;  // Will be used to keep in memory the setTimeOut to cancel an event
  timeOutStart; // Will be used to keep in memory the setTimeOut to verify the attendancy at the beginning of an event
  timeOutRefresh; // Will be used to keep in memory the interval to refresh the page

  // Sockets
  insertEventConnection;  // The socket to know when an event is inserted
  updateRoomOccupancy;  // The socket to know when an event is updated

  // Others
  idCardControl = new FormControl();  // FormControl for scan
  // showHeaderBool = false;  // To make the header hidden or not
  faAngleDown = faAngleDown;  // The arrow
  faCircle = faCircle;  // The circles for the legend
  colors = ['green', 'yellow', 'red', 'blue'];  // Colors for the legend
  colorSignifications = ['Free', 'Meeting expected', 'Meeting in progress/done', 'Transition']; // Legend
  months = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
    'August', 'September', 'October', 'November', 'December'];

  @ViewChild('scan') scanElement: ElementRef; // The scan Element

  // To make the header hidden or not according to the mouse position
  // @HostListener('document:mousemove', ['$event'])
  // onMouseMove(e) {
  //   if (this.showHeaderBool === false) {
  //     if (e.clientY <= 30) {
  //       this.showHeaderBool = true;
  //     }
  //   } else {
  //     if (e.clientY > 60) {
  //       this.showHeaderBool = false;
  //     }
  //   }
  // }

  /**
   * @param room: The name of the room without space
   * This function calls different functions to iniatialize the page
   */
  setRoom(room): void {
    const roomName = this.transformRoomName(room);
    this.removeSockets(); // Remove the sockets because not remove if the previous page was a room
    this.httpService.getRoomInformation(roomName)
      .subscribe(dataRoom => {
        this.selectedRoom = dataRoom;
        this.scanElement.nativeElement.focus();
        this.setCalendar(this.selectedRoom['Email']);
        this.refreshCalendarTimer();
        this.setupSocket();
      });
  }

  /**
   * @param {string} roomName: the name of the room
   * This function returns the full name of the room to request the database
   * @return {string}: The full name of the room
   */
  transformRoomName(roomName: string): string {
    const arrayName = roomName.split(/(?=[A-Z])/);
    let prefix = 'NUIG ';
    if (roomName === 'ConferenceRoom') {
      prefix = prefix + 'Main ';
    } else {
      prefix = prefix + 'Meeting ';
    }
    return prefix + arrayName[0] + ' ' + arrayName[1];
  }

  /**
   * @param {string} roomEmail: the email of the room
   * This function calls the function to get and set the calendar of the room
   */
  setCalendar(roomEmail: string): void {
    this.getCalendar(roomEmail)
      .then(data => {
        this.calendarTreatments(data);
      });
  }

  /**
   * @param roomEmail: the email of the room
   * This function call a function to get the calendar of the given room
   * @return {Promise<any>}: Promise with an array of events
   */
  getCalendar(roomEmail): Promise<any> {
    return new Promise((resolve) => {
      this.httpService.getCalendar(roomEmail)
        .subscribe(data => {
          resolve(data);
        }, (err: HttpErrorResponse) => {
          if (err['status'] === 500) {
            this.router.navigate(['/server-error', 'Internal Error']);
          }
        });
    });
  }

  /**
   * This function refresh automatically the page
   */
  refreshCalendarTimer(): void {
    this.timeOutRefresh = interval(this.timeRefresh)
      .subscribe(() => {
        this.setCalendar(this.selectedRoom['Email']);
      });
  }

  /**
   * @param {any} data: the array of events
   * This function do some treatments on the events (on the dates and types) and determine the next event
   */
  calendarTreatments(data: any): void {
    console.log('treatments');
    // Clear the timers
    this.clearTimers();

    for (let i = 0; i < data.length; i++) {
      const event = data[i];

      // Some treatments for the date and start/end time
      event['date'] = this.extractDate(event['start']['dateTime']);
      event['start']['dateTime'] = this.extractTime(event['start']['dateTime']);
      event['end']['dateTime'] = this.extractTime(event['end']['dateTime']);

      // Determine the color of the events 1
      const nowTime = new Date().getTime();
      const startTimeEvent = this.determineStartTime(event);
      if (startTimeEvent > nowTime) {
        event['type'] = 'warning';
      } else {
        event['type'] = 'danger';
      }

      // Determine the nextEvent (next event which could be cancelled) 1
      if (!this.nextEvent && (startTimeEvent + this.timeBeforeRemoveMilliSeconds) > nowTime) {
        event['type'] = 'warning';
        this.nextEvent = event;
        this.nextEventPos = i;
      }
    }

    // Determine the nextEvent (the real nextEvent) 2
    if (this.nextEvent) {
      const nowTime = new Date().getTime();
      let startTimeNextEvent = this.determineStartTime(this.nextEvent);
      if (startTimeNextEvent > nowTime) {
        // Launch the timer to verify the presence of the organizer(s) at the beginning of the meeting
        this.startTimer(startTimeNextEvent);
        this.events = data;
        this.eventTitleColor();
      } else {
        this.organizersAttendance(this.nextEvent)
          .then(bool => {
            if (bool === false) {
              // Launch the timer to verify the presence of the organizer(s)
              this.startTimer(startTimeNextEvent);
            } else {
              // The organizer(s) are in the meeting, then the real nextEvent is the following one
              if (data[this.nextEventPos + 1]) {
                data[this.nextEventPos]['type'] = 'danger'; // Because meeting in progress
                this.nextEvent = data[this.nextEventPos + 1];
                this.nextEventPos = this.nextEventPos + 1;
                startTimeNextEvent = this.determineStartTime(this.nextEvent);
                this.startTimer(startTimeNextEvent);
              } else {
                this.nextEvent = null;
                this.nextEventPos = -1;
              }
            }
          });
      }
    } else {
      this.events = data;
      this.eventTitleColor();
    }
  }

  /**
   * @param {any} event: an event (JSON Object)
   * This function determines the start time of the given event
   * @return {number}: the start time in milliseconds
   */
  determineStartTime(event: any): number {
    const startTimeArr = event['start']['dateTime'].split(':');
    const startTimeH = this.convert12To24(startTimeArr[0], startTimeArr[1].split(' ')[1]).toString();
    const dateArr = event['date'].split(', ');
    const startTime = new Date(dateArr[2], this.months.indexOf(dateArr[1].split(' ')[0]),
      dateArr[1].split(' ')[1], parseInt(startTimeH, 10), parseInt(startTimeArr[1].split(' ')[0], 10)).getTime();

    return startTime;
  }

  /**
   * @param {any} event: an event (JSON Object)
   * This function allow to know if the organizer (or one of them if multiple) are in the meeting
   * @return {Promise<any>}: Promise with a boolean: true if one of the organizer is in the meeting, false if not
   */
  organizersAttendance(event: any): Promise<any> {
    return new Promise((resolve) => {
      // Do this because sometime the ['organizer'] is not the organizer but it's the creator
      const orga = event['creator'] ? event['creator']['email'] : event['organizer']['email'];
      this.httpService.organizersAttendance(orga, event['id'], this.selectedRoom['Name'])
      .subscribe(response => {
        if (response === 'yes') {
          resolve(true);
        } else {
          resolve(false);
        }
      }, (err: HttpErrorResponse) => {
        if (err['status'] === 500) {
          this.router.navigate(['/server-error', 'Internal Error']);
        }
      });
    });
  }

  /**
   * @param {number} startTime: the start time of an event (which is the next event)
   * This function starts a setTimeOut. When the timeOut is finished, it verifies if one of the organizers
   * is in the meeting. If no one is in, it calls the function to start the cancel timeOut.
   * If one of them is here, it changes the next event and sets the meeting as 'in progress'
   */
  startTimer(startTime: number): void {
    const nowTime = new Date().getTime();
    const timeToWaitStart = startTime - nowTime;

    this.timeOutStart = setTimeout(() => {
      this.organizersAttendance(this.nextEvent)
        .then(bool => {
          if (bool === true) {
            this.events[this.nextEventPos]['type'] = 'danger';
            this.events = this.events.slice();  // To refresh the calendar, else the calendar is not refresh
            this.newNextEvent();
          } else {
            this.cancelTimer(startTime);
          }
          this.eventTitleColor();
        });
    }, timeToWaitStart);
  }

  /**
   * @param {number} startTime: the start time of an event (which is the next event)
   * This function starts a setTimeOut. When the timeOut is finished, it cancels the nextEvent
   * (which is in fact the currentEvent) because any organizer is in the meeting
   */
  cancelTimer(startTime: number): void {
    const nowTime = new Date().getTime();
    const timeToWaitCancel = startTime - nowTime + this.timeBeforeRemoveMilliSeconds;
    this.timeOutCancel = setTimeout(() => {
      this.cancelEvent(this.nextEvent, this.selectedRoom['Email']);
    }, timeToWaitCancel);
  }

  /**
   * This function cancel the timeOut if they are set
   */
  clearTimers(): void {
    if (this.timeOutStart) {
      clearTimeout(this.timeOutStart);
    }
    if (this.timeOutCancel) {
      clearTimeout(this.timeOutCancel);
    }
  }


  /**
   * @param {string} dateISOS: a date in the format ISO
   * This function extracts the date (Year, Month, Day) in the given date
   * @return {string}: a string which gives the Year, Month, Day
   */
  extractDate(dateISOS: string): string {
    return formatDate(dateISOS, 'fullDate', 'en-US');
  }

  /**
   * @param {string} dateISOS: a date in the format ISO
   * This function extracts the time (Hour, Minute) in the given date
   * @return {string}: a string which gives the Hour and Minute
   */
  extractTime(dateISOS: string): string {
    return formatDate(dateISOS, 'shortTime', 'en-US');
  }

  /**
   * @param {string} time: an hour
   * @param {string} moment: AM or PM
   * Transform an hour given in the format 12h to the format 24h
   * @return {number}: the given hour in the format 24h
   */
  convert12To24(time: string, moment: string): number {
    if (moment === 'PM' && time !== '12') {
      return (parseInt(time, 10) + 12);
    } else {
      return parseInt(time, 10);
    }
  }

  /**
   * @param idCard: the id/number of the scanned card
   * This function calls a function to set the position of the user in the database.
   * According to the movement (in or out) it will do some treatments to know if it's an organizer who
   * shows up to his event or it's necessary to update the end of the current event
   */
  setUserPosition(idCard): void {
    this.httpService.postUserPosition(idCard, this.selectedRoom['Name'])
      .subscribe(move => {
        if (move === 'in') {
          this.toastr.success('Check-in successful', '', { timeOut: this.timeToastr });
          this.organizerBeforeCancel();
        } else {
          this.toastr.success('Check-out successful', '', { timeOut: this.timeToastr });

          // Update the end of the event if necessary
          const res = this.eventCurrently();
          const currentEvent = res[0];
          const posCurrentEvent = res[1];
          if (currentEvent) {
            this.organizersScan(idCard, currentEvent)
              .then(bool => {
                if (bool === true) {
                  this.updateEndEvent(currentEvent, posCurrentEvent);
                }
              });
          }
        }
      }, (err: HttpErrorResponse) => {
        // Error 404: the card is not associated to a user
        if (err['status'] === 404) {
          this.toastr.error(err['error'], '', { timeOut: this.timeToastr });
        } else if (err['status'] === 500) {
          this.router.navigate(['/server-error', 'Internal Error']);
        }
      });
    this.idCardControl.reset();
  }


  organizerBeforeCancel(): void {
    const eventCurrently = this.eventCurrently();
    const currentEvent = eventCurrently[0];
    const posCurrentEvent = eventCurrently[1];
    if (posCurrentEvent !== -1 && this.nextEvent['id'] === currentEvent['id']) {
      this.organizersAttendance(currentEvent)
        .then(bool => {
          if (bool === true) {
            this.events[posCurrentEvent]['type'] = 'danger';
            this.events = this.events.slice();
            this.eventTitleColor();
            this.newNextEvent();
          }
        });
    }
  }

  organizersScan(idCard, event): Promise<boolean> {
    return new Promise((resolve) => {
      const organizer = event['creator'] ? event['creator']['email'] : event['organizer']['email'];
      this.httpService.organizersScan(idCard, organizer, event['id'])
        .subscribe(response => {
          if (response === 'yes') {
            resolve(true);
          } else {
            resolve(false);
          }
        }, (err: HttpErrorResponse) => {
          if (err['status'] === 404) {
            this.toastr.error(err['error'], '', { timeOut: this.timeToastr });
            resolve(false);
          } else if (err['status'] === 500) {
            this.router.navigate(['/server-error', 'Internal Error']);
          }
        });
    });
  }

  updateEndEvent(event, posEvent): void {
    this.organizersAttendance(event)
      .then(bool => {
        if (bool === false) {
          this.httpService.updateEndEvent(event['organizer']['email'], event['id'], new Date())
            .subscribe(eventUpdated => {
              this.events[posEvent]['date'] = this.extractDate(eventUpdated['start']['dateTime']);
              this.events[posEvent]['start']['dateTime'] = this.extractTime(eventUpdated['start']['dateTime']);
              this.events[posEvent]['end']['dateTime'] = this.extractTime(eventUpdated['end']['dateTime']);
              this.events = this.events.slice();
              this.eventTitleColor();
            }, (err: HttpErrorResponse) => {
              if (err['status'] === 403) {
                this.toastr.error(err['error'], '', { timeOut: this.timeToastr });
              } else if (err['status'] === 500) {
                this.router.navigate(['/server-error', 'Internal Error']);
              }
            });
        }
      });
  }

  newNextEvent(): void {
    this.clearTimers();
    if (this.events[this.nextEventPos + 1]) {
      this.nextEvent = this.events[this.nextEventPos + 1];
      this.nextEventPos = this.nextEventPos + 1;
      const startTime = this.determineStartTime(this.nextEvent);
      this.startTimer(startTime);
    } else {
      this.nextEvent = [];
      this.nextEventPos = -1;
    }
  }


  cancelEvent(eventToCancel, roomEmail): void {
    this.httpService.cancelEvent(eventToCancel['organizer']['email'], eventToCancel['id'], roomEmail)
      .subscribe(eventRemoved => {
        this.removeEvent(eventRemoved['id']);
      }, (err: HttpErrorResponse) => {
        if (err['status'] === 403) {
          this.toastr.error(err['error'], '', { timeOut: this.timeToastr });
          eventToCancel['type'] = 'danger';
          this.events = this.events.slice();
          this.eventTitleColor();
        } else if (err['status'] === 500) {
          this.router.navigate(['/server-error', 'Internal Error']);
        }
      });
  }


  eventCurrently(): any {
    let currentEvent = null;
    let posInEvents = -1;
    const now = new Date();
    const nowDate = this.extractDate(now.toISOString());
    const nowTime = now.getTime();

    for (let i = 0; i < this.events.length; i++) {
      const event = this.events[i];
      const eventStartArr = event['start']['dateTime'].split(':');
      const eventEndArr = event['end']['dateTime'].split(':');
      const eventStartHour24 = this.convert12To24(eventStartArr[0], eventStartArr[1].split(' ')[1]);
      const eventEndHour24 = this.convert12To24(eventEndArr[0], eventEndArr[1].split(' ')[1]);
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


  setupSocket(): void {
    this.insertEventConnection = this.socketsService.eventInserted()
      .subscribe(data => {
        if (this.isRoom(this.selectedRoom['Email'], data['attendees'])) {
          this.getCalendar(this.selectedRoom['Email'])
            .then(dataGet => {
              const newEventStartTime = new Date(data['start']['dateTime'].split('+')[0]).getTime();
              let newEvents;
              let index = -1;

              for (let i = 0; i < dataGet.length; i++) {
                const event = dataGet[i];
                const eventStartTime = new Date(event['start']['dateTime'].split('+')[0]).getTime();
                if (event['id'] === data['id'] ) {
                  break;
                }
                if (eventStartTime > newEventStartTime) {
                  index = i;
                }
              }
              if (index === -1) {
                index = dataGet.length;
              }

              newEvents = this.events.slice(0, index);
              newEvents.push(data);
              newEvents = (newEvents).concat(this.events.slice(index));
              dataGet = newEvents;
              this.calendarTreatments(dataGet);
            });
        }
      });

    this.updateRoomOccupancy = this.socketsService.updateOccupancy()
      .subscribe(data => {
        if (data['roomName'] === this.selectedRoom['Name']) {
          if (data['move'] === 'in') {
            this.selectedRoom['Occupancy'] = this.selectedRoom['Occupancy'] + 1;
          } else {
            this.selectedRoom['Occupancy'] = this.selectedRoom['Occupancy'] - 1;
          }
        }
      });
  }


  isRoom(roomEmail: string, newEventAttendees: Array<any>): boolean {
    let isRoom = false;
    for (let i = 0; i < newEventAttendees.length; i++) {
      const attendee = newEventAttendees[i];
      if (attendee['resource'] && roomEmail === attendee['email']) {
        isRoom = true;
      }
    }
    return isRoom;
  }


  removeEvent(eventId): void {
    this.getCalendar(this.selectedRoom['Email'])
      .then(data => {
        const newEvents = this.removeEventInList(data, eventId);
        this.nextEvent = null;
        this.calendarTreatments(newEvents);
      });
  }


  removeEventInList(events, eventId): Array<any> {
    let index = -1;
    for (let i = 0; i < events.length; i++) {
      if (events[i]['id'] === eventId) {
        index = i;
      }
    }
    if (index !== -1) {
      events = (events.slice(0, index)).concat(events.slice(index + 1));
    }
    return events;
  }


  eventTitleColor(): void {
    const event = this.eventCurrently();
    if (event[0]) {
      this.currentTitle = event[0]['summary'];
      if (event[0]['type'] === 'danger') {
        this.currentColor = 'red';
      } else {
        this.currentColor = 'yellow';
      }
    } else {
      this.currentTitle = 'Free';
      this.currentColor = 'green';
    }
  }


  removeSockets(): void {
    if (this.insertEventConnection !== undefined) {
      this.insertEventConnection.unsubscribe();
    }
    if (this.updateRoomOccupancy !== undefined) {
      this.updateRoomOccupancy.unsubscribe();
    }
  }


  ngOnInit() {
    if (JSON.stringify(this.dataService.user) === '{}') {
      this.dataService.getUser();
    }
    this.route.params.subscribe(params => {
      this.setRoom(params['roomName']);
    });
  }

  ngOnDestroy() {
    this.removeSockets();
  }
}
