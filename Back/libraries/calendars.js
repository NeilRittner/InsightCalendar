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
        auth: auth,
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
            });
        }
      });
    });
  },

  structureEvent: function (eventInfo) {
    const attendees = [];
    let location = '';

    if (eventInfo['room']) {
      attendees.push({ 'email': eventInfo['room']['Email'] });
      location = eventInfo['room']['Name'];
    }

    if (eventInfo['attendees']) {
      eventInfo['attendees'].forEach(attendee => {
        attendees.push({ 'email': attendee['Email'] });
      });
    }

    const eventToInsert = {
      'summary': eventInfo['title'],
      'location': location,
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

  cancelEvent: function (auth, organizerEmail, eventId, roomEmail) {
    const calendar = google.calendar({ version: 'v3', auth });
    const that = this;
    return new Promise((resolve, reject) => {
      calendar.events.delete({
        calendarId: organizerEmail,
        eventId: eventId
      }, function (err) {
        if (err) {
          reject(err);
        }
        else {
          that.getCalendar(auth, roomEmail, 'Day')
            .then(events => {
              events['events'] = that.removeEventInList(events['events'], eventId);
              if (events['events'].length === 0) {
                that.getCalendar(auth, roomEmail, 'Week')
                  .then(events2 => {
                    events2['events'] = that.removeEventInList(events2['events'], eventId);
                    if (events2['events'].length === 0) {
                      that.getCalendar(auth, roomEmail, 'Month')
                        .then(events3 => {
                          events3['events'] = that.removeEventInList(events3['events'], eventId);
                          resolve(events3);
                        })
                        .catch(err => {
                          reject(err)
                        });
                    }
                    else {
                      resolve(events2);
                    }
                  })
                  .catch(err => {
                    reject(err)
                  });
              }
              else {
                resolve(events);
              }
            })
            .catch(err => {
              reject(err)
            });
        }
      });
    });
  },

  removeEventInList: function (events, eventId) {
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
  },

  verifyOccupancy: function (roomToVerify, eventToVerify) {
    return new Promise((resolve, reject) => {
      let res = 'no';
      const promises = [];

      for (let i = 0; i < eventToVerify['attendees'].length; i++) {
        const attendee = eventToVerify['attendees'][i];
        if (!attendee['resource'] && attendee['responseStatus'] === 'accepted') {
          promises.push(util.getUserPositionFromEmail(attendee['email']));
        }
      }

      Promise.all(promises)
        .then(positions => {
          let j = 0;
          for (let i = 0; i < eventToVerify['attendees'].length; i++) {
            const attendee = eventToVerify['attendees'][i];
            if (!attendee['resource'] && attendee['responseStatus'] === 'accepted') {
              if (positions[j] === roomToVerify) {
                res = 'yes';
              }
              j = j + 1;
            }
          }
          resolve(res);
        })
        .catch(err => {
          reject(err);
        });
    });
  },

  updateEndEvent: function (auth, calendarId, eventId, newEnd) {
    const calendar = google.calendar({ version: 'v3', auth });
    return new Promise((resolve, reject) => {
      calendar.events.get({
        calendarId: calendarId,
        eventId: eventId
      }, function (err, res) {
        if (err) {
          reject(err);
        }
        res.data.end.dateTime = newEnd;

        calendar.events.update({
          calendarId: calendarId,
          eventId: eventId,
          resource: res.data
        }, function (err, response) {
          if (err) {
            reject(err);
          }
          else {
            resolve(response.data);
          }
        });
      });
    });
  }

};
