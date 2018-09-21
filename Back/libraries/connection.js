"use strict";

// npm dependencies and libraries
require('dotenv').config();
const { OAuth2Client } = require('google-auth-library');
const util = require('./utilitaries');
const pool = require('../db/pool');


// The functions
module.exports = {
  /**
   * @param {string} token: The token sent by the front (token given by Google)
   * This function verify the token
   * @return {JSON}: return a JSON Object sent by Google with information about the user
   */
  verifyGoogleToken: async function (token) {
    const client = new OAuth2Client(process.env.CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.CLIENT_ID,
    });
    const payload = ticket.getPayload();
    return payload;
  },

  /**
   * @param {JSON} googleUserInfo: Google informtion (= payload) about the user
   * This function get the information about the user who wants to login
   * If the user does not exist in database, it inserts him
   * @return {Promise}: Promise with a JSON Object which contains the Name/Email/GoogleId of the user
   */
  getUserInformation: function (googleUserInfo) {
    return new Promise((resolve, reject) => {
      util.googleUserExist(googleUserInfo['sub'])
        .then(user => {
          if (user.length === 0) {
            this.insertNewUser(googleUserInfo).then(user2 => {
              resolve(user2);
            });
          } 
          else {
            resolve(user[0]);
          }
        })
        .catch(err => {
          reject(err);
        });
    });
  },

  /**
   * @param {JSON} googleUserInfo: Google informtion (= payload) about the user
   * @param {string} idCard: id of the user's card, null if not supplied
   * This function inserts the user in the database
   * @return {Promise}: Promise with the Name/Email/GoogleId of the user
   */
  insertNewUser: function (googleUserInfo, idCard = null) {
    const googleId = googleUserInfo['sub'];
    const fName = googleUserInfo['family_name'];
    const gName = googleUserInfo['given_name'];
    const email = googleUserInfo['email'];
    const user = {
      'IdGoogle': googleId,
      'LastName': fName,
      'FirstName': gName,
      'Email': email
    };
    let query = ``;

    if(idCard !== null) {
      query = `INSERT INTO users 
      (IdGoogle, LastName, FirstName, Email, IdCard) 
      VALUES ('${googleId}', '${fName}', '${gName}', '${email}', '${idCard}')`;
    }
    else {
      query = `INSERT INTO users 
      (IdGoogle, LastName, FirstName, Email) 
      VALUES ('${googleId}', '${fName}', '${gName}', '${email}')`;
    }

    return new Promise((resolve, reject) => {
      pool.calendar_pool.query(query, function (err) {
        if (!err) {
          resolve(user);
        }
        else {
          reject(err);
        }
      });
    });
  },

  /**
   * @param {string} idCard: id of the user's card
   * This function returns the Name/Email/GoogleId of the user according to the idCard
   * @return {Promise}: Promise with the information about the user (or no information found)
   */
  verifyCard: function (idCard) {
    const query = `SELECT IdGoogle, LastName, FirstName, Email FROM users WHERE IdCard = ${idCard}`;
    return new Promise((resolve, reject) => {
      pool.calendar_pool.query(query, function (err, row) {
        if (!err) {
          if (row.length) {
            resolve(row[0]);
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
   * @param {JSON} googleUserInfo: Google informtion (= payload) about the user
   * @param {string} idCard: id of the user's card
   * This functions manages the registeration of a card
   * If the user does not exist, it inserts him
   * If the user already has a card associated, it replaces the card
   * @return {Promise}: Promise with the Name/Mail/GoogleId of the user
   */
  registerCard: function (googleUserInfo, idCard) {
    return new Promise((resolve, reject) => {
      util.googleUserExist(googleUserInfo['sub'])
        .then(user => {
          if (user.length === 0) {
            this.insertNewUser(googleUserInfo, idCard)
              .then(user2 => {
                resolve(user2);
              })
              .catch(err => {
                reject(err);
              });
          }
          else {
            this.verifyCard(idCard)
              .then(userDb => {
                if (userDb === null || userDb['IdGoogle'] !== googleUserInfo['sub']) {
                  this.updateCard(googleUserInfo['sub'], idCard)
                    .then(() => {
                      resolve(user[0]);
                    })
                    .catch(err => {
                      reject(err);
                    });
                }
                else {
                  resolve(user[0]);
                }
              })
              .catch(err => {
                reject(err);
              })
          }
        })
        .catch(err => {
          reject(err);
        });
    });
  },

  /**
   * @param {JSON} googleUserId: user's GoogleId
   * @param {string} idCard: id of the user's card
   * This function updates the card number associated to the user
   * If the card was associated to another user, 
   * it removes the precend user to do not have multiple users link to one card.
   * @return {Promise}: Promise to tell the card number is updated
   */
  updateCard: function (googleUserId, idCard) {
    return new Promise((resolve, reject) => {
      util.removeUserFromCard(idCard)
        .then(() => {
          const query = `UPDATE users SET IdCard = ${idCard} WHERE IdGoogle = ${googleUserId}`;
          pool.calendar_pool.query(query, function (err) {
            if (!err) {
              resolve();
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
