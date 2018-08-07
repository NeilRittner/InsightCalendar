'use strict';

// npm dependencies
require('dotenv').config();
const express = require('express');
const app = express();
const api = require('./api/api');
const server = require('http').Server(app);
// const io = require('socket.io').listen(server);
// const events = require('events');
// const eventEmitter = new events.EventEmitter();


// Setup for api
app.use(express.static('public'));
app.use('/static', express.static('public'));
app.use('/api', api);

app.get('/', function (req, res) {
  res.send('Welcome to the root of the server');
});


server.listen(process.env.SERVER_PORT);

// Sockets part
// eventEmitter.on('tokensOk', data => {
//   console.log('des sockets sont envoyés');
//   socket.emit('tokensOk', '200');
// });
