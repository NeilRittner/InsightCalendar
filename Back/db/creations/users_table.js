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
  
  const sql = `CREATE TABLE if not exists users(
    IdGoogle varchar(255) primary key,
    LastName varchar(255)not null,
    FirstName varchar(255)not null,
    Email varchar(255)not null,
    IdCard varchar(255),
    AccessToken varchar(255),
    RefreshToken varchar(255),
    Status int not null default 1,
    LastScanPosition varchar(255)
  )`;

  con.query(sql, function (err, results, fields) {
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
