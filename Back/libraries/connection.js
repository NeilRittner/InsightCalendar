"use strict";

// npm dependencies and libraries
require('dotenv').config();
const { OAuth2Client } = require('google-auth-library');
const pool = require("../db/pool");


// The functions
module.exports = {
  verifyGoogleToken: async function (token) {
    const client = new OAuth2Client(process.env.CLIENT_ID);

    // Verify the token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.CLIENT_ID,
    });

    const payload = ticket.getPayload();
    return payload;
  },

  getUserInformation: function (googleUserInfo) {
    return new Promise((resolve, reject) => {
      this.googleUserExist(googleUserInfo['sub']).then(data => {
        if (data.length === 0) {
          this.insertNewUser(googleUserInfo).then(data2 => {
            resolve(data2);
          });
        } 
        else {
          resolve(data[0]);
        }
      });
    })
  },

  googleUserExist: function (googleUserId) {
    const query = `SELECT * FROM users WHERE IdGoogle = ${googleUserId}`;

    return new Promise((resolve, reject) => {
      pool.calendar_pool.query(query, function (err, row) {
        if (!err) {
          resolve(row);
        }
        else reject(err);
      });
    });
  },


  insertNewUser: function (googleUserInfo) {
    const googleId = googleUserInfo['sub'];
    const fName = '' + googleUserInfo['family_name'];
    const gName = '' + googleUserInfo['given_name'];
    const email = ''+ googleUserInfo['email'].substring(0, googleUserInfo['email'].indexOf('@'));

    const user = {
      'IdGoogle': googleId,
      'LastName': fName,
      'FirstName': gName,
      'Email': email
    };
    
    const query = `INSERT 
    INTO users (IdGoogle, LastName, FirstName, Email) 
    VALUES ('${ googleId }', '${ fName }', '${ gName }', '${ email }')`;

    return new Promise((resolve, reject) => {
      pool.calendar_pool.query(query, function (err) {
        if (!err) {
          resolve(user);
        }
        else reject(err);
      });
    });
  },

  verifyCard: function (cardNumber) {
    const query = `SELECT * FROM users WHERE IdAccessCard = ${cardNumber}`;

    return new Promise((resolve, reject) => {
      pool.calendar_pool.query(query, function (err, rows) {
        if (!err) {
          if (rows.length) {
            resolve(rows);
          }
          else {
            resolve(null);
          }
        }
        else reject(err);
      });
    });
  }

}
