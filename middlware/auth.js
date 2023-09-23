const User = require('../models/user');

const isAuth = async(req, res, next) =>{
    const username = req.params.user;
    const user = await User.findOne({username})
    if(username && user){
        next()
    }
    else{
        res.status(403).send({error:"Unauthorized"})
    }
}