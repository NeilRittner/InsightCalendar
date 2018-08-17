"use strict";

// npm dependencies and libraries
require('dotenv').config();
const pool = require('../db/pool');


// The functions
module.exports = {
  getNameFromEmail: function (email) {
    const query = `SELECT FirstName, LastName FROM users WHERE Email = '${email}'`;

    return new Promise((resolve, reject) => {
      pool.calendar_pool.query(query, function (err, row) {
        if (!err) {
          resolve(row[0]);
        }
        else {
          reject(err);
        }
      });
    });
  },

  getAllRoom: function () {
    const query = `SELECT * FROM rooms`;

    return new Promise((resolve, reject) => {
      pool.calendar_pool.query(query, function (err, rows) {
        if (!err) {
          resolve(rows);
        }
        else {
          reject(err);
        }
      });
    });
  },

  getAllUsers: function () {
    const query = `SELECT FirstName, LastName, Email FROM users`;

    return new Promise((resolve, reject) => {
      pool.calendar_pool.query(query, function (err, rows) {
        if (!err) {
          resolve(rows);
        }
        else {
          reject(err);
        }
      });
    });
  }
};