// // routes/user.js
// const express = require('express');
// const router = express.Router();
// const User = require('../models/user');

// // Create a new user
// router.post('/', async (req, res) => {
//   try {
//     const user = new User(req.body);
//     await user.save();
//     res.status(201).json(user);
//   } catch (error) {
//     res.status(400).json({ error: error.message });
//   }
// });

// // Delete a user
// router.delete('/:userId', async (req, res) => {
//   try {
//     const userId = req.params.userId;
//     await User.findByIdAndDelete(userId);
//     res.json({ message: 'User deleted' });
//   } catch (error) {
//     res.status(400).json({ error: error.message });
//   }
// });

// module.exports = router
