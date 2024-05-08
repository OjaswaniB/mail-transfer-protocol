const express = require('express');
const router = express.Router();
const app=express();
const bodyparser=require("body-parser");
const User =require("./models/signup")
app.use(bodyparser.json())
const {key}= require("./config")

app.get("/signup",(req,res)=>{
    res.send("working")
})

const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const { v4: uuidv4 } = require("uuid");
require("dotenv").config();


const { error } = require('console');

const mongoose = require('mongoose')

main().catch(err => {console.log(err), console.log("MONGO ERROR")});

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/mailReworkDB');
 console.log("MONGO CONNECTTION ESTABLISHED")}

let transporter = nodemailer.createTransport({
    service: 'gmail',
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user:"oojaswani_be21@thapar.edu",
        pass: key
    }
});

transporter.verify((error, success) => {
    if (error) {
        console.log(error);
    } else {
        console.log("Ready for message");
        console.log(success)
    }
})

app.post('/signup', (req, res) => {
    let { name, email, password, dateOfBirth } = req.body;
    if (typeof name !== 'undefined') {
        name = name.trim();
    }
    if (typeof email !== 'undefined') {
        email = email.trim();
    }
    if (typeof password !== 'undefined') {
        password = password.trim();
    }
    if (typeof dateOfBirth !== 'undefined') {
        dateOfBirth = dateOfBirth.trim();
    }
    

    if (name == "" || email == "" || password == "" || dateOfBirth == "") {
        res.json({
            status: "Failed",
            message: "Empty Input Fields"
        });
    } else if (!/^[a-zA-Z\s]*$/.test(name)) {
        res.json({
            status: "Failed",
            message: "Name cannot contain symbols"
        });
    } else if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
        res.json({
            status: "Failed",
            message: "Invalid email id"
        })
    }else if (password.length < 8) {
        res.json({
            status: "Failed",
            message: "Password too short"
        })
    } else {
        User.find({ email }).then(result => {
            if (result.length) {
                res.json({
                    status: "Failed",
                    message: "User with that Email Already Exists"
                })
            } else {
                const newUser = new User({
                    name,
                    email,
                    password,
                    dateOfBirth
                });
                newUser
                        .save()
                        .then(result => {
                            // Welcome email here
                            sendWelcomeEmail(result, res);
                           
                            res.json({
                                status: "Succesful",
                                message: "User Registered"
                            })
                        })
                        .catch(err => {
                            res.json({
                                status: "Failed",
                                message: "Error occurred while Saving User Account"
                            })
                        })
        }}
        )}
})

const sendWelcomeEmail=async ({email,name},res)=>{
    
   
    const info = await transporter.sendMail({
        from: {
            name: "Welcome",
            address: key
        }, // sender address
        to: email, // list of receivers
        subject: "Welcome to Gyrate", // Subject line
        html: `Hello ${name}, Welcome to rework.`, // html body
      });
    
}

app.post("/forgot-password",(req,res)=>{
    let {email}=req.body;
    User
     .findOne({email})
     .then(user =>{
        if(user){
            sendResetEmail(user,res);
            res.json({
                status: "Success",
                message:"Reset Email sent"
            })
        }else{
            res.json({
                status: "Fail",
                message:"Invalid Email"
            })
        }
    })

})

const sendResetEmail = async ({ _id, email }, res) => {
    const info = await transporter.sendMail({
        from: {
            name: "Reset password",
            address: key
        },
        to: email,
        subject: "Reset Your Password",
        html: `<p>Press <a href="http://localhost:3000/reset-password/${_id}">here</a> to proceed with resetting your password.</p>`
    });
}



app.post("/reset-password/:_id", (req, res) => {
    let { email, newPassword, confirmNewPassword } = req.body;
    
    // Check if newPassword and confirmNewPassword are empty
    if (newPassword === "" || confirmNewPassword === "") {
        res.json({
            status: "Failure",
            message: "Cannot Enter Empty Password"
        });
    }
    // Check if newPassword and confirmNewPassword match
    else if (newPassword !== confirmNewPassword) {
        res.json({
            status: "Failure",
            message: "Passwords Do not Match"
        });
    }
    // Check if newPassword length is less than 8 characters
    else if (newPassword.length < 8) {
        res.json({
            status: "Failure",
            message: "Password must be at least 8 characters long"
        });
    } else {
        // Hash the new password
        bcrypt.hash(newPassword, 10, (err, hashedPassword) => {
            if (err) {
                console.error("Error hashing password:", err);
                res.json({
                    status: "Failure",
                    message: "Error hashing password"
                });
            } else {
                // Update the password in the database
                User.findOneAndUpdate({ email }, { password: hashedPassword }, { new: true })
                    .then(updatedUser => {
                        if (updatedUser) {
                            res.json({
                                status: "Success",
                                message: "Password has been reset successfully"
                            });
                        } else {
                            res.json({
                                status: "Failure",
                                message: "User not found with this email"
                            });
                        }
                    })
                    .catch(error => {
                        console.error("Error updating password:", error);
                        res.json({
                            status: "Failure",
                            message: "Error updating password"
                        });
                    });
            }
        });
    }
});


app.listen("3000",()=>{
    console.log("the server is working on port 3000")
})

