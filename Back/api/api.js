"use strict";

// npm dependencies and libraries
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");
const session = require('express-session');
const connection = require("../libraries/connection");


// Set the npm dependencies
app.use(cors({ credentials: true, origin: 'http://localhost:4200' }));
app.use(session({
  secret: "Shh, its a secret!",
  resave: false,
  saveUninitialized: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


// Routing
// Helloworld
app.get("/helloworld", function (req, res, next) {
  res.send("Hello World");
});

// TokenGoogle: used to verify a token
app.post("/tokenGoogle", function (req, res) {
  connection.verifyGoogleToken(req.body.idToken).then(payload => {
    connection.getUserInformation(payload).then(user => {
      session.user = user;
      res.send('200');
    });
  })
    .catch(console.error);
});

// Card: used to connect a user with his card
app.post("/card", function (req, res) {
  // Vérifier que ça existe en bdd + aller chercher l'utilisateur
  connection.verifyCard(req.body.idCard).then(user => {
    if (user) {
      session.user = user;
      res.send('200');
    }
    else {
      res.send('404');
    }
  });
});

app.post("/associate", function (req, res) {
  console.log(req.body.idToken);
  console.log(req.body.idCard);
})

// User: send the session's user (the connected user)
app.get("/user", function (req, res) {
  res.send(session.user);
})

module.exports = app;
