require('dotenv').config()
const express = require('express');
const createError = require('http-errors');
const cookieParser = require('cookie-parser');
const path = require('path');
const logger = require('morgan');
const busboy = require('connect-busboy');
var compression = require('compression');
var helmet = require('helmet');

//console.log("Node PORT", process.env.PORT);

// Create the express app
const app = express();

// setup the database
db = require("./utils/database");
db.connect(process.env.MONGO_URL);

app.use(helmet()); // protect against basic vulns
app.use(compression()); // Compress all routes, for performance

// view engine setup
app.engine('html', require('ejs').renderFile);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Setup some middleware
app.use(express.static('public'))
app.use(logger(process.env.NODE_ENV));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(__dirname + '../public'));
app.use(busboy()); // for files

// Finially, we set up passports and sessions
const passport = require('./routes/auth').passport
app.use(
  require('express-session')(
    { secret: process.env.SESSION_SECRET, resave: false, saveUninitialized: false }
  )
);
app.use(passport.initialize());
app.use(passport.session());

// setup routes
app.use(require('./routes/public'))
app.use(require('./routes/platform'));
app.use(require('./routes/cli'))

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  console.log(req.path);
  next(createError(404));
});

// supress the favicon.ico stuff
app.get('/favicon.ico', (req, res) => res.status(204));

module.exports = app;