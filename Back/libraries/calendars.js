"use strict";

// npm dependencies and libraries
require('dotenv').config();
const { google } = require('googleapis');
const pool = require('../db/pool');


// The functions
module.exports = {
  getCalendar: function (auth, timeScale = null) {
    const calendar = google.calendar({ version: 'v3', auth });
    const eventsToSend = {};
    let times;
    if (timeScale) {
      times = this.getTimes(timeScale);
      return new Promise((resolve, reject) => {
        this.getEvents(calendar, times)
          .then(events => {
            eventsToSend['timescale'] = timeScale;
            eventsToSend['events'] = events;
            resolve(eventsToSend);
          })
          .catch(err => {
            reject(err);
          });
      });
    }
    else {
      return new Promise((resolve, reject) => {
        times = this.getTimes('Day');
        this.getEvents(calendar, times)
          .then(eventsDay => {
            if (eventsDay.length < 3) {
              times = this.getTimes('Week');
              this.getEvents(calendar, times)
                .then(eventsWeek => {
                  if (eventsWeek.length < 2) {
                    times = this.getTimes('Month');
                    this.getEvents(calendar, times)
                      .then(eventsMonth => {
                        eventsToSend['timescale'] = 'Month';
                        eventsToSend['events'] = eventsMonth;
                        resolve(eventsToSend);
                      })
                      .catch(err => {
                        reject(err);
                      });
                  }
                  else {
                    eventsToSend['timescale'] = 'Week';
                    eventsToSend['events'] = eventsWeek;
                    resolve(eventsToSend);
                  }
                })
                .catch(err => {
                  reject(err);
                });
            }
            else {
              eventsToSend['timescale'] = 'Day';
              eventsToSend['events'] = eventsDay;
              resolve(eventsToSend);
            }
          })
          .catch(err => {
            reject(err);
          });
      });
    }
  },

  getEvents: function (calendar, times) {
    return new Promise((resolve, reject) => {
      calendar.events.list({
        calendarId: 'primary',
        timeMin: times['timeMin'],
        timeMax: times['timeMax'],
        singleEvents: true,
        orderBy: 'startTime'
      }, (err, res) => {
        if (!err) {
          resolve(res.data.items);
        }
        else {
          reject(err);
        }
      });
    });
  },

  getTimes: function (newTimeScale) {
    const now = new Date();
    const times = {};
    if (newTimeScale === 'Day') {
      times['timeMin'] = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())).toISOString();
      times['timeMax'] = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)).toISOString();
    }
    else if (newTimeScale === 'Week') {
      const day = now.getDate();
      const dayInWeek = now.getDay() - 1; // -1 to shift the 0 to monday.
      const lastDayOfWeek = 6 - dayInWeek;
      times['timeMin'] = new Date(Date.UTC(now.getFullYear(), now.getMonth(), day - dayInWeek)).toISOString();
      times['timeMax'] = new Date(Date.UTC(now.getFullYear(), now.getMonth(), day + lastDayOfWeek, 23, 59, 59)).toISOString();
    }
    else {
      times['timeMin'] = new Date(Date.UTC(now.getFullYear(), now.getMonth())).toISOString();
      times['timeMax'] = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)).toISOString();
    }
    return times;
  },

  getName: function (email) {
    const query = `SELECT FirstName, LastName FROM users WHERE Email = '${email}'`;

    return new Promise((resolve, reject) => {
      pool.calendar_pool.query(query, function (err, row) {
        if (!err) {
          resolve(row[0]);
        }
        else {
          reject(err);
        }
      });
    });
  },

  createEvent: function (auth, eventInfo) {
    const calendar = google.calendar({ version: 'v3', auth });
    const eventToInsert = {
      'summary': eventInfo['title'],
      // 'location': eventInfo['room'],
      // 'description': eventInfo['description'],
      'start': {
        'dateTime': eventInfo['startDate']
      },
      'end': {
        'dateTime': eventInfo['endDate']
      },
      'attendees': [],
      'reminders': {
        'useDefault': false,
        'overrides': [
          { 'method': 'email', 'minutes': 24 * 60 }
        ]
      }
    };

    return new Promise((resolve, reject) => {
      const that = this;
      calendar.events.insert({
        auth: auth,
        calendarId: 'primary',
        resource: eventToInsert
      }, function (err, event) {
        if (err) {
          console.log('There was an error contacting the Calendar service: ' + err);
          reject (err);
        }
        else {
          that.insertEventDB(event['data'])
            .then(() => {
              resolve('OK');
            })
            .catch(err => {
              reject(err);
            })
        }
      });
    });
  },

  insertEventDB: function (eventInfo) {
    return new Promise((resolve, reject) => {
      this.getName(eventInfo['organizer']['email'])
        .then(name => {
          const start = eventInfo['start']['dateTime'].split("+")[0];
          const end = eventInfo['end']['dateTime'].split("+")[0];
          const query = `INSERT INTO reservations 
          (idEventGoogleCalendar, OrganizerLastName, OrganizerFirstName, StartDate, EndDate)
          VALUES ('${eventInfo['id']}', '${name['LastName']}', '${name['FirstName']}', '${start}', '${end}')`;

          pool.calendar_pool.query(query, function (err) {
            if (!err) {
              resolve('Event inserted');
            }
            else {
              reject(err);
            }
          });
        })
        .catch(err => {
          reject(err)
        });
    });
  }

};
