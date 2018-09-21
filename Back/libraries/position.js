"use strict";

// npm dependencies and libraries
require('dotenv').config();
const util = require('./utilitaries');
const pool = require('../db/pool');

module.exports = {
  /**
   * @param {string} userIdCard: the id (number) of the scaned card
   * @param {string} scanPosition: The name of the room where the user scaned his card
   * @param {string} move: in or out. Allow to know if the user check-in or check-out
   * This function calls the functions to: 
   * update the position of the user and update the occupancy of the room given
   * @return {Promise}: Promise to tell the update is finished
   */
  updatePositionAndOccupancy: function (userIdCard, scanPosition, move) {
    return new Promise((resolve, reject) => {
      this.updateUserPosition(userIdCard, scanPosition, move)
        .then(() => {
          this.updateRoomOccupancy(scanPosition, move)
            .then(() => {
              resolve();
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

  /**
   * @param {string} userIdCard: the id (number) of the scaned card
   * @param {string} scanPosition: The name of the room where the user scaned his card
   * @param {string} move: in or out. Allow to know if the user check-in or check-out
   * This function updates the position of the user in the database (null if the user is not in a room)
   * @return {Promise}: Promise to tell the update is finished
   */
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
          resolve();
        }
        else {
          reject(err);
        }
      });
    });
  },

  /**
   * @param {string} roomName: The name of the room where the user scaned his card
   * @param {string} move: in or out. Allow to know if the user check-in or check-out
   * This function updates the occupancy of the given room in database
   * @return {Promise}: Promise to tell the update is finished
   */
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
          resolve();
        }
        else {
          reject(err);
        }
      });
    });
  },

  /**
   * @param {string} userIdCard: the id (number) of the scaned card
   * @param {string} scanPosition: The name of the room where the user scaned his card
   * This function determines if the user checks-in or checks-out the given room.
   * If the user checks-in without checks-out of the previous room, the function will
   * update the occupancy of the previous room as well.
   * @return {Promise}: Promise with the move (string): in if the user checks-in the given room, out if he checks-out
   */
  getMove: function (userIdCard, scanPosition) {
    return new Promise((resolve, reject) => {
      util.getUserPosition(userIdCard)
        .then(exUserPos => {
          if (exUserPos !== undefined) {
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
          }
          else {
            resolve(null);
          }
        })
        .catch(err => {
          reject(err);
        });
    });
  }

};
