"use strict"

// npm dependencies and setup for connection
require('dotenv').config();
const mysql = require('mysql');
const con = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWD,
  database: process.env.CALENDAR
});


// Connection and create table
con.connect(function (err) {
  if (err) throw err;

  const query = `INSERT INTO rooms (Name, Occupancy, Email) Values ?`;
  const rooms = [
    ['NUIG Main Conference Room', '0', 'insight-centre.org_2d39373934373831323432@resource.calendar.google.com'],
    ['NUIG Meeting Room A', '0', 'insight-centre.org_313937393337323334@resource.calendar.google.com'],
    ['NUIG Meeting Room B', '0', 'insight-centre.org_2d3837383937383331363735@resource.calendar.google.com'],
    ['NUIG Meeting Room C', '0', 'insight-centre.org_2d3837363733353432343233@resource.calendar.google.com'],
  ]

  con.query(query, [rooms], function (err, results, fields) {
    if (err) {
      console.log(err.message);
    }
  });

  con.end(function (err) {
    if (err) {
      return console.log(err.message);
    }
  });
});