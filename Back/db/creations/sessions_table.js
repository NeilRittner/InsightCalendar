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

  const query = `CREATE TABLE IF NOT EXISTS sessions (
    session_id varchar(128) COLLATE utf8mb4_bin NOT NULL,
    expires int(11) unsigned NOT NULL,
    data text COLLATE utf8mb4_bin,
    PRIMARY KEY (session_id)
  ) ENGINE=InnoDB`;

  con.query(query, function (err, results, fields) {
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
