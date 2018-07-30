"use strict";

// npm dependencies
require('dotenv').config();
const express = require("express");
const app = express();
const api = require("./api/api");
const server = require("http").Server(app);


// Setup for api
app.use(express.static("public"));
app.use("/static", express.static("public"));
app.use("/api", api);

app.get("/", function (req, res) {
  res.send("Welcome on the root of the server");
});


server.listen(process.env.SERVER_PORT);
