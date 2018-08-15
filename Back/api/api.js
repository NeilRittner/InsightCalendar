"use strict";

// npm dependencies
require('dotenv').config()
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const session = require('express-session');


// Own libraries
const connection = require('../libraries/connection');
const authorization = require('../libraries/authorization');
const calendars = require('../libraries/calendars');


// Set the npm dependencies
app.use(cors({ credentials: true, origin: process.env.ORIGIN }));
app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


// The routes
/**
 * Route: googleAccess
 * This route is used to verify the idToken sent by the client-side and set the session user.
 * Return a status code:
 * 200: OK
 * 500: Internal Error
 * 498: Token not valid
 */
app.post('/googleAccess', function (req, res) {
  connection.verifyGoogleToken(req.body.idToken)
    .then(payload => {
      connection.getUserInformation(payload)
        .then(userInfo => {
          session.userInfo = userInfo;
          session.authClient = authorization.setOAuth2Client();
          authorization.hasTokens(session.userInfo['IdGoogle'])
            .then(tokens => {
              if (tokens) {
                session.authClient.setCredentials(tokens);
                res.status(200).send();
              }
              else {
                let url = authorization.getAuthUrl(session.authClient);
                url = url + '&login_hint=' + session.userInfo['IdGoogle'];
                res.status(200).send(JSON.stringify(url));
              }
            })
            .catch(err => {
              // console.log(err);
              res.status(500).send(err);
            });
        })
        .catch(err => {
          // console.log(err);
          res.status(500).send(err);
        });
    })
    .catch(err =>  {
      // console.log(err);
      res.status(498).send(err);
    });
});


/**
 * Route: cardAccess
 * This route is used to verify the id of the card sent by the client-side and set the session user.
 * Return a status code:
 * 200: OK
 * 404: User not found
 * 500: Internal Error
 */
app.post('/cardAccess', function (req, res) {
  connection.verifyCard(req.body.idCard)
    .then(userInfo => {
      if (userInfo) {
        session.userInfo = userInfo;
        res.status(200).send();
      } 
      else {
        res.status(200).send(JSON.stringify('User has no card'));
      }
    })
    .catch(err => {
      // console.log(err);
      res.status(500).send(err);
    });
});


/**
 * Route: registerCard
 * This route is used to link an idCard to a user (for the IoT Access enabled).
 * Return a status code:
 * 200: OK
 * 500: Internal Error
 * 498: Token not valid
 */
app.post('/registerCard', function (req, res) {
  connection.verifyGoogleToken(req.body.idToken)
    .then(payload => {
      connection.registerCard(payload, req.body.idCard)
        .then(userInfo => {
          session.userInfo = userInfo;
          session.authClient = authorization.setOAuth2Client();
          authorization.hasTokens(session.userInfo['IdGoogle'])
            .then(tokens => {
              if (tokens) {
                session.authClient.setCredentials(tokens);
                res.status(200).send();
              } 
              else {
                let url = authorization.getAuthUrl(session.authClient);
                url = url + '&login_hint=' + session.userInfo['IdGoogle'];
                res.status(200).send(JSON.stringify(url));
              }
            })
            .catch(err => {
              // console.log(err);
              res.status(500).send(err);
            });
        })
        .catch(err => {
          // console.log(err);
          res.status(500).send(err);
        });
    })
    .catch(err => {
      // console.log(err);
      res.status(498).send(err);
    });
});


/**
 * Route: code
 * This route will be used to receive the code, exchange it against the access and refresh tokens and store them.
 * Return a status code:
 * 200: OK
 * 500: Internal Error
 */
app.post('/code', function (req, res) {
  authorization.getTokens(req.body.code)
    .then(tokens => {
      session.authClient.credentials = tokens;
      authorization.storeTokens(session.userInfo['IdGoogle'], tokens['access_token'], tokens['refresh_token'])
        .then(() => {
          res.status(200).send();
        })
        .catch(err => {
          // console.log(err);
          res.status(500).send(err);
        });
    })
    .catch(err => {
      // console.log(err);
      res.status(500).send(err);
    });
});


/**
 * Route: currentUser
 * This route is used to send information about the currentUser to the client-side.
 * Return a json object as :
 * { 'IdGoogle':, 'LastName':, 'FirstName':, 'Email': }
 */
app.get('/currentUser', function (req, res) {
  if (session.userInfo) { 
    res.send(session.userInfo);
  } 
  else { 
    res.status(500).send('User not set');
  }
});


/**
 * 
 */
app.get('/userCalendar', function (req, res) {
  if (req.query.timescale) {
    calendars.getCalendar(session.authClient, req.query.timescale)
      .then(events => {
        res.send(events);
      })
      .catch(err => {
        // console.log(err);
        res.status(500).send(err);
      });
  } 
  else {
    calendars.getCalendar(session.authClient)
      .then(events => {
        res.send(events);
      })
      .catch(err => {
        // console.log(err);
        res.status(500).send(err);
      });
  }
});


/**
 * 
 */
app.get('/name', function (req, res) {
  calendars.getName(req.query.email)
    .then(name => {
      res.send(name);
    })
    .catch(err => {
      // console.log(err);
      res.status(500).send(err);
    });
});

/**
 * 
 */
app.post('/createEvent', function (req, res) {
  calendars.createEvent(session.authClient, req.body)
    .then(() => {
      res.status(200).send();
    })
    .catch(err => {
      // console.log(err);
      res.status(500).send(err);
    });
});

module.exports = app;
