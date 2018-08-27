"use strict";

// npm dependencies and libraries
require('dotenv').config();
const { google } = require('googleapis');
const util = require('./utilitaries');
const pool = require('../db/pool');


// The functions
module.exports = {
  getCalendar: function (auth, calendarId, timeScale = null) {
    const calendar = google.calendar({ version: 'v3', auth });
    const eventsToSend = {};
    let times;
    if (timeScale) {
      times = this.getTimes(timeScale);
      return new Promise((resolve, reject) => {
        this.pullCalendar(calendar, calendarId, times)
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
        this.pullCalendar(calendar, calendarId, times)
          .then(eventsDay => {
            if (eventsDay.length === 0) {
              times = this.getTimes('Week');
              this.pullCalendar(calendar, calendarId, times)
                .then(eventsWeek => {
                  if (eventsWeek.length === 0) {
                    times = this.getTimes('Month');
                    this.pullCalendar(calendar, calendarId, times)
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

  pullCalendar: function (calendar, calendarId, times) {
    return new Promise((resolve, reject) => {
      calendar.events.list({
        calendarId: calendarId,
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

  createEvent: function (auth, eventInfo) {
    const calendar = google.calendar({ version: 'v3', auth });

    return new Promise((resolve, reject) => {
      const that = this;
      calendar.events.insert({
        // auth: auth,
        calendarId: 'primary',
        resource: this.structureEvent(eventInfo)
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

  structureEvent: function (eventInfo) {
    const attendees = [];
    attendees.push({ 'email': eventInfo['room']['Email'] });
    eventInfo['attendees'].forEach(attendee => {
      attendees.push({ 'email': attendee['Email'] });
    });

    const eventToInsert = {
      'summary': eventInfo['title'],
      'location': eventInfo['room']['Name'],
      'start': {
        'dateTime': eventInfo['startDate']
      },
      'end': {
        'dateTime': eventInfo['endDate']
      },
      'attendees': attendees,
      'reminders': {
        'useDefault': false,
        'overrides': [
          { 'method': 'email', 'minutes': 10 }
        ]
      }
    };

    return eventToInsert;
  },

  insertEventDB: function (eventInfo) {
    return new Promise((resolve, reject) => {
      util.getNameFromEmail(eventInfo['organizer']['email'])
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
  },

  cancelEvent: function (auth, organizerEmail, eventId) {
    const calendar = google.calendar({ version: 'v3', auth });
    return new Promise((resolve, reject) => {
      calendar.events.delete({
        calendarId: organizerEmail,
        eventId: eventId
      }, function (err) {
        if (err) {
          reject(err);
        }
        else {
          resolve('');
        }
      });
    });
  },

  verifyOccupancy: function (roomToVerify, eventToVerify) {
    return new Promise((resolve, reject) => {
      for (let i = 0; i < eventToVerify['attendees'].length; i++) {
        const attendee = array[i];
        if (!attendee['resource'] && attendee['responseStatus'] === 'accepted') {
          util.getUserPositionFromEmail(attendee['email'])
            .then(position => {
              if (position === roomToVerify) {
                resolve('yes');
              }
            })
            .catch(err => {
              reject(err);
            });
        }
      }
      resolve('no');
    });
  }

};
