const express = require('express');
const bodyParser = require('body-parser');
const socketIo = require('socket.io');
const cors = require('cors');
const { v4: uuidv4, v5: uuidv5, NIL: nilUUID } = require('uuid');
const { default: mongoose } = require('mongoose');
const userRoutes = require('./routes/user');
const User = require('./models/user');
const Message = require('./models/message');

const router = require('./routes/index');


const app = express();

app.use(cors({
    origin:['http://localhost:3000']
}))
const PORT = process.env.PORT || 3001; // Create an HTTP server

// Connect to MongoDB (replace 'mongodb://localhost/chatapp' with your MongoDB URI)
mongoose.connect('mongodb://localhost/chatapp', { useNewUrlParser: true, useUnifiedTopology: true }).then(res=>{
    console.log("Connection succesfull")
})
.catch(error=>{
    console.log("DB connection error", error)
})
mongoose.connection.on('error', (err) => {
  console.error(`MongoDB connection error: ${err}`);
});

app.use(bodyParser.json());


// Clear db 
async function clearDatabase() {
    try {
      // Connect to MongoDB
      await mongoose.connect('mongodb://localhost/chatapp', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
  
      // Clear the collections
      await mongoose.connection.dropCollection('users');
      await mongoose.connection.dropCollection('messages'); // Replace 'users' with your collection name(s)
      
      // You can add more collection drops if needed
      // await mongoose.connection.db.dropCollection('otherCollection');
      
      console.log('Database cleared successfully.');
    } catch (error) {
      console.error('Error clearing the database:', error);
    } 
  }

clearDatabase()

// Routes



const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

const io = socketIo(server, {
    cors:{
        origin:'*'
    }
});


router(app, io);


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
        latitude:54.55684722195345,
        longitude:-1.1961031281053485
    }
}}; 
const radiusInMiles = 1;





io.on('connection', (socket) => {
    // console.log(`Socket connected: ${socket.id}`);

    
    socket.on('checkUsername', async(username)=>{
        try{
            const user = await User.findOne({username:username});
            if(!user){
                socket.emit('usernamestatus', 404)
                return
            }
            else{
                socket.emit('usernamestatus', 200);
                return
            }

        }
        catch(err){
            socket.emit('usernamestatus', 500)
        }
    })

    socket.on('initialJoin', async (username)=>{
        try {
            const user = await User.findOneAndUpdate({username}, {socket:socket.id}, {new:true});
            
        } catch (error) {
            console.log(error)
        }
    })

    socket.on('socket_create', async(data)=>{
        const {username, target_user} = data;
        
        try {
            const user = await User.findOneAndUpdate({username:username}, {socket:socket.id}, {new:true});
            socket.emit('socket_created', {target_user, username} )
            
            
        } catch (error) {
            socket.emit('socket_created', 500);
            console.error(error, "eror");
        }
    })

    socket.on('load', async({username, mile})=>{
        try {

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
                    socket.emit('loaded', users_);
                }
                else{
                    console.log("no location")
                }
            }
            else{
                console.log("No user found")
            }
        } catch (error) {
            socket.emit('loadfailed');
            console.error(error, "eror");
        }
    })
  
    socket.on('newMessage', async (data) => {
        const randomUUID = uuidv4();
      try {
        const { sender, reciever, text, id, message, socket_id } = data;

        const user = await User.findOne({username: reciever});
        

        var out_ = message;
        out_.map(i=>{
            i.user._id = 2,
            i._id = randomUUID
        })



        const recentMessagesFromReciever = await Message.find({sender:reciever, reciever:sender});

        if(recentMessagesFromReciever.length === 1){
            const user_ = await User.findOne({username: sender});
            io.to(user_.socket).emit('newMessagePending', {...data, message:out_})
            
        }
        else{
            const message_ = await Message.create({reciever, text:out_, sender })
    
            io.to(user.socket).emit('newMessage', {...data, message:out_})
        }

        
      } catch (error) {
        console.log(error, "eror");
      }
    });
  
    socket.on('socdisconnect', async(username) => {
        const user = await User.deleteOne({username:username});
    });
  });