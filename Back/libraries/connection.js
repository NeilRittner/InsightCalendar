"use strict";

// npm dependencies and libraries
require('dotenv').config();
const { OAuth2Client } = require('google-auth-library');
const util = require('./utilitaries');
const pool = require('../db/pool');


// The functions
module.exports = {
  verifyGoogleToken: async function (token) {
    const client = new OAuth2Client(process.env.CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.CLIENT_ID,
    });
    const payload = ticket.getPayload();
    return payload;
  },

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

  updateCard: function (googleUserId, idCard) {
    return new Promise((resolve, reject) => {
      util.removeUserFromCard(idCard)
        .then(() => {
          const query = `UPDATE users SET IdCard = ${idCard} WHERE IdGoogle = ${googleUserId}`;
          pool.calendar_pool.query(query, function (err) {
            if (!err) {
              resolve('row updated');
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
