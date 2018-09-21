"use strict";

// npm dependencies and libraries
require('dotenv').config();
const { google } = require('googleapis');
const request = require('request');
const pool = require('../db/pool');


// The functions
module.exports = {
  /**
   * This function sets an OAuth2Client without the credentials
   * which will allow to send request to the Google Calendar API
   * @return {OAuth2Client}: the OAuth2Client
   */
  setOAuth2Client: function() {
    const oAuth2Client = new google.auth.OAuth2(
      process.env.CLIENT_ID,
      process.env.CLIENT_SECRET,
      process.env.REDIRECT_URL
    );

    return oAuth2Client;
  },

  /**
   * @param auth2Client: the OAuth2Client
   * This function creates the url of the page to get the user's authorization to manage his calendar.
   * This function is called only if the user use the application for the first time
   * @return {string}: return the url
   */
  getAuthUrl: function (auth2Client) {
    const SCOPES = ['https://www.googleapis.com/auth/calendar'];
    const authUrl = auth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
    });

    return authUrl;
  },

  /**
   * @param {string} userId: user's GoogleId
   * This function returns the tokens (access and refresh) of the user, or null if no tokens found
   * @return {Promise}: Promise with a JSON object which contains the tokens
   */
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

  /**
   * @param {string} code: code sent by google to exchange it against the access and refresh tokens
   * This function exchanges the code against the access and refresh tokens
   * @return {Promise}: Promise with a JSON Object which contains the tokens
   */
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

  /**
   * @param {string} userId: user's GoogleId
   * @param {string} accessToken: the access token
   * @param {string} refreshToken: the refresh token
   * This function stores the token in database
   * @return {Promise}: Promise to tell the tokens are stored
   */
  storeTokens: function (userId, accessToken, refreshToken) {
    const query = `UPDATE users SET AccessToken = '${accessToken}', RefreshToken = '${refreshToken}'
      WHERE IdGoogle = ${userId}`;

    return new Promise ((resolve, reject) => {
      pool.calendar_pool.query(query, function (err) {
        if (!err) {
          resolve();
        }
        else {
          reject(err);
        }
      });
    });
  }

};
