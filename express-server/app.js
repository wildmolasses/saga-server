var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var multer = require('multer');
var upload = multer({dest:'uploads/'});


var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var platformRouter = require('./routes/platform')

var app = express();

app.engine('html', require('ejs').renderFile);


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use('/static', express.static('public'))
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
//app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname + '../public'));


app.use('/', platformRouter);
app.use('/users', usersRouter);
app.use('/cli', indexRouter)

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

module.exports = app;
