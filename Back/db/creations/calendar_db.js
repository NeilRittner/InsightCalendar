"use strict"

// npm dependencies and setup for connection
require('dotenv').config();
const mysql = require('mysql');
const con = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWD
});


// Connection and create database
con.connect(function (err) {
  if (err) throw err;

  const query = `CREATE DATABASE calendar`;

  con.query(query, function (err, result) {
    if (err) throw err;
    console.log("Database 'calendar' created");
  });

  con.end(function (err) {
    if (err) {
      return console.log(err.message);
    }
  });
});
