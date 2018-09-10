"use strict";

// npm dependencies and libraries
require('dotenv').config();
const { google } = require('googleapis');
const util = require('./utilitaries');
const pool = require('../db/pool');


// The functions
module.exports = {
  getCalendar: function (auth, calendarId, timeScale) {
    const calendar = google.calendar({ version: 'v3', auth });
    const eventsToSend = {};
    const times = this.getTimes(timeScale);
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
          reject (err);
        }
        else {
          that.insertEventDB(event['data'], eventInfo['organizer2'])
            .then(() => {
              resolve(event['data']);
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
      let orga2Email = null;
      let room = null;

      if (orga2) {
        orga2Email = orga2['Email'];
      }
      if (eventInfo['room']) {
        room = eventInfo['room']['Name']
      }

      const query = `INSERT INTO reservations 
      (idEventGoogleCalendar, Organizer1, Organizer2, Room, StartDate, EndDate)
      VALUES ('${eventInfo['id']}', '${eventInfo['organizer']['email']}', '${orga2Email}', '${room}', '${start}', '${end}')`;

      pool.calendar_pool.query(query, function (err) {
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
      calendar.events.delete({
        calendarId: organizerEmail,
        eventId: eventId
      }, function (err) {
        if (err) {
          reject(err);
        }
        else {
          calendar.events.get({
            calendarId: organizerEmail,
            eventId: eventId
          }, function (err, res) {
            if (err) {
              reject(err);
            } else {
              resolve(res.data);
            }
          });
        }
      });
    });
  },

  verifyOccupancy: function (roomToVerify, eventToVerify) {
    return new Promise((resolve, reject) => {
      util.getSecondOrganizer(eventToVerify['id'])
        .then(orga2 => {
          let res = 'no';
          const promises = [];
          promises.push(util.getUserPositionFromEmail(eventToVerify['organizer']['email']));
          if (orga2) {
            promises.push(util.getUserPositionFromEmail(orga2));
          }

          Promise.all(promises)
            .then(positions => {
              for (let i = 0; i < promises.length; i++) {
                if (positions[i] === roomToVerify) {
                  res = 'yes';
                }
              }
              resolve(res);
            })
            .catch(err => {
              reject(err);
            });
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
  },

  determineTimeScale: function (event) {
    let times = this.getTimes('Day');
    let startTime = new Date(times['timeMin']).getTime();
    let endTime = new Date(times['timeMax']).getTime();
    let eventStartTime = new Date(event['start']['dateTime']).getTime();

    if (eventStartTime >= startTime && eventStartTime <= endTime) {
      return 'Day';
    }
    else {
      times = this.getTimes('Week');
      startTime = new Date(times['timeMin']).getTime();
      endTime = new Date(times['timeMax']).getTime();
      if (eventStartTime >= startTime && eventStartTime <= endTime) {
        return 'Week';
      }
      else {
        return 'Month';
      }
    }
  }
};
