const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema({
    email: String,
    relevance: String,
    response: String,
});

mongoose.model('Feedback', FeedbackSchema);