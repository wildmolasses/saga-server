const mongoose = require('mongoose');

const ProjectsSchema = new mongoose.Schema({
    project: String,
    id: String,
    collaborators: [String]
});


mongoose.model('Projects', ProjectsSchema);