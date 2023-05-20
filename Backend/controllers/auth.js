const User = require("../models/user")
var jwt = require('jsonwebtoken');
var expressJwt = require("express-jwt");
const { body, validationResult } = require('express-validator');


exports.signup = (req, res) => {
    const errors = validationResult(req)

    if(!errors.isEmpty()){
        return res.status(422).json({
            error: errors.array()[0].msg
        })
    }

    const user = new User(req.body)
    user.save((err, user) => {
        if (err) {
            return res.status(400).json({
                err : "Not able to save user in the database"
            })
        }
        res.json({
            name : user.name,
            email: user.email,
            id: user._id
        })
    })
}

exports.signin = (req, res) => {
    const errors = validationResult(req)
    const {email, password} = req.body

    if(!errors.isEmpty()){
        return res.status(422).json({
            error: errors.array()[0].msg
        })
    }

    User.findOne({email}, (err, user) => {
        if (err || !user)
        return res.status(400).json({
            error : "USER EMAIL DOESN'T EXIST"
        })
        
        if(!user.autheticate(password)){
            return res.status(401).json({
                error : "PASSWORD AND EMAIL DOESN'T MATCH"
            })
        }
        // create token
        const token = jwt.sign({_id : user._id},process.env.SECRET)

        //put token in cookie
        res.cookie("token", token, {expire : new Date()+ 9999})

        //send to front end
        const {_id, name, email, role} = user
        return res.json({token, user:{_id, name, email, role}})

    })

}

exports.signout = (req, res) => {
    res.json({
        message: "User sign out"
    })
}

//protected routes
exports.isSignedIn = expressJwt({
    secret: process.env.SECRET,
    userProperty: "auth"
  });

// CUSTOM MIDDLEWARE

exports.isAuthenticated = (req, res, next) => {
    let checker = req.profile && req.auth && req.profile._id == req.auth._id;
    if (!checker) {
      return res.status(403).json({
        error: "ACCESS DENIED"
      });
    }
    next();
  };

exports.isAdmin = (req, res, next) => {
    if(req.profile.role === 0){
        return res.status(403).json({
            error : "You are NOT ADMIN"
        })
    }
    next()
}