const mongoose = require('mongoose');
const crypto = require('crypto');

const ProjectsSchema = new mongoose.Schema({
    project: String,
    id: String,
    collaborators: [String]
});


mongoose.model('Projects', ProjectsSchema);