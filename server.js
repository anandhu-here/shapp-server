const express = require('express');
const bodyParser = require('body-parser');
const socketIo = require('socket.io');
const cors = require('cors');


const app = express();

app.use(cors({
    origin:['http://localhost:3000']
}))
const PORT = process.env.PORT || 3001; // Create an HTTP server

// Connect to MongoDB (replace 'mongodb://localhost/chatapp' with your MongoDB URI)
// mongoose.connect('mongodb://localhost/chatapp', { useNewUrlParser: true, useUnifiedTopology: true });
// mongoose.connection.on('error', (err) => {
//   console.error(`MongoDB connection error: ${err}`);
// });

app.use(bodyParser.json());

// Routes

const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

const io = socketIo(server, {
    cors:{
        origin:'*'
    }
});



function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in kilometers
  
    // Convert to miles (1 kilometer = 0.621371 miles)
    return distance * 0.621371;
}




const userSockets = {}; 
const radiusInMiles = 1;

const usernamesWithinRadius = Object.keys(userSockets).filter((username) => {
    const userLocation = users[username].location;
    const distance = calculateDistance(
      referenceLocation.latitude,
      referenceLocation.longitude,
      userLocation.latitude,
      userLocation.longitude
    );
  
    return distance <= radiusInMiles;
  });

io.on('connection', (socket) => {
    // console.log(`Socket connected: ${socket.id}`);

    socket.on('checkUsername', async(username)=>{
        try{
            let userFound = false;
            Object.keys(userSockets).map(key=>{
                if(key===username){
                    userFound = true
                }
            })
            if(userFound){
                socket.emit('usernamestatus', 200)
            }
            else{
                socket.emit('usernamestatus', 404)
            }

        }
        catch(err){
            socket.emit('usernamestatus', 500)
        }
    })

    socket.on('joined', async({username, location})=>{
        try {
            if (userSockets[username]) {
                console.log(username, "already")
                // Username already exists, send an error response
                socket.emit('joined', username);
                return;
            }
            else{
                console.log(username, "exists")
                socket.emit('joined', username);
                // Store the socket association by username
                userSockets[username] = {
                    socket:socket,
                    location:location
                }
            }
        
            
        } catch (error) {
            socket.emit('joined', 500);
            console.error(error, "eror");
        }
    })

    socket.on('load', async(username)=>{
        try {
            ref_loc = Object.keys(userSockets).map(item=>{
                console.log(item, username, "username")
                if(item === username){
                    return userSockets[item].location;
                }
                else return null;
            })
            console.log(ref_loc, "ref")
            if(!ref_loc){
                const users_ = Object.keys(userSockets).filter((username) => {
                    const userLocation = userSockets[username].location;
                    const distance = calculateDistance(
                        ref_loc.latitude,
                        ref_loc.longitude,
                        userLocation.latitude,
                        userLocation.longitude
                    );
                    return distance <= radiusInMiles;
                })
                socket.emit('loaded', users_);

            }
        } catch (error) {
            socket.emit('loadfailed');
            console.error(error, "eror");
        }
    })
  
    socket.on('newMessage', async (data) => {
      try {
        const { sender, reciever, text, id } = data;
        const receiverSocket = userSockets[reciever].socket;
      if (receiverSocket) {
        receiverSocket.emit('newMessage',text);
      } else {
        socket.emit({status:404});
        // Handle the case where the receiver's socket is not found (offline, not connected, etc.)
        // You may want to implement error handling or store messages for offline users.
      } // Broadcast the message to all connected clients
      } catch (error) {
        console.error(error, "eror");
      }
    });
  
    socket.on('socdisconnect', () => {
        const username = Object.keys(userSockets).find(
            (key) => userSockets[key].socket === socket
          );
          if (username) {
            delete userSockets[username];
          }
    });
  });