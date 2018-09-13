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

// Sockets part
io.sockets.on('connect', (socket) => {
  ev.on('eventInserted', eventInserted => {
    socket.emit('eventInserted', eventInserted);
  });

  ev.on('eventRemoved', eventRemoved => {
    socket.emit('eventRemoved', eventRemoved);
  });

  ev.on('updateOccupancy', data => {
    socket.emit('updateOccupancy', data);
  });

  socket.on('disconnection', () => {
  });
});
