"use strict";

// npm dependencies and libraries
require('dotenv').config();
const { google } = require('googleapis');
const request = require('request');
const pool = require('../db/pool');


// The functions
module.exports = {
  setOAuth2Client: function() {
    const oAuth2Client = new google.auth.OAuth2(
      process.env.CLIENT_ID,
      process.env.CLIENT_SECRET,
      process.env.REDIRECT_URL
    );

    return oAuth2Client;
  },

  getAuthUrl: function (auth2Client) {
    const SCOPES = ['https://www.googleapis.com/auth/calendar'];
    const authUrl = auth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
    });

    return authUrl;
  },

  hasTokens: function (userId) {
    const query = `SELECT AccessToken, RefreshToken FROM users WHERE IdGoogle = ${userId}`;

    return new Promise((resolve, reject) => {
      pool.calendar_pool.query(query, function (err, row) {
        if (!err) {
          if (row[0]['AccessToken'] !== null && row[0]['RefreshToken'] !== null) {
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

  getTokens: function (code) {
    const bodyR = 'code=' + code +
      '&client_id=' + process.env.CLIENT_ID +
      '&client_secret=' + process.env.CLIENT_SECRET +
      '&redirect_uri=' + process.env.REDIRECT_URL +
      '&grant_type=authorization_code';
    
    return new Promise ((resolve, reject) => {
      request.post({
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        url: 'https://www.googleapis.com/oauth2/v4/token',
        body: bodyR
      }, function (err, response, body) {
        if (!err) {
          const tokens = {
            access_token: JSON.parse(body)['access_token'],
            refresh_token: JSON.parse(body)['refresh_token']
          };
          resolve(tokens);
        }
        else {
          reject(err);
        }
      });
    });
  },

  storeTokens: function (userId, accessToken, refreshToken) {
    const query = `UPDATE users SET AccessToken = '${accessToken}', RefreshToken = '${refreshToken}'
      WHERE IdGoogle = ${userId}`;

    return new Promise ((resolve, reject) => {
      pool.calendar_pool.query(query, function (err) {
        if (!err) {
          resolve('row updated');
        }
        else {
          reject(err);
        }
      });
    });
  }

};
