// models/user.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true,
    required: true,
  },
  socket:{
    type: String,
    required:true
  },
  location:{
    type:Object,
    required:true
  }
});

module.exports = mongoose.model('User', userSchema);
