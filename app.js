// jshint esversion:6

import dotenv from "dotenv";
import express from "express";
import bodyParser from "body-parser";
import ejs from "ejs";
import mongoose from "mongoose";
import encrypt from "mongoose-encryption";

// Load environment variables from .env file
dotenv.config();

const app = express();

app.use(express.static("public"));
app.set('view engine', "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

const port = 3000;

mongoose.connect("mongodb://localhost:27017/userDB", { useNewUrlParser: true, useUnifiedTopology: true });

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});


userSchema.plugin(encrypt, { secret: process.env.SECRET_KEY, encryptedFields: ["password"] });

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

app.post('/register', (req, res) => {
    const newUser = new User({
        email: req.body.username,
        password: req.body.password
    });

    newUser.save(function(err) {
        if (err) {
            console.log(err);
        } else {
            res.render("secrets");
        }
    });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
