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




const userSockets = {indhu:{
    socket:{},
    location:{
        latitude:53.5703896,
        longitude:-1.3108438
    }
}}; 
const radiusInMiles = 1;


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

    socket.on('joined', async(data)=>{
        const {username, location} = data;
        console.log(username, location, "[][]")
        try {
            if (userSockets[username]) {
                // Username already exists, send an error response
                socket.emit('joined', username);
                return;
            }
            else{
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

    socket.on('load', async({username, mile})=>{
        try {

            const loadedtest = await socket.emit('loadedtest', "hello");

            u_name = Object.keys(userSockets).filter(key=>key===username)[0]
            ref_loc = userSockets[u_name].location;
            if(ref_loc){
                const users_ = Object.keys(userSockets).filter((username_) => {
                    const userLocation = userSockets[username_].location;
                    const distance = calculateDistance(
                        ref_loc.latitude,
                        ref_loc.longitude,
                        userLocation.latitude,
                        userLocation.longitude
                    );
                    console.log(distance, "distance")
                    return username!==username_ && distance <= mile;
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