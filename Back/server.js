'use strict';

// npm dependencies
require('dotenv').config();
const express = require('express');
const app = express();
const api = require('./api/api');
const server = require('http').Server(app);
const io = require('socket.io').listen(server);
var ev = require('./libraries/eventEmitter');


// Setup for api
app.use(express.static('public'));
app.use('/static', express.static('public'));
app.use('/api', api);

app.get('/', function (req, res) {
  res.send('Welcome to the root of the server');
});

server.listen(process.env.SERVER_PORT);

// Emit to each connected user the inserted event to update the calendar
ev.on('eventInserted', eventInserted => {
  io.sockets.emit('eventInserted', eventInserted);
});

// Emit to each connected user the removed event to update the calendar
ev.on('eventRemoved', eventRemoved => {
  io.sockets.emit('eventRemoved', eventRemoved);
});

// Emit to each connected user the new occupancy of the room specified in the data
ev.on('updateOccupancy', data => {
  io.sockets.emit('updateOccupancy', data);
});
