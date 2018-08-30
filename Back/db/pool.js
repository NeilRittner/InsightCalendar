"use strict";

// npm dependencies
require('dotenv').config();
const mysql = require('mysql');


module.exports = {
  calendar_pool: mysql.createPool({
    connectionLimit: process.env.DB_CONNECTION_LIMIT,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWD,
    database: process.env.CALENDAR
  }),
}
