const mongoose = require('mongoose');

const user = new mongoose.Schema({

  userID: {
    type: Number,
    required: true,
    minlength: 18,
    maxlength: 18,
  },

  servers: {
    /*
      {
        serverID: {
          battleCount: 1,
          points: 1,
        }
      }
      }
    */

    type: Object,
    required: false,
    default: {},
  },
});

module.exports = mongoose.model('users', user);
