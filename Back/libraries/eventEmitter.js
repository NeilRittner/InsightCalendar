// File to send event from api.js to server.js to use the sockets.
var events = require("events");
var eventEmitter = new events.EventEmitter();
module.exports = eventEmitter;
