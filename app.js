var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const passport = require('./routes/auth').passport;
var busboy = require('connect-busboy');

var app = express();

app.engine('html', require('ejs').renderFile);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

//app.use('/static', express.static('public'))
app.use(express.static('public'))
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
//app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname + '../public'));

// Finially, we set up passports and sessions
app.use(require('express-session')({ secret: 'keyboard cat', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

// For files?
app.use(busboy()); 

// setup routes
const cliRouter = require('./routes/cli');
const usersRouter = require('./routes/users');
const platformRouter = require('./routes/platform')

app.use('/', platformRouter);
app.use('/users', usersRouter);
app.use(cliRouter)

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// supress the favicon.ico stuff
app.get('/favicon.ico', (req, res) => res.status(204));

module.exports = app;
