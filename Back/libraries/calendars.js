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
            console.log(JSON.stringify(eventsToSend));
            resolve(eventsToSend);
          })
          .catch(err => {
            reject(err);
          });
      });
    }
    else {
      return new Promise((resolve, reject) => {
        times = this.getTimes('day');
        this.getEvents(calendar, times)
          .then(eventsDay => {
            if (eventsDay.length < 3) {
              times = this.getTimes('week');
              this.getEvents(calendar, times)
                .then(eventsWeek => {
                  if (eventsWeek.length < 2) {
                    times = this.getTimes('month');
                    this.getEvents(calendar, times)
                      .then(eventsMonth => {
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
      });
    }
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
    if (newTimeScale === 'day') {
      times['timeMin'] = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())).toISOString();
      times['timeMax'] = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)).toISOString();
    }
    else if (newTimeScale === 'week') {
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
        if (!err) resolve(row[0]);
        else reject(err);
      });
    });
  }

};
