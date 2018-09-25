"use strict";

// npm dependencies and libraries
require('dotenv').config();
const { google } = require('googleapis');
const pool = require('../db/pool');


// The functions
module.exports = {
  /**
   * @param auth: the OAuth2Client with the credentials (= access and refresh tokens)
   * @param {string} calendarId: the mail address of the calendar to display
   * @param {string} timeScale: the timescale (Day/Week/Month)
   * This function determines the start and end time of the timescale and returns the events
   * @return {Promise}: Promise with the events according to the calendarId and timeScale
   */
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

  /**
   * @param calendar: Google Calendar Object set with the OAuth2Client
   * @param {string} calendarId: the mail address of the calendar to display
   * @param {JSON} times: the start and end time.
   * This function requests the Google Calendar API to get the events between the start and end time
   * of the calendar 'calendarId'
   * @return {Promise}: Promise with the events
   */
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
            // User is not a insight member, then he cannot see the asked calendar (for a room)
            resolve([]);
          }
          else {
            reject(err);
          }
        }
      });
    });
  },

  /**
   * @param {string} timescale: the timescale (Day/Week/Month)
   * This function determines the start and end time of the given timescale
   * @return {JSON}: JSON Object with the attributes timeMin and timeMax
   */
  getTimes: function (timescale) {
    const now = new Date();
    const times = {};
    if (timescale === 'Day') {
      times['timeMin'] = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())).toISOString();
      times['timeMax'] = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)).toISOString();
    }
    else if (timescale === 'Week') {
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

  /**
   * @param auth: the OAuth2Client with the credentials (= access and refresh tokens)
   * @param {JSON} eventInfo: the information about the event (Time, Title, Attendees, Room, Organizer(s))
   * This function requests the Google Calendar API to create the event (if the room is available) 
   * and calls the function to insert it in database.
   * @return {Promise}: Promise with the information about the event (or null if the room is not available).
   */
  createEvent: function (auth, eventInfo) {
    const calendar = google.calendar({ version: 'v3', auth });
    return new Promise((resolve, reject) => {
      const that = this;
      // Before, check the availability of the room
      this.verifyRoomAvailability(calendar, eventInfo)
        .then(bool => {
          if (bool === true) {
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

  /**
   * @param calendar: Google Calendar Object set with the OAuth2Client
   * @param {JSON} eventInfo: the information about the event (Time, Title, Attendees, Room, Organizer(s))
   * This function determines if the room is available (free) during the event
   * @return {Promise}: Promise with a boolean: true if the room is available, false if not.
   */
  verifyRoomAvailability: function (calendar, eventInfo) {
    return new Promise((resolve, reject) => {
      const times = this.getTimes('Week'); // Week because it's the only timescale displayed for the rooms
      this.pullCalendar(calendar, eventInfo['room']['Email'], times)
        .then(roomEvents => {
          let bool = true;
          for (let i = 0; i < roomEvents.length; i++) {
            const event = roomEvents[i];
            const startEvent = new Date(event['start']['dateTime']);
            const endEvent = new Date(event['end']['dateTime']);
            const startNew = new Date(eventInfo['startDate']);
            const endNew = new Date(eventInfo['endDate']);
            if (this.isBetween(startEvent, endEvent, startNew, endNew)) {
              bool = false;
            }
          }
          resolve(bool);
        })
        .catch(err => {
          reject(err);
        });
    });
  },

  /**
   * @param {Date} date1: A first date
   * @param {Date} date2: A second date
   * @param {Date} date3: A third date
   * @param {Date} date4: A fouth date
   * This function determines if the couple (date3, date4) is between the couple (date1, date2)
   * in the aim to know if the new event will take place during another one or not
   * @return {boolean}: true if date3 is between the date1 and date2, false if not
   */
  isBetween: function (date1, date2, date3, date4) {
    const time1 = date1.getTime();
    const time2 = date2.getTime();
    const time3 = date3.getTime();
    const time4 = date4.getTime();
    if (time3 >= time1 && time3 <= time2 || time4 >= time1 && time4 <= time2) {
      return true;
    } else {
      return false;
    }
  },

  /**
   * @param {JSON} eventInfo: the information about the event (Time, Title, Attendees, Room, Main Organizer)
   * This function creates the JSON Object to create the event with the Google Calendar API
   * @return {JSON}: the information structured
   */
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

  /**
   * @param {JSON} eventInfo: the information about the event (Time, Title, Attendees, Room, Main Organizer)
   * @param {string} orga2: mail address of the second organizer
   * This function inserts the new event in the database
   * @return {Promise}: Promise to tell the event is inserted 
   */
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
          resolve();
        }
        else {
          reject(err);
        }
      });
    });
  },

  /**
   * @param auth: the OAuth2Client with the credentials (= access and refresh tokens)
   * @param {string} organizerEmail: the main organizer's email 
   * @param {string} eventId: the GoogleId of the event
   * This function cancels the event with the given eventId if the event is not already cancelled
   * @return {Promise}: Promise with
   */
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

  /**
   * @param calendar: Google Calendar Object set with the OAuth2Client
   * @param {string} calendarId: the main organizer's email
   * @param {string} eventId: the GoogleId of the event
   * This function requests the Google Calendar API to get the information the event 'eventId'
   * @return {Promise}: Promise with the information about the event
   */
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

  /**
   * @param auth: Google Calendar Object set with the OAuth2Client
   * @param {string} calendarId: the main organizer's email
   * @param {string} eventId: the GoogleId of the event
   * @param {string} newEnd: the new end of the event (format: dateTime)
   * This function updates the end of the event
   * @return {Promise}: Promise with the updated information about the event
   */
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
