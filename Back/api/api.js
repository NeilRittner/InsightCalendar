"use strict";

// npm dependencies
require('dotenv').config()
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
var ev = require('../libraries/eventEmitter');


// Own libraries
const connection = require('../libraries/connection');
const authorization = require('../libraries/authorization');
const calendars = require('../libraries/calendars');
const util = require('../libraries/utilitaries');
const position = require('../libraries/position');


// Some variables
const options = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWD,
  database: process.env.CALENDAR
};
const sessionStore = new MySQLStore(options);
const authClient = authorization.setOAuth2Client();


// Set the npm dependencies
app.use(cors({ origin: process.env.ORIGIN, credentials: true }));
app.use(session({
  secret: process.env.SECRET,
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
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
          req.session.userInfo = userInfo;
          authorization.hasTokens(req.session.userInfo['IdGoogle'])
            .then(tokens => {
              if (tokens) {
                req.session.tokens = tokens;
                res.status(200).send();
              }
              else {
                const authClient = authorization.setOAuth2Client();
                let url = authorization.getAuthUrl(authClient);
                url = url + '&login_hint=' + req.session.userInfo['IdGoogle'];
                res.status(200).send(JSON.stringify(url));
              }
            })
            .catch(err => {
              res.status(500).send(err);
            });
        })
        .catch(err => {
          res.status(500).send(err);
        });
    })
    .catch(err =>  {
      res.status(498).send(err);
    });
});

/**
 * Route: cardAccess
 * This route is used to verify the id of the card sent by the client-side and set the session user.
 * Return a status code and a message if necessary:
 * 200: OK or no card associated
 * 500: Internal Error
 */
app.post('/cardAccess', function (req, res) {
  connection.verifyCard(req.body.idCard)
    .then(userInfo => {
      if (userInfo) {
        req.session.userInfo = userInfo;
        authorization.hasTokens(req.session.userInfo['IdGoogle'])
          .then(tokens => {
            req.session.tokens = tokens;
            res.status(200).send();
          })
          .catch(err => {
            res.status(500).send(err);
          });
      } 
      else {
        res.status(404).send();
      }
    })
    .catch(err => {
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
          req.session.userInfo = userInfo;
          authorization.hasTokens(req.session.userInfo['IdGoogle'])
            .then(tokens => {
              if (tokens) {
                req.session.tokens = tokens;
                res.status(200).send();
              } 
              else {
                let url = authorization.getAuthUrl(authClient);
                url = url + '&login_hint=' + req.session.userInfo['IdGoogle'];
                res.status(200).send(JSON.stringify(url));
              }
            })
            .catch(err => {
              res.status(500).send(err);
            });
        })
        .catch(err => {
          res.status(500).send(err);
        });
    })
    .catch(err => {
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
      req.session.tokens = tokens;
      authorization.storeTokens(req.session.userInfo['IdGoogle'], tokens['access_token'], tokens['refresh_token'])
        .then(() => {
          res.status(200).send();
        })
        .catch(err => {
          res.status(500).send(err);
        });
    })
    .catch(err => {
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
  if (req.session.userInfo) { 
    res.send(req.session.userInfo);
  } 
  else { 
    res.status(500).send('There is no user set');
  }
});

/**
 * 
 */
app.get('/userCalendar', function (req, res) {
  authClient.setCredentials(req.session.tokens);
  calendars.getCalendar(authClient, req.query.calendarId, req.query.timescale)
    .then(events => {
      res.send(events);
    })
    .catch(err => {
      res.status(500).send(err);
    });
});

/**
 * 
 */
app.post('/createEvent', function (req, res) {
  authClient.setCredentials(req.session.tokens);
  calendars.createEvent(authClient, req.body)
    .then(data => {
      if (data) {
        ev.emit('eventInserted', data);
        res.status(200).send();
      }
      else {
        res.status(200).send('Room not available');
      }
    })
    .catch(err => {
      res.status(500).send(err);
    });
});

/**
 * 
 */
app.get('/allRooms', function (req, res) {
  util.getAllRoom()
    .then(rooms => {
      res.send(rooms);
    })
    .catch(err => {
      res.status(500).send(err);
    });
});

/**
 * 
 */
app.get('/allUsers', function (req, res) {
  util.getAllUsers()
    .then(users => {
      res.send(users);
    })
    .catch(err => {
      res.status(500).send(err);
    });
});

/**
 * 
 */
app.post('/updatePosition', function (req, res) {
  position.getMove(req.body.userIdCard, req.body.roomName)
    .then(move => {
      if (move !== null) {
        position.updatePositionAndOccupancy(req.body.userIdCard, req.body.roomName, move)
          .then(() => {
            ev.emit('updateOccupancy', { roomName: req.body.roomName, move: move });
            res.status(200).send(move);
          })
          .catch(err => {
            res.status(500).send(err);
          });
      }
      else {
        res.status(404).send();
      }
    })
    .catch(err => {
      res.status(500).send(err);
    });
});

/** 
 * 
 */
app.post('/cancelEvent', function (req, res) {
  util.getTokensFromEmail(req.body.organizerEmail)
    .then(tokens => {
      if (tokens) {
        authClient.setCredentials(tokens);
        calendars.cancelEvent(authClient, req.body.organizerEmail, req.body.eventId)
          .then(eventRemoved => {
            ev.emit('eventRemoved', eventRemoved)
            res.status(200).send(eventRemoved);
          })
          .catch(err => {
            res.status(500).send(err);
          });
      }
      else {
        res.status(403).send("Organiser's tokens not found, the event cannot be deleted");
      }
    })
    .catch(err => {
      res.status(500).send(err);
    });
});

/**
 * 
 */
app.post('/updateEndEvent', function (req, res) {
  util.getTokensFromEmail(req.body.organizerEmail)
    .then(tokens => {
      if (tokens) {
        authClient.setCredentials(tokens);
        calendars.updateEndEvent(authClient, req.body.calendarId, req.body.eventId, req.body.newEnd)
          .then(eventUpdated => {
            res.status(200).send(eventUpdated);
          })
          .catch(err => {
            res.status(500).send(err);
          });
      }
      else {
        res.status(403).send("Organiser's tokens not found, the event cannot be updated");
      }
    })
    .catch(err => {
      res.status(500).send(err);
    });
});

/**
 * 
 */
app.get('/roomInformation', function (req, res) {
  util.getRoomInformation(req.query.roomName)
    .then(dataRoom => {
      res.status(200).send(dataRoom);
    })
    .catch(err => {
      res.status(500).send(err);
    });
});

/**
 * 
 */
app.get('/organizersAttendance', function (req, res) {
  util.organizersAttendance(req.query.organizerEmail, req.query.eventId, req.query.roomName)
    .then(response => {
      res.status(200).send(response);
    })
    .catch(err => {
      res.status(500).send(err);
    });
});

module.exports = app;
