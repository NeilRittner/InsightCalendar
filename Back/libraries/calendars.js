"use strict";

// npm dependencies and libraries
require('dotenv').config();
const { google } = require('googleapis');
const pool = require('../db/pool');


// The functions
module.exports = {
  getCalendar: function (auth, calendarId, timeScale) {
    const calendar = google.calendar({ version: 'v3', auth });
    const times = this.getTimes(timeScale);
    return new Promise((resolve, reject) => {
      this.pullCalendar(calendar, calendarId, times)
        .then(events => {
          resolve(events);
        })
        .catch(err => {
          reject(err);
        });
    });
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
          if (err['response']['data']['error'] === 'invalid_grant') {
            // Issue with the access and refresh tokens
            reject('Tokens issue');
          }
          else if (err['errors'][0]['reason'] === 'notFound') {
            // User is not a insight member, then he cannot see the asked calendar
            resolve([]);
          }
          else {
            reject(err);
          }
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
      this.verifyRoomAvailability(calendar, eventInfo)
        .then(bool => {
          if (bool) {
            calendar.events.insert({
              auth: auth,
              calendarId: 'primary',
              resource: this.structureEvent(eventInfo)
            }, function (err, res) {
              if (err) {
                reject(err);
              }
              else {
                that.insertEventDB(res['data'], eventInfo['organizer2'])
                  .then(() => {
                    resolve(res['data']);
                  })
                  .catch(err => {
                    reject(err);
                  });
              }
            });
          }
          else {
            resolve(null);
          }
        })
        .catch(err => {
          reject(err);
        });
    });
  },

  verifyRoomAvailability: function (calendar, eventInfo) {
    return new Promise((resolve, reject) => {
      const times = this.getTimes('Week');
      this.pullCalendar(calendar, eventInfo['room']['Email'], times)
        .then(roomEvents => {
          let bool = true;
          for (let i = 0; i < roomEvents.length; i++) {
            const event = roomEvents[i];
            const startEvent = new Date(event['start']['dateTime']);
            const endEvent = new Date(event['end']['dateTime']);
            const startNew = new Date(eventInfo['startDate']);
            const endNew = new Date(eventInfo['endDate']);
            if (this.isSameDay(startEvent, startNew) || this.isSameDay(endEvent, endNew)) {
              if (endNew > startEvent && startNew < endEvent) {
                bool = false;
              }
            }
          }
          resolve(bool);
        })
        .catch(err => {
          reject(err);
        });
    });
  },

  isSameDay: function (date1, date2) {
    if (date1.getFullYear() === date2.getFullYear() && date1.getMonth() === date2.getMonth() && date1.getDate() === date2.getDate()) {
      return true;
    } else {
      return false;
    }
  },

  structureEvent: function (eventInfo) {
    const attendees = [];
    let location = '';

    attendees.push({ 'email': eventInfo['organizer1'], 'organizer': true });

    if (eventInfo['room']) {
      attendees.push({ 'email': eventInfo['room']['Email'] });
      location = eventInfo['room']['Name'];
    }

    if (eventInfo['organizer2']) {
      attendees.push({ 'email': eventInfo['organizer2']['Email'] });
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

  insertEventDB: function (eventInfo, orga2) {
    return new Promise((resolve, reject) => {
      const start = eventInfo['start']['dateTime'].split("+")[0];
      const end = eventInfo['end']['dateTime'].split("+")[0];
      let attendees = '';
      let orga2Email = null;
      let room = null;

      for (let i = 0; i < eventInfo['attendees'].length; i++) {
        const attendee = eventInfo['attendees'][i];
        if (i !== 0) {
          attendees = attendees + ';';
        }
        attendees = attendees + attendee['email']
      }

      if (orga2) {
        orga2Email = orga2['Email'];
      }

      if (eventInfo['location']) {
        room = eventInfo['location'];
      }

      const query = `INSERT INTO reservations 
      (idEventGoogleCalendar, Organizer1, Organizer2, Room, Attendees, StartDate, EndDate)
      VALUES ('${eventInfo['id']}', '${eventInfo['organizer']['email']}', '${orga2Email}', '${room}', '${attendees}', '${start}', '${end}')`;

      pool.calendar_pool.query(query, attendees, function (err) {
        if (!err) {
          resolve('Event inserted');
        }
        else {
          reject(err);
        }
      });
    });
  },

  cancelEvent: function (auth, organizerEmail, eventId) {
    const calendar = google.calendar({ version: 'v3', auth });
    return new Promise((resolve, reject) => {
      this.getEvent(calendar, organizerEmail, eventId)
        .then(dataEvent => {
          if (dataEvent['status'] === 'cancelled') {
            resolve(dataEvent);
          }
          else {
            calendar.events.delete({
              calendarId: organizerEmail,
              eventId: eventId
            }, function (err) {
              if (err) {
                reject(err);
              }
              else {
                resolve(dataEvent);
              }
            });
          }
        })
        .catch(err => {
          reject(err);
        })
    });
  },

  getEvent: function (calendar, calendarId, eventId) {
    return new Promise((resolve, reject) => {
      calendar.events.get({
        calendarId: calendarId,
        eventId: eventId
      }, function (err, res) {
        if (err) {
          reject(err);
        } else {
          resolve(res.data);
        }
      });
    });
  },

  updateEndEvent: function (auth, calendarId, eventId, newEnd) {
    const calendar = google.calendar({ version: 'v3', auth });
    return new Promise((resolve, reject) => {
      this.getEvent(calendar, calendarId, eventId)
        .then(dataEvent => {
          dataEvent['end']['dateTime'] = newEnd;
          calendar.events.update({
            calendarId: calendarId,
            eventId: eventId,
            resource: dataEvent
          }, function (err, response) {
            if (err) {
              reject(err);
            }
            else {
              resolve(response.data);
            }
          });
        })
        .catch(err => {
          reject(err);
        });
    });
  }
};
