const mongoose = require('mongoose');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const Users = mongoose.model('Users');

passport.use(new LocalStrategy(
    function(username, password, done) {
        Users.findOne({ username: username }, function (err, user) {
            if (err) { return done(err); }
            if (!user) { return done(null, false); }
            if (!user.verifyPassword(password)) { 
                return done(null, false); 
            }
            return done(null, user);
        });
    }
));

passport.serializeUser(function(user, done) {
    done(null, user.username);
});


passport.deserializeUser(function(username, done) {
    Users.findOne({ username: username }, function (err, user) {
        user.path = "/"
        done(err, user);
    });
});

function loggedIn(req, res, next) {
    if (req.user) {
        next();
    } else {
        res.redirect(401, "/");
    };
}

module.exports = {
    passport: passport,
    loggedIn: loggedIn,
}