"use strict";

// npm dependencies and libraries
require('dotenv').config();
const { google } = require('googleapis');
const pool = require("../db/pool");


// The functions
module.exports = {
  getUserCalendar: function (auth) {
    const calendar = google.calendar({ version: 'v3', auth });
    const now = new Date();
    let times;
    const eventsToSend = {};
    return new Promise ((resolve, reject) => {
      times = this.getTimeDay(now);
      this.getEvents(calendar, times).then(eventsDay => {
        if (eventsDay.length < 3) {
          times = this.getTimeWeek(now);
          this.getEvents(calendar, times).then(eventsWeek => {
            if (eventsWeek.length < 2) {
              times = this.getTimeMonth(now);
              this.getEvents(calendar, times).then(eventsMonth => {
                eventsToSend['timescale'] = 'month';
                eventsToSend['events'] = eventsMonth;
                resolve(eventsToSend);
              })
              .catch(err => {
                reject(err);
              });
            }
            else {
              eventsToSend['timescale'] = 'week';
              eventsToSend['events'] = eventsWeek;
              resolve(eventsToSend);
            }
          })
          .catch(err => {
            reject(err);
          });
        }
        else {
          eventsToSend['timescale'] = 'day';
          eventsToSend['events'] = eventsDay;
          resolve(eventsToSend);
        }
      })
      .catch(err => {
        reject(err);
      });
    })
  },

  getEvents: function (calendar, times) {
    return new Promise ((resolve, reject) => {
      calendar.events.list({
        calendarId: 'primary',
        timeMin: times['timeMin'],
        timeMax: times['timeMax'],
        singleEvents: true,
        orderBy: 'startTime'
      }, (err, res) => {
        if (!err) resolve(res.data.items);
        else reject(err);
      });
    });
  },

  getTimeDay: function (now) {
    const times = {
      timeMin: new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())).toISOString(),
      timeMax: new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)).toISOString(),
    }
    return times;
  },

  getTimeWeek: function (now) {
    const day = now.getDate();
    const dayInWeek = now.getDay()-1; // -1 to shift the 0 to monday.
    const lastDayOfWeek = 6 - dayInWeek;
    const times = {
      timeMin: new Date(Date.UTC(now.getFullYear(), now.getMonth(), day-dayInWeek)).toISOString(),
      timeMax: new Date(Date.UTC(now.getFullYear(), now.getMonth(), day+lastDayOfWeek, 23, 59, 59)).toISOString(),
    }
    return times;
  },

  getTimeMonth: function (now) {
    const times = {
      timeMin: new Date(Date.UTC(now.getFullYear(), now.getMonth())).toISOString(),
      timeMax: new Date(Date.UTC(now.getFullYear(), now.getMonth()+1, 0, 23, 59, 59)).toISOString(),
    }
    return times;
  },

  getName: function (email) {
    const query = `SELECT FirstName, LastName FROM users WHERE Email = '${ email }'`;

    return new Promise((resolve, reject) => {
      pool.calendar_pool.query(query, function (err, row) {
        if (!err) resolve(row[0]);
        else reject(err);
      });
    });
  }

};
