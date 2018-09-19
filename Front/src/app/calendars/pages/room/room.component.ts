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
  events = [];
  nextEvent: Array<any>;
  nextEventPos: number;
  currentTitle = 'Free';
  currentColor = '';

  // Time and timers
  timeToWaitCancel: number;
  timeToWaitStart: number;
  timeBeforeRemoveMinutes = 1; // Time in minutes before cancel an event
  timeBeforeRemoveMilliSeconds = this.timeBeforeRemoveMinutes * 60 * 1000;
  timeRefreshMinutes = 1;
  timeOutRefresh = this.timeRefreshMinutes * 60 * 1000;
  timeOutCancel;
  timeOutStart;
  timeToastr = 1500;

  // Sockets
  insertEventConnection;
  updateRoomOccupancy;

  // Others
  idCardControl = new FormControl();  // FormControl for scan
  showHeaderBool = false;
  faAngleDown = faAngleDown;
  faCircle = faCircle;
  colors = ['green', 'yellow', 'red', 'blue'];
  colorSignifications = ['Free', 'Meeting expected', 'Meeting in progress/done', 'Transition'];
  months = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
    'August', 'September', 'October', 'November', 'December'];

  @ViewChild('scan') scanElement: ElementRef;
  @HostListener('document:mousemove', ['$event'])
  onMouseMove(e) {
    if (this.showHeaderBool === false) {
      if (e.clientY <= 30) {
        this.showHeaderBool = true;
      }
    } else {
      if (e.clientY > 60) {
        this.showHeaderBool = false;
      }
    }
  }

  setRoom(room): void {
    const roomName = this.transformRoomName(room);
    this.removeSockets();
    this.httpService.getRoomInformation(roomName)
      .subscribe(dataRoom => {
        this.selectedRoom = dataRoom;
        this.scanElement.nativeElement.focus();
        this.setCalendar(this.selectedRoom['Email']);
        this.refreshCalendarTimer();
        this.setupSocket();
      });
  }


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


  setCalendar(roomEmail): void {
    this.getCalendar(roomEmail)
      .then(data => {
        this.calendarTreatments(data);
      });
  }


  getCalendar(calendarId): Promise<any> {
    return new Promise((resolve) => {
      this.httpService.getCalendar(calendarId)
        .subscribe(data => {
          resolve(data);
        }, (err: HttpErrorResponse) => {
          if (err['status'] === 500) {
            this.router.navigate(['/server-error', 'Internal Error']);
          }
        });
    });
  }


  refreshCalendarTimer(): void {
    setTimeout(() => {
      this.setCalendar(this.selectedRoom['Email']);
      this.refreshCalendarTimer();
    }, this.timeOutRefresh);
  }


  calendarTreatments(data: any): void {
    this.events = [];
    this.nextEvent = [];

    for (let i = 0; i < data.length; i++) {
      const event = data[i];
      event['date'] = this.extractDate(event['start']['dateTime']);
      event['start']['dateTime'] = this.extractTime(event['start']['dateTime']);
      event['end']['dateTime'] = this.extractTime(event['end']['dateTime']);

      const nowShiftTime = new Date().getTime() - this.timeBeforeRemoveMilliSeconds;
      const startTime = this.determineStartTime(event);
      if (this.nextEvent.length === 0 && nowShiftTime < startTime) {
        event['type'] = 'warning';
        this.nextEvent = event;
        this.nextEventPos = i;
      } else {
        if (nowShiftTime <= startTime) {
          event['type'] = 'warning';
        } else {
          event['type'] = 'danger';
        }
      }
    }

    if (this.nextEvent.length !== 0) {
      this.organizersAttendance(this.nextEvent)
        .then(bool => {
          const nowTime = new Date().getTime();
          let startTime = this.determineStartTime(this.nextEvent);
          if (bool === false || (bool === true && nowTime < startTime)) {
            this.timeToWaitStart = startTime - nowTime;
            if (this.timeToWaitStart < 0) {
              this.timeToWaitStart = 0;
            }
            this.startTimer(startTime);
          } else {
            if (data[this.nextEventPos + 1]) {
              data[this.nextEventPos]['type'] = 'danger';
              data[this.nextEventPos + 1]['type'] = 'warning';
              this.nextEvent = data[this.nextEventPos + 1];
              this.nextEventPos = this.nextEventPos + 1;

              startTime = this.determineStartTime(this.nextEvent);
              this.timeToWaitStart = startTime - nowTime;
              if (this.timeToWaitStart < 0) {
                this.timeToWaitStart = 0;
              }
              this.startTimer(startTime);
            } else {
              this.nextEvent = [];
              this.nextEventPos = -1;
            }
          }
          this.events = data;
          this.eventTitleColor();
        });
    } else {
      this.events = data;
      this.eventTitleColor();
    }
  }


  determineStartTime(event): number {
    const startTimeArr = event['start']['dateTime'].split(':');
    const startTimeH = this.convert12To24(startTimeArr[0], startTimeArr[1].split(' ')[1]).toString();
    const dateArr = event['date'].split(', ');
    const startTime = new Date(dateArr[2], this.months.indexOf(dateArr[1].split(' ')[0]),
      dateArr[1].split(' ')[1], parseInt(startTimeH, 10), parseInt(startTimeArr[1].split(' ')[0], 10)).getTime();

    return startTime;
  }


  organizersAttendance(event): Promise<any> {
    return new Promise((resolve) => {
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


  startTimer(startTime): void {
    setTimeout(() => {
      if (this.selectedRoom['Occupancy'] > 0) {
        this.organizersAttendance(this.nextEvent)
          .then(bool => {
            if (bool === true) {
              this.events[this.nextEventPos]['type'] = 'danger';
              this.events = this.events.slice();
              this.newNextEvent();
            } else {
              this.cancelTimer(startTime);
            }
          });
      } else {
        this.cancelTimer(startTime);
      }
      this.eventTitleColor();
    }, this.timeToWaitStart);
  }


  cancelTimer(startTime): void {
    const nowTime = new Date().getTime();
    const timeToWaitCancel = startTime - nowTime + this.timeBeforeRemoveMilliSeconds;
    this.timeOutCancel = setTimeout(() => {
      this.cancelEvent(this.nextEvent, this.selectedRoom['Email']);
    }, timeToWaitCancel);
  }


  clearTimers(): void {
    if (this.timeOutStart) {
      clearTimeout(this.timeOutStart);
    }
    if (this.timeOutCancel) {
      clearTimeout(this.timeOutCancel);
    }
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


  setUserPosition(idCard): void {
    this.httpService.postUserPosition(idCard, this.selectedRoom['Name'])
      .subscribe(move => {
        if (move === 'in') {
          this.toastr.success('Check-in successful', '', { timeOut: this.timeToastr });
          this.organizerBeforeCancel();
        } else {
          this.toastr.success('Check-out successful', '', { timeOut: this.timeToastr });
          this.updateEndEvent();
        }
      }, (err: HttpErrorResponse) => {
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


  newNextEvent(): void {
    this.clearTimers();
    if (this.events[this.nextEventPos + 1]) {
      this.nextEvent = this.events[this.nextEventPos + 1];
      this.nextEventPos = this.nextEventPos + 1;
      const now = new Date();
      const startTimeArr = this.nextEvent['start']['dateTime'].split(':');
      const startTimeH = this.convert12To24(startTimeArr[0], startTimeArr[1].split(' ')[1]).toString();
      const dateArr = this.nextEvent['date'].split(', ');
      const startTime = new Date(dateArr[2], this.months.indexOf(dateArr[1].split(' ')[0]),
        dateArr[1].split(' ')[1], parseInt(startTimeH, 10), parseInt(startTimeArr[1].split(' ')[0], 10)).getTime();
      this.timeToWaitStart = startTime - now.getTime();
      if (this.timeToWaitStart < 0) {
        this.timeToWaitStart = 0;
      }
      this.startTimer(startTime);
    } else {
      this.nextEvent = [];
      this.nextEventPos = -1;
    }
  }


  updateEndEvent(): void {
    const res = this.eventCurrently();
    const currentEvent = res[0];
    const posInEvents = res[1];

    if (currentEvent) {
      this.organizersAttendance(currentEvent)
        .then(bool => {
          if (bool === false) {
            this.httpService.updateEndEvent(currentEvent['organizer']['email'], currentEvent['id'], new Date())
              .subscribe(eventUpdated => {
                this.events[posInEvents]['date'] = this.extractDate(eventUpdated['start']['dateTime']);
                this.events[posInEvents]['start']['dateTime'] = this.extractTime(eventUpdated['start']['dateTime']);
                this.events[posInEvents]['end']['dateTime'] = this.extractTime(eventUpdated['end']['dateTime']);
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
  }


  cancelEvent(eventToCancel, roomEmail): void {
    this.httpService.cancelEvent(eventToCancel['organizer']['email'], eventToCancel['id'], roomEmail)
      .subscribe(eventRemoved => {
        if (this.selectedRoom && this.isRoom(this.selectedRoom['Email'], eventRemoved['attendees'])) {
          this.removeEvent(eventRemoved['id']);
        }
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
              this.clearTimers();
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
        if (newEvents.length !== 0) {
          data = newEvents;
          this.calendarTreatments(data);
        } else {
          this.removeEvent(eventId);
        }
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
