import { Component, OnInit, Input, OnChanges } from '@angular/core';

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.css']
})
export class CalendarComponent implements OnInit, OnChanges {

  constructor() { }

  @Input() timeScale: string; // The timescale of the calendar
  @Input() events: Array<any>; // The events
  days: Array<any>; // An array of 5 arrays (one for each day in a week)
  indexDay: number; // Index in 'days'
  hours = ['9am', '10am', '11am', '12pm', '1pm', '2pm', '3pm', '4pm', '5pm']; // The hours displayed
  nbHours = this.hours.length;  // The number of hours displayed
  weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];  // The week days displayed
  numberOfWeeksInMonth: number; // Number of weeks in a month, useful if timescale === Month
  monthDays: Array<any>; // Array of arrays for each weeks in the month, useful if timescale === Month
  // Each subarray will have 5 subarrays which will contain the events
  daysNumber: Array<any>; // Array of arrays for each weeks in the month, useful if timescale === Month
  // Each subarray will have 5 subarrays which will contain the number of the day in the month

  ngOnChanges() {
    if (this.timeScale !== 'Month') {
      this.days = [[], [], [], [], []];
      let exEventLongDate: Date;  // To know if the previous event was the sameday or no

      if (this.timeScale === 'Day') {
        this.indexDay = new Date().getDay() - 1;  // -1 because the Monday is the first day in the array
      }

      for (let i = 0; i < this.events.length; i++) {
        const event = this.events[i];
        if (event['date']) {
          const eventLongDate = new Date(event['date']);
          const indexInDays = eventLongDate.getDay() - 1;
          // Determine the start and end time of an event to know his size in the progressbar
          const startTimes = event['start']['dateTime'].split(':');
          const endTimes = event['end']['dateTime'].split(':');
          startTimes[0] = this.adaptTime(startTimes[0], startTimes[1].split(' ')[1]);
          endTimes[0] = this.adaptTime(endTimes[0], endTimes[1].split(' ')[1]);
          startTimes[1] = parseInt(startTimes[1].split(' ')[0], 10);
          endTimes[1] = parseInt(endTimes[1].split(' ')[0], 10);

          // If the event is not a Saturday or Sunday
          if (indexInDays !== -1 && indexInDays !== 5) {
            // Value of the event in the progressbar
            let valueEvent = this.calculValueEvent(startTimes[0], endTimes[0], startTimes[1], endTimes[1]);

            // Value before the event if it's the first event of the day
            if (!exEventLongDate || exEventLongDate.getDate() !== eventLongDate.getDate()) {
              exEventLongDate = eventLongDate;
              const valueBefore = ((startTimes[0] - 9) * (100 / this.nbHours)) + (startTimes[1] * (100 / (this.nbHours * 60)));
              if (valueBefore > 0) {
                this.pushInDays(indexInDays, valueBefore, 'success', '');
              }
            }

            // Value after the event and before the following one
            let valueAfter;
            if (this.events[i + 1] && this.events[i + 1]['date'] === event['date']) {
              const startTimesNext = this.events[i + 1]['start']['dateTime'].split(':');
              startTimesNext[0] = this.adaptTime(startTimesNext[0], startTimesNext[1].split(' ')[1]);
              valueAfter = this.calculValueAfter(startTimesNext[0], endTimes[0], startTimesNext[1].split(' ')[0], endTimes[1]);
            } else {
              valueAfter = this.calculValueAfter(18, endTimes[0], 0, endTimes[1]);
            }
            if (valueEvent > 0) {
              if (valueAfter > 0 || (this.events[i + 1] && this.events[i + 1]['date'] !== event['date'])) {
                this.pushInDays(indexInDays, valueEvent, event['type'], event['summary']);
                this.pushInDays(indexInDays, valueAfter, 'success', '');
              } else if (valueAfter === 0 && endTimes[0] >= 18) {
                this.pushInDays(indexInDays, valueEvent, event['type'], event['summary']);
              } else {
                // If two straight events: put a little separation
                const valueInterEvent = 0.15;
                valueEvent = valueEvent - valueInterEvent;
                this.pushInDays(indexInDays, valueEvent, event['type'], event['summary']);
                this.pushInDays(indexInDays, valueInterEvent, 'info', '');
              }
            } else {
              this.pushInDays(indexInDays, valueAfter, 'success', '');
            }
          }
        } else {
          const res = this.determineDays(event['startDate'], event['endDate']);
          const length = res[0];
          const first = res[1];
          for (let j = first; j < (first + length); j++) {
            this.pushInDays(j, 100, event['type'], event['summary']);
          }
        }
      }
      this.completeEmptyDays(); // To fill the days without events
    } else {
      this.monthDays = [];
      this.daysNumber = [];
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      this.numberOfWeeksInMonth = this.weeksCount(year, month);
      const numberOfDays = new Date(year, month, 0).getDate();
      const firstDayOfMonth = new Date(year, month - 1, 1);

      for (let i = 0; i < this.numberOfWeeksInMonth; i++) {
        // To do not display an empty week as first week of a month
        if (i === 0) {
          if (firstDayOfMonth.getDay() !== 0 && firstDayOfMonth.getDay() !== 6) {
            this.monthDays.push([[], [], [], [], []]);
            this.daysNumber.push([[], [], [], [], []]);
          }
        } else {
          this.monthDays.push([[], [], [], [], []]);
          this.daysNumber.push([[], [], [], [], []]);
        }
      }

      // Fill the array of day numbers
      for (let i = 1; i <= numberOfDays; i++) {
        const tmp = new Date(year, month - 1, i);
        if (tmp.getDay() !== 0 && tmp.getDay() !== 6) {
          if (firstDayOfMonth.getDay() !== 0 && firstDayOfMonth.getDay() !== 6) {
            this.daysNumber[this.positionInMonth(tmp) - 1][tmp.getDay() - 1].push(i);
          } else {
            this.daysNumber[this.positionInMonth(tmp) - 2][tmp.getDay() - 1].push(i);
          }
        }
      }

      // Fill the array of events
      for (let i = 0; i < this.events.length; i++) {
        const event = this.events[i];
        const eventDate = new Date(event['date']);
        const dayPos = eventDate.getDay() - 1;
        let weekPos = this.positionInMonth(eventDate) - 1;
        if (firstDayOfMonth.getDay() === 0 || firstDayOfMonth.getDay() === 6) {
          weekPos = weekPos - 1;
        }
        if (dayPos !== -1 && dayPos !== 5) {
          this.monthDays[weekPos][dayPos].push(event);
        }
      }
    }
  }

  /**
   * @param {string} startDate: the start date
   * @param {string} endDate: the end date
   * This function determines how long is an event (in days) if the event takes place on several days
   * @return {Array<number>}: First number: the length of the event (in days), Second number: the index of the first day
   */
  determineDays(startDate: string, endDate: string): Array<number> {
    let startDay = this.weekDays.findIndex(day => day === startDate.split(', ')[0]);
    let endDay = this.weekDays.findIndex(day => day === endDate.split(', ')[0]);
    if (startDay === -1) {
      startDay = 0;
    }
    if (endDay === -1) {
      endDay = 5;
    }
    return [endDay - startDay, startDay];
  }

  /**
   * Source: http://www.somethinghitme.com/2010/04/14/how-to-get-the-week-in-a-month-for-a-date-with-javascript/
   * @param {*} eventDate: the date of the event
   * This function determines the position of the given date in the month
   * @return {number}: the position of the given date in the month
   */
  positionInMonth(eventDate): number {
    const firstDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), 1).getDay();
    return Math.ceil((eventDate.getDate() + firstDay) / 7);
  }

  /**
   * @param {number} startTimeH: the start hour of an event
   * @param {number} endTimeH: the end hour of an event
   * @param {number} startTimeM: the start minutes of an event
   * @param {number} endTimeM: the end minutes of an event
   * This function determines the value of an event in the progressbar
   * @return {number}: the value of the event in the progressbar
   */
  calculValueEvent(startTimeH: number, endTimeH: number, startTimeM: number, endTimeM: number): number {
    if (endTimeH >= 9 && startTimeH < 18) {
      const startH = Math.max(9, startTimeH);
      const endH = Math.min(18, endTimeH);
      let startM: number;
      let endM: number;

      if (startH !== startTimeH) {
        startM = 0;
      } else {
        startM = startTimeM;
      }

      if (endH !== endTimeH || endTimeH === 18) {
        endM = 0;
      } else {
        endM = endTimeM;
      }

      return ((endH - startH) * (100 / this.nbHours) + (endM - startM) * (100 / (this.nbHours * 60)));
    } else {
      return 0;
    }
  }

  /**
   * @param {number} supH: the start hour of the following event or 18 if last event of the day
   * @param {number} infH: the end hour of the event
   * @param {number} supM: the start minutes of the following event or 0 if last event of the day
   * @param {number} infM: the end minutes of the event
   * This function determines the value after the event (free time) and before the following one
   * @return {number}: the value after the event in the progressbar
   */
  calculValueAfter(supH: number, infH: number, supM: number, infM: number): number {
    let hour: number = supH - infH;
    let min: number = supM - infM;
    if ((supM - infM) < 0) {
      hour = hour - 1;
      min = min + 60;
    }
    const valueAfter = (hour * (100 / this.nbHours) + min * (100 / (this.nbHours * 60)));
    if (valueAfter <= 0) {
      return 0;
    } else {
      return valueAfter;
    }
  }

  /**
   * @param {string} time: an hour
   * @param {string} moment: AM or PM
   * Transform an hour given in the format 12h to the format 24h
   * @return {number}: the given hour in the format 24h
   */
  adaptTime(time: string, moment: string): number {
    if (moment === 'PM' && time !== '12') {
      return (parseInt(time, 10) + 12);
    } else {
      return parseInt(time, 10);
    }
  }

  /**
   * @param {number} index: the index to push in the good day
   * @param {number} value: the value to push
   * @param {string} type: the type to determine the color
   * @param {string} label: the label (= displayed text)
   * Push the value in the array
   */
  pushInDays(index: number, value: number, type: string, label: string): void {
    this.days[index].push({
      value: value,
      type: type,
      label: label
    });
  }

  /**
   * Complete the days which do not have a value (to do not have an empty progressbar without color)
   */
  completeEmptyDays(): void {
    for (let i = 0; i < this.days.length; i++) {
      const day = this.days[i];
      if (day.length === 0) {
        this.pushInDays(i, 100, 'success', '');
      }
    }
  }

  /**
   * Returns count of weeks for year and month
   * Source: https://stackoverflow.com/questions/2483719/get-weeks-in-month-through-javascript
   * @param {Number} year - full year (2016)
   * @param {Number} month_number - month_number is in the range 1..12
   * @return {number}
   */
  weeksCount (year, month_number) {
    const firstOfMonth = new Date(year, month_number - 1, 1);
    let day = firstOfMonth.getDay() || 6;
    day = day === 1 ? 0 : day;
    if (day) {
      day = day - 1;
    }
    let diff = 7 - day;
    const lastOfMonth = new Date(year, month_number, 0);
    const lastDate = lastOfMonth.getDate();
    if (lastOfMonth.getDay() === 1) {
      diff = diff - 1;
    }
    return Math.ceil((lastDate - diff) / 7) + 1;
  }

  ngOnInit() {
  }

}
