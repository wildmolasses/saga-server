const mongoose = require('mongoose');

// Load the models
require('../models/Feedback');
require('../models/Projects');
require('../models/Users');

const databaseUrl = "mongodb+srv://admin:oNL1sXL6R0jktqVC@cluster0-4sm65.mongodb.net/production?retryWrites=true&w=majority";

// TODO: somehow handle database errors -- connection errors or something
mongoose.connect(
    databaseUrl, 
    {useNewUrlParser: true, useUnifiedTopology: true}
);
mongoose.set('debug', false);