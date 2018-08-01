"use strict";

// npm dependencies and libraries
require('dotenv').config()
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const session = require('express-session');
const connection = require('../libraries/connection');


// Set the npm dependencies
app.use(cors({ credentials: true, origin: 'http://localhost:4200' }));
app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


// Routing

/* Route: googleAccess
* This route is used to verify the idToken sent by the client-side and set the session user.
* Return a status code:
* 200: OK
* 500: Internal Error
* 498: Token not valid
*/
app.post("/googleAccess", function (req, res) {
  connection.verifyGoogleToken(req.body.idToken).then(payload => {
    connection.getUserInformation(payload).then(user => {
      session.user = user;
      res.send('200');
    })
    .catch(err => {
      res.send('500');
    })
  })
  .catch(err =>  {
    res.send('498');
  });
});

/* Route: cardAccess
* This route is used to verify the id of the card sent by the client-side and set the session user.
* Return a status code:
* 200: OK
* 404: User not find
* 500: Internal Error
*/
app.post("/cardAccess", function (req, res) {
  connection.verifyCard(req.body.idCard).then(user => {
    if (user) {
      console.log(user);
      session.user = user;
      res.send('200');
    }
    else {
      res.send('404');
    }
  })
  .catch(err => {
    res.send('500');
  });
});

/* Route: registerCard
* This route is used to link an idCard to a user (for the IoT Access enabled).
* Return a status code:
* 200: OK
* 500: Internal Error
* 498: Token not valid
*/
app.post("/registerCard", function (req, res) {
  connection.verifyGoogleToken(req.body.idToken).then(payload => {
    connection.registerCard(payload, req.body.idCard).then(user => {
      console.log('User api:   ' + user);
      session.user = user;
      res.send('200');
    })
    .catch(err => {
      res.send('500');
    });
  })
  .catch(err => {
    res.send('498');
  });
})

/* Route: currentUser
* This route is used to send information about the currentUser to the client-side.
* Return a json object as :
* { 'IdGoogle':, 'LastName':, 'FirstName':, 'Email': }
*/
app.get("/currentUser", function (req, res) {
  res.send(session.user);
})

module.exports = app;
