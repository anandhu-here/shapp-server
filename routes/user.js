// routes/user.js
const express = require('express');
const router = express.Router();
const User = require('../models/user');


function calculateDistance(lat1, lon1, lat2, lon2) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2-lat1);  // deg2rad below
  var dLon = deg2rad(lon2-lon1); 
  var a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  var d = R * c; // Distance in km
  return d;
}


// Create a new user
router.post('/', async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/getUsers/:username/:mile', async(req, res)=>{
  try{
    const username = req.params.username;
    const mile = req.params.mile;
    const users = await User.find({username: {$ne:username}});
    const curUser = await User.findOne({username:username});
    let users_ = [];

    users.map(user=>{
      const distance = calculateDistance( curUser.location.latitude, curUser.location.longitude, user.location.latitude, user.location.longitude )
      if(distance <= mile && user.username!==username ){
          users_.unshift({username: user.username, distance:distance});
      }
    })
    
    res.status(200).json({users:users_})
  }
  catch(error){
    console.log(error)
    res.status(400).json({ error: error.message });
  }
})
router.post('/checkusername/:username', async (req, res) => {
    try {
        
        const username = req.params.username;

      const user = new User({username:username});

      res.status(201).json(user);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

router.post('/join', async(req, res)=>{
    try {
        const {username} = req.body
        const user = await User.findOne({username});
        if(!user){
            const newUser = await User({username})
        }
        
    } catch (error) {
        
    }
})

// Delete a user
router.delete('/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    await User.findByIdAndDelete(userId);
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router
