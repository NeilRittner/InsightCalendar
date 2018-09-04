'use strict';

// npm dependencies
require('dotenv').config();
const express = require('express');
const app = express();
const api = require('./api/api');
const server = require('http').Server(app);
const io = require('socket.io').listen(server);
var ev = require('./libraries/eventEmitter');
const calendars = require('./libraries/calendars');



// Setup for api
app.use(express.static('public'));
app.use('/static', express.static('public'));
app.use('/api', api);

app.get('/', function (req, res) {
  res.send('Welcome to the root of the server');
});


server.listen(process.env.SERVER_PORT);
// io.sockets.on('connect', function (socket) {
//   console.log('id : ' + socket.id);
// });

// Sockets part
ev.on('eventInserted', eventInserted => {
  const data = {};
  data['timescale'] = calendars.determineTimeScale(eventInserted);
  data['event'] = eventInserted;
  io.sockets.emit('eventInserted', data);
});

ev.on('eventRemoved', eventRemoved => {
  io.sockets.emit('eventRemoved', eventRemoved);
});
