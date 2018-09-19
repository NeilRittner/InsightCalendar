import { Component, OnInit, Input, OnChanges } from '@angular/core';

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.css']
})
export class CalendarComponent implements OnInit, OnChanges {

  constructor() { }

  @Input() timeScale: string;
  @Input() events: Array<any>;
  days: Array<any>;
  indexDay: number;
  hours = ['9am', '10am', '11am', '12pm', '1pm', '2pm', '3pm', '4pm', '5pm'];
  nbHours = this.hours.length;
  weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  numberOfWeeksInMonth: number;
  monthDays: Array<any>;
  daysNumber: Array<any>;
  timeBeforeRemove = 1;

  ngOnChanges() {
    if (this.timeScale !== 'Month') {
      this.days = [[], [], [], [], []];
      let exEventLongDate: Date;

      if (this.timeScale === 'Day') {
        this.indexDay = new Date().getDay() - 1;
      }

      for (let i = 0; i < this.events.length; i++) {
        const event = this.events[i];
        const eventLongDate = new Date(event['date']);
        const indexInDays = eventLongDate.getDay() - 1;
        const startTimes = event['start']['dateTime'].split(':');
        const endTimes = event['end']['dateTime'].split(':');
        startTimes[0] = this.adaptTime(startTimes[0], startTimes[1].split(' ')[1]);
        endTimes[0] = this.adaptTime(endTimes[0], endTimes[1].split(' ')[1]);
        startTimes[1] = parseInt(startTimes[1].split(' ')[0], 10);
        endTimes[1] = parseInt(endTimes[1].split(' ')[0], 10);


        if (indexInDays !== -1 && indexInDays !== 5) {
          /* ValueEvent */
          let valueEvent = this.calculValueEvent(startTimes[0], endTimes[0], startTimes[1], endTimes[1]);

          /* ValueBefore */
          if (!exEventLongDate || exEventLongDate.getDate() !== eventLongDate.getDate()) {
            exEventLongDate = eventLongDate;
            const valueBefore = ((startTimes[0] - 9) * (100 / this.nbHours)) + (startTimes[1] * (100 / (this.nbHours * 60)));
            if (valueBefore > 0) {
              this.pushInDays(indexInDays, valueBefore, 'success', '');
            }
          }

          /* ValueAfter */
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
              const valueInterEvent = 0.15;
              valueEvent = valueEvent - valueInterEvent;
              this.pushInDays(indexInDays, valueEvent, event['type'], event['summary']);
              this.pushInDays(indexInDays, valueInterEvent, 'info', '');
            }
          } else {
            this.pushInDays(indexInDays, valueAfter, 'success', '');
          }
        }
      }
      this.completeEmptyDays();
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
   * Source: http://www.somethinghitme.com/2010/04/14/how-to-get-the-week-in-a-month-for-a-date-with-javascript/
   * @param eventDate
   */
  positionInMonth(eventDate): number {
    const firstDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), 1).getDay();
    return Math.ceil((eventDate.getDate() + firstDay) / 7);
  }

  calculValueEvent(startTimeH, endTimeH, startTimeM, endTimeM): number {
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

  calculValueAfter(supH, infH, supM, infM): number {
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

  adaptTime(time, moment): number {
    if (moment === 'PM' && time !== '12') {
      return (parseInt(time, 10) + 12);
    } else {
      return parseInt(time, 10);
    }
  }

  pushInDays(index, value, type, label): void {
    this.days[index].push({
      value: value,
      type: type,
      label: label
    });
  }

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
   * @returns {number}
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

  determineEventType(dateEvent: Date, startH, startM): string {
    const nowTime = new Date().getTime();
    const eventDate = dateEvent;
    eventDate.setHours(startH);
    eventDate.setMinutes(startM);
    const eventTime = eventDate.getTime();

    if (nowTime < eventTime + this.timeBeforeRemove * 60 * 1000) {
      return 'warning';
    } else {
      return 'danger';
    }
  }

  ngOnInit() {
  }

}
