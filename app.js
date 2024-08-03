//jshint esversion:6

import dotenv from "dotenv"
import express from "express";
import bodyParser from "body-parser";
import ejs from "ejs";
import mongoose from "mongoose";  
import encrypt from "mongoose-encryption";
import md5 from "md5";

dotenv.config();


const app = express();
console.log(process.env.API_KEY)
app.use(express.static("public"));
app.set('view engine', "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
const port = 3000;

mongoose.connect("mongodb://localhost:27017/userDB", { useNewUrlParser: true, useUnifiedTopology: true });

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

 
const User = mongoose.model("User", userSchema);

app.get('/', (req, res) => {
    res.render("home");
});

app.get('/login', (req, res) => {
    res.render("login");
});

app.get('/register', (req, res) => {
    res.render("register");
});

app.post('/register', async (req, res) => {
    try {
        const newUser = new User({
            email: req.body.username,
            password: md5(req.body.password)
        });
        
        await newUser.save();
        res.render("secrets");
    } catch (err) {
        console.log(err);
        res.status(500).send("An error occurred while registering the user.");
    }
});

app.post('/login', async (req, res) => {
    const username = req.body.username;
    const password = md5(req.body.password)
    try {
        const foundUser = await User.findOne({ email: username }).exec(); // .exec() is optional but good practice for consistency

        if (foundUser && foundUser.password === password) {
            res.render("secrets")   
         
        } else {
            console.log("email or passowrd incorrect! try again")
        }
    } catch (err) {
        console.log(err);
        res.status(500).send("An error occurred while finding the user.");
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

























































































































