const mongoose = require('mongoose');

const battle = new mongoose.Schema({

  date: {
    type: Number,
    required: true,
    // default: +new Date(),
    default: Date.now(),
  },

  serverID: {
    type: String,
    required: true,
    // minlength: 18,
    // maxlength: 18,
  },

  // the message users react to
  reactMessage: {
    type: Object,
    required: true,
    channelID: { type: String },
    messageID: { type: String },
  },

  playerIDs: {
    type: Array,
    required: true,
    default: [],
  },

  submissions: {
    type: Object,
    required: true,
    default: {},
  },

  submissionsScores: {
    type: Object,
    required: true,
    default: {},
  },

  // in minutes
  length: {
    type: Number,
    required: true,
    default: 20,
  },

  // start timeout time
  timeout: {
    type: Number,
    required: true,
    default: 20,
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
      'RESULTS', // results stage
      'FINISHED', // battle completed
      'STOPPING', // battle is closing
    ],
  },
});

module.exports = mongoose.model('battles', battle);
