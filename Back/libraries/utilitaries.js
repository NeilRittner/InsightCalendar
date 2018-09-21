"use strict";

// npm dependencies and libraries
require('dotenv').config();
const pool = require('../db/pool');


// The functions
module.exports = {
  /**
   * @param {string} googleUserId: the GoogleId of the user
   * This function checks if the user exists in database and return his information if he exists
   * @return {Promise}: Promise with the information in a JSON Object
   */
  googleUserExist: function (googleUserId) {
    const query = `SELECT IdGoogle, LastName, FirstName, Email FROM users WHERE IdGoogle = ${googleUserId}`;
    return new Promise((resolve, reject) => {
      pool.calendar_pool.query(query, function (err, row) {
        if (!err) {
          resolve(row);
        }
        else {
          reject(err);
        }
      });
    });
  },
  
  /**
   * This function returns the information about the 4 rooms
   * @return {Promise}: Promise with the information in a JSON Object
   */
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

  /**
   * This function returns the Name and Email of the users in database
   * @return {Promise}: Promise with the information in a JSON Object
   */
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

  /**
   * @param {string} userIdCard: the id/number of the user's card
   * This function returns the position of the given user
   * @return {Promise}: Promise with the position (string) or undefined if no user found
   */
  getUserPosition: function (userIdCard) {
    const query = `SELECT Position FROM users WHERE IdCard = ${userIdCard}`;
    return new Promise((resolve, reject) => {
      pool.calendar_pool.query(query, function (err, row) {
        if (!err) {
          if (row[0]) {
            resolve(row[0]['Position']);
          }
          else {
            resolve(undefined);
          }
        }
        else {
          reject(err);
        }
      });
    });
  },

  /**
   * @param {string} roomName: the name of the room
   * This function returns the information of the room according to the given name
   * @return {Promise}: Promise with the information in a JSON Object
   */
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

  /**
   * @param {string} organizerEmail: the main organizer's mail address
   * @param {string} eventId: the id of the event
   * @param {string} romName: the name of the room
   * This function determines if the organizer (or one of them if multiple) are in the given room
   * @return {Promise}: Promise with a string: yes if one of is in, no if not
   */
  organizersAttendance: function (organizerEmail, eventId, roomName) {
    return new Promise((resolve, reject) => {
      // First, we check in the database if there is a second organizer
      this.getSecondOrganizer(eventId)
        .then(orga2Email => {
          let query = `SELECT Position FROM users WHERE Email = '${organizerEmail}'`;
          if (orga2Email) {
            query = query + `OR Email = '${orga2Email}'`
          }
          pool.calendar_pool.query(query, function (err, row) {
            if (!err) {
              if (row[0] === undefined) {
                resolve('yes');
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

  /**
   * @param {string} eventId: the id of the event
   * This function checks in database if there is a second organizer for the given event
   * @return {Promise}: Promise with the second organizer's mail address if there is one, null if not
   */
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

  /**
   * @param {string} idCard: the id/number of the user's card
   * This function remove the user associated to the given id
   * @return {Promise}: Promise to tell the remove is finished
   */
  removeUserFromCard: function (idCard) {
    const query = `DELETE FROM users WHERE IdCard = ${idCard}`;
    return new Promise((resolve, reject) => {
      pool.calendar_pool.query(query, function (err) {
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
   * @param {string} userEmail: the user's mail address
   * This function returns the user's access and refresh tokens
   * @return {Promise}: Promise with the tokens in a JSON Object or null if no tokens found
   */
  getTokensFromEmail: function (userEmail) {
    const query = `SELECT AccessToken, RefreshToken FROM users WHERE Email = '${userEmail}'`;
    return new Promise((resolve, reject) => {
      pool.calendar_pool.query(query, function (err, row) {
        if (!err) {
          if (row[0] && row[0]['AccessToken'] !== null && row[0]['RefreshToken'] !== null) {
            const tokens = {
              access_token: row[0]['AccessToken'],
              refresh_token: row[0]['RefreshToken']
            };
            resolve(tokens);
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

  /**
   * @param {string} idCard: the id/number of the scanned card
   * @param {string} organizerEmail: the main organizer's mail address
   * @param {string} eventId: the id of the event
   * This function checks if the scanned card is the card of the organizer (or one of them if multiple)
   * @return {Promise}: Promise with a string: yes if it was an organizer's card, no if not
   * and null if the card is not associated to a user
   */
  organizersScan: function (idCard, organizerEmail, eventId) {
    return new Promise((resolve, reject) => {
      this.getSecondOrganizer(eventId)
        .then(orga2Email => {
          let query = `SELECT Email FROM users WHERE IdCard = ${idCard}`;
          
          pool.calendar_pool.query(query, function (err, row) {
            if (!err) {
              if (row[0] !== undefined) {
                if (row[0]['Email'] === organizerEmail || row[0]['Email'] === orga2Email) {
                  resolve('yes');
                } else {
                  resolve('no');
                }
              } else {
                resolve(null);
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
  }
};
