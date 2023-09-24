// models/message.js
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: String,
    ref: 'User',
    required: true,
  },
  reciever: {
    type: String,
    ref: 'User',
    required: true,
  },
  text: {
    type: Object,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Message', messageSchema);
