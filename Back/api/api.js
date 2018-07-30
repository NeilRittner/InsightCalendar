"use strict";

// npm dependencies and libraries
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");
const session = require('express-session');
const utilities = require("../libraries/connection");


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
  utilities.verify(req.body.idtoken).then(payload => {
    session.user = payload;
    res.send();
  })
    .catch(console.error);
});

// Card: used to connect a user with his card
app.post("/card", function (req, res) {
  //Vérifier que ça existe en bdd + aller chercher l'utilisateur
  session.user = {
    given_name: "neil",
    family_name: "rittner"
  }
  res.send();
});

// User: send the session's user (the connected user)
app.get("/user", function (req, res) {
  res.send(session.user);
})

module.exports = app;
