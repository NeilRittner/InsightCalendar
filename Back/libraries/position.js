"use strict";

// npm dependencies and libraries
require('dotenv').config();
const util = require('./utilitaries');
const pool = require('../db/pool');

module.exports = {
  updatePositionAndOccupancy: function (userIdCard, scanPosition, move) {
    return new Promise((resolve, reject) => {
      this.updateUserPosition(userIdCard, scanPosition, move)
        .then(() => {
          this.updateRoomOccupancy(scanPosition, move)
            .then(() => {
              resolve('Positon and Occupancy updated');
            })
            .catch(err => {
              reject(err);
            });
        })
        .catch(err => {
          reject(err);
        });
    });
  },

  updateUserPosition: function (userIdCard, scanPosition, move) {
    return new Promise((resolve, reject) => {
      let query = ``;
      if (move === 'in') {
        query = `UPDATE users SET Position = '${scanPosition}' WHERE IdCard = ${userIdCard}`;
      }
      else {
        query = `UPDATE users SET Position = NULL WHERE IdCard = ${userIdCard}`;
      }

      pool.calendar_pool.query(query, function (err) {
        if (!err) {
          resolve('Row updated');
        }
        else {
          reject(err);
        }
      });
    });
  },

  updateRoomOccupancy: function (roomName, move) {
    let query = ``;
    if (move === 'in') {
      query = `UPDATE rooms SET Occupancy = Occupancy + 1 WHERE Name = '${roomName}'`;
    }
    else {
      query = `UPDATE rooms SET Occupancy = Occupancy - 1 WHERE Name = '${roomName}'`;
    }

    return new Promise((resolve, reject) => {
      pool.calendar_pool.query(query, function (err) {
        if (!err) {
          resolve('Row updated');
        }
        else {
          reject(err);
        }
      });
    });
  },

  getRoomOccupancy: function (roomName) {
    const query = `SELECT Occupancy FROM rooms WHERE Name = '${roomName}'`;

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

  getMove: function (userIdCard, scanPosition) {
    return new Promise((resolve, reject) => {
      util.getUserPosition(userIdCard)
        .then(exUserPos => {
            if (exUserPos === scanPosition) {
              resolve('out');
            }
            else if (exUserPos !== scanPosition && !exUserPos) {
              resolve('in');
            }
            else {
              this.updateRoomOccupancy(exUserPos, 'out')
                .then(() => {
                  resolve('in');
                })
                .catch(err => {
                  reject(err);
                });
            }
        })
        .catch(err => {
          reject(err);
        });
    });
  }

};