const mongoose = require('mongoose');

// Load the models
require('../models/Feedback');
require('../models/Projects');
require('../models/Users');

function connect(databaseUrl) {
    mongoose.connect(
        databaseUrl, 
        {useNewUrlParser: true, useUnifiedTopology: true}
    );
    if (process.env.NODE_ENV === 'production') {
        mongoose.set('debug', false);
    }

    // TODO: handle database errors
}

module.exports = {connect: connect};