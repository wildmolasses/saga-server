const mongoose = require('mongoose');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

// Setup mongo
mongoose.connect('mongodb://localhost:27017/saga-server', { 
    useNewUrlParser: true,
    useUnifiedTopology: true 
});
mongoose.set('debug', false);

require("../models/Users");
const Users = mongoose.model('Users');

passport.use(new LocalStrategy(
    function(username, password, done) {
        Users.findOne({ username: username }, function (err, user) {
            if (err) { return done(err); }
            if (!user) { return done(null, false); }
            if (!user.verifyPassword(password)) { return done(null, false); }
            return done(null, user);
        });
    }
));

passport.serializeUser(function(user, done) {
    console.log("HERE", user.id);
    done(null, user.username);
});

passport.deserializeUser(function(username, done) {
    console.log("HERE1", username);
    Users.findOne({ username: username }, function (err, user) {
        console.log(user);
        done(err, user);
    });
});

module.exports = passport