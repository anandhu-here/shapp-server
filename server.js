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






const userSockets = {}; 

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

    socket.on('joined', async(username)=>{
        try {
            if (userSockets[username]) {
                // Username already exists, send an error response
                socket.emit('status', 409);
                return;
            }
            else{
                socket.emit('status', 200);
                // Store the socket association by username
                userSockets[username].socket = socket;
            }
        
            
        } catch (error) {
            socket.emit('status', 500);
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
  
    socket.on('disconnect', () => {
        const username = Object.keys(userSockets).find(
            (key) => userSockets[key] === socket
          );
          if (username) {
            delete userSockets[username];
          }
    });
  });