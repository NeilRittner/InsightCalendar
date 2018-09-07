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
  
  const query = `CREATE TABLE if not exists reservations(
    IdEventGoogleCalendar varchar(255) primary key,
    Organizer1 varchar(255) not null,
    Organizer2 varchar(255) null,
    Room varchar(255) null,
    Attendees text null,
    StartDate datetime not null,
    EndDate datetime not null
  )`;

  con.query(query, function (err, results, fields) {
    if (err) console.log(err.message);
  });

  con.end(function (err) {
    if (err) return err.message;
  });
});
