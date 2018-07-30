"use strict";

// npm dependencies
require('dotenv').config();
const { OAuth2Client } = require('google-auth-library');


// The functions
module.exports = {
  verify: async function (token) {
    const client = new OAuth2Client(process.env.CLIENT_ID);

    // Verify the token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.CLIENT_ID,
    });

    // Get information about the user
    const payload = ticket.getPayload();

    return payload;
  }
}