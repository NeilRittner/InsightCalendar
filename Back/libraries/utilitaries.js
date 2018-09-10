"use strict";

// npm dependencies and libraries
require('dotenv').config();
const pool = require('../db/pool');


// The functions
module.exports = {
  getNameFromEmail: function (email) {
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

  getAllRoom: function () {
    const query = `SELECT * FROM rooms`;

    return new Promise((resolve, reject) => {
      pool.calendar_pool.query(query, function (err, rows) {
        if (!err) {
          resolve(rows);
        }
        else {
          reject(err);
        }
      });
    });
  },

  getAllUsers: function () {
    const query = `SELECT FirstName, LastName, Email FROM users`;

    return new Promise((resolve, reject) => {
      pool.calendar_pool.query(query, function (err, rows) {
        if (!err) {
          resolve(rows);
        }
        else {
          reject(err);
        }
      });
    });
  },

  getUserPosition: function (userIdCard) {
    const query = `SELECT Position FROM users WHERE IdCard = ${userIdCard}`;

    return new Promise((resolve, reject) => {
      pool.calendar_pool.query(query, function (err, row) {
        if (!err) {
          resolve(row[0]['Position']);
        }
        else {
          reject(err);
        }
      });
    });
  },

  getUserPositionFromEmail: function (userEmail) {
    const query = `SELECT Position FROM users WHERE Email = '${userEmail}'`;
    return new Promise((resolve, reject) => {
      pool.calendar_pool.query(query, function (err, row) {
        if (!err) {
          if (row[0] === undefined) {
            resolve(null);
          }
          else {
            resolve(row[0]['Position']);
          }
        }
        else {
          reject(err);
        }
      });
    });
  },

  getRoomInformation: function (roomName) {
    const query = `SELECT * FROM rooms WHERE Name = '${roomName}'`;
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

  getUserMailFromCard: function (idCard) {
    const query = `SELECT Email FROM users WHERE IdCard = '${idCard}'`;
    return new Promise((resolve, reject) => {
      pool.calendar_pool.query(query, function (err, row) {
        if (!err) {
          resolve(row[0]['Email']);
        }
        else {
          reject(err);
        }
      });
    });
  },

  organizerIsPresent: function (organizerEmail, eventId, roomName) {
    return new Promise((resolve, reject) => {
      this.getSecondOrganizer(eventId)
        .then(coOrgaEMail => {
          let query = `SELECT Position FROM users WHERE Email = '${organizerEmail}'`;
          if (coOrgaEMail) {
            query = query + `OR Email = '${coOrgaEMail}'`
          }
          pool.calendar_pool.query(query, function (err, row) {
            if (!err) {
              if (row[0] === undefined) {
                resolve('no');
              }
              else {
                let res = 'no'; 
                for (let i = 0; i < row.length; i++) {
                  const position = row[i]['Position'];
                  if (position === roomName) {
                    res = 'yes';
                  }
                }
                resolve(res);
              }
            }
            else {
              reject(err);
            }
          });
        })
        .catch(err => {
          reject(err);
        });
    });
  },

  getSecondOrganizer: function (eventId) {
    const query = `SELECT Organizer2 FROM reservations WHERE IdEventGoogleCalendar = '${eventId}'`;
    return new Promise((resolve, reject) => {
      pool.calendar_pool.query(query, function (err, row) {
        if (!err) {
          if (row[0]) {
            resolve(row[0]['Organizer2']);
          }
          else {
            resolve(null);
          }
        }
        else {
          reject(err);
        }
      });
    });
  },

  removeUserFromCard: function (cardId) {
    const query = `DELETE FROM users WHERE IdCard = ${cardId}`;
    return new Promise((resolve, reject) => {
      pool.calendar_pool.query(query, function (err) {
        if (!err) {
          resolve('');
        }
        else {
          reject(err);
        }
      });
    });
  }
};