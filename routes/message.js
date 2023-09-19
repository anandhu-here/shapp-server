// // routes/message.js
// const express = require('express');
// const router = express.Router();
// const Message = require('../models/message');

// // Send a message
// router.post('/', async (req, res) => {
//   try {
//     const { sender, receiver, text } = req.body;
//     const message = new Message({ sender, receiver, text });
//     await message.save();
//     res.status(201).json(message);
//   } catch (error) {
//     res.status(400).json({ error: error.message });
//   }
// });

// module.exports = router;
