// routes/user.js
const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Message = require('../models/message');



function deg2rad(deg) {
  return deg * (Math.PI/180)
}

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

module.exports = (router, io) =>{

    // Create a new user
    router.post('/join', async (req, res) => {
      try {
        const username = req.body.username;
        const location = req.body.location;
        const userExist = await User.findOne({username:username});
        if(userExist){
          // io.emit('joined', {username:userExist.username, location:userExist.location});
          res.status(200).json(userExist);
          
        }
        else{
          const newUser = await User.create({username:username, location:location});
          // io.emit('joined', {username:newUser.username, location:newUser.location});
          res.status(201).json(newUser);
        }
        
      } catch (error) {
        console.log(error, "error")
        res.status(400).json({ error: error.message });
      }
    });

    router.get('/getUsers', async(req, res)=>{
      try{
        const users = await User.find({});
        
        
        res.status(200).json({users:users})
      }
      catch(error){
        console.log(error)
        res.status(400).json({ error: error.message });
      }
    })

    router.get('/getMessages/:sender/:reciever', async(req, res)=>{
      try{

        const sender = req.params.sender;
        const reciever = req.params.reciever;
        const messages = await Message.find({sender:sender, reciever:reciever});
        
        res.status(200).json({message:messages})
      }
      catch(error){
        console.log(error)
        res.status(400).json({ error: error.message });
      }
    })
    router.get('/checkusername/:username', async (req, res) => {
        try {
            
          const username = req.params.username;

          const user = await User.findOne({username:username});
          if(!user){
            res.status(404).json({error:"No user"});
          }
          else{
              res.status(200).send(user)
          }
        } catch (error) {
          res.status(400).json({ error: error.message });
        }
      });
    router.get('/load/:username/:mile', async(req, res)=>{
      try{
        const username = req.params.username;
        const mile = req.params.mile;
        const user = await User.findOne({username:username});
        if(user){
            ref_loc = user.location;
            if(ref_loc){
                let users_=[];
                const users = await User.find({});
                users.map(user=>{
                    const location = user.location;
                    const distance = calculateDistance(
                        ref_loc.latitude,
                        ref_loc.longitude,
                        location.latitude,
                        location.longitude
                    );
                    if(distance <= mile && user.username!==username ){
                        users_.unshift({username: user.username, distance:distance});
                    }
                })
                res.status(200).send(users_)
            }
            else{
              res.status(400).json({error:"Location Error"})
            }
        }
        else{
          res.status(403).json({error:"Unauthorized"})
        }
      }
      catch(error){
        res.status(400).send(error)
      }
    })
    

    // Delete a user
    router.delete('/delete/:username', async (req, res) => {
      try {
        const username = req.params.username;
        await User.findOneAndDelete({username});
        res.json({ message: 'User deleted' });
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });
}
