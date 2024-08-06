
import dotenv from "dotenv"
import express from "express";
import bodyParser from "body-parser";
import ejs from "ejs";
import mongoose from "mongoose";  
import encrypt from "mongoose-encryption";
import session from "express-session";
import passport from 'passport';
import passportLocalMongoose from "passport-local-mongoose";
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import findOrCreate from 'mongoose-findorcreate';
import { Strategy as FacebookStrategy } from "passport-facebook";

dotenv.config();

const app = express();
const port = 3000;

app.use(express.static("public"));
app.set('view engine', "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
    secret: "Tere is no secret!",
    resave: false,
    saveUninitialized: false,

}))

// initializing the passport middleware on express
app.use(passport.initialize());
// to allow passport to use the express-session on login sessions
app.use(passport.session());

// to connect to the mongodb database on defined port (userDB is the database)
mongoose.connect("mongodb://localhost:27017/userDB");

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    facebookId: String
});


// used to extend the functionality of the userSchema using methods
// passportLocalMongoose it handles the hasing and salthing
userSchema.plugin(passportLocalMongoose)
userSchema.plugin(findOrCreate)
 

const User = mongoose.model("User", userSchema);
passport.use(User.createStrategy());


// used to serialize user info to session
passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, {
        id: user.id,
        username: user.username,
        picture: user.picture
      });
    });
  });
// reading the session Id and retriving data
passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
  });

// to use google account to sign up
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret:  process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile)
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

// to use facebook account to sign up
passport.use(new FacebookStrategy({
    clientID: process.env.APP_ID,
    clientSecret: process.env.APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile)
    User.findOrCreate({ facebookId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));


app.get('/', (req, res) => {
    res.render("home");
});

app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/secrets', 
    passport.authenticate('google', { failureRedirect: '/login' }),
    function(req, res) {
        // Successful authentication, redirect secrets
        res.redirect('/secrets');
    });

app.get('/login', (req, res) => {
    res.render("login");
});


// Facebook
app.get('/auth/facebook',
    passport.authenticate('facebook'));
  
app.get('/auth/facebook/secrets',
    passport.authenticate('facebook', { failureRedirect: '/login' }),
    function(req, res) {
      // Successful authentication, redirect home.
      res.redirect('/secrets');
});



app.get('/register', (req, res) => {
    res.render("register");
});

app.get('/secrets', (req, res) => {
    if (req.isAuthenticated()) {
        res.render("secrets");
    } else {
        res.redirect("/login");
    }
})

app.post('/register', async (req, res) => {
    User.register({username: req.body.username}, req.body.password, function(err, user) {
        if (err) {
            console.log(err);
            res.redirect("/register");
        } else {
            // tryies to store the cookie on there local file
            passport.authenticate("local")(req, res, function() {
                res.redirect("/secrets")
            })
        }
    })
});

app.post('/login', async (req, res) => {
    const user  = new User({
        username: req.body.username,
        password: req.body.password
    })

    // the login function is from the passport it will check automatically the password and username 
    req.login(user, function(err) {
        if (err) {
            console.log(err);
        } else {
            passport.authenticate("local")(req, res ,function() {
                res.redirect("/secrets");
            })
        }
    })
});

app.get('/logout', function(req, res, next) {
    req.logout(function(err) {
      if (err) { return next(err); }
      res.redirect('/');
    });
  });
app.listen(port, () => {
    console.log(`Server running on port ${port}`);  
});
