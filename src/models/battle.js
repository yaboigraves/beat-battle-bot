const mongoose = require('mongoose');

const battle = new mongoose.Schema({
  date: {
    type: Number,
    required: true,
    default: +new Date(),
  },

  serverID: {
    type: Number,
    required: true,
    minlength: 18,
    maxlength: 18,
  },

  playerIDs: {
    type: Array,
    required: true,
    default: [],
  },

  submissions: {
    type: Array,
    required: true,
    default: [],
  },

  // in minutes
  length: {
    type: Number,
    required: true,
    default: 30,
  },

  sample: {
    type: String,
    required: true,
  },

  // we use this to manage state so we can add/remove users from roles
  active: {
    type: Boolean,
    required: true,
    default: true,
  },

  status: {
    type: String,
    required: true,
    default: 'PREPARING',
    enum: [
      'PREPARING', // waiting for users to join the battle
      'BATTLING', // battle in progress
      'VOTING', // voting in progress
      'FINISHED', // battle completed
    ],
  },
});

module.exports = mongoose.model('battles', battle);
