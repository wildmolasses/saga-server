const mongoose = require('mongoose');
const Feedback = mongoose.model('Feedback');
const Projects = mongoose.model('Projects');
const Users = mongoose.model('Users');

async function isCollaborator(username, project) {
    user = await Users.findOne({ username: username }).exec();
    return user.projects.includes(project);
}

async function createAccount(req, res, next) {
    const username = req.body.username;
    const email = req.body.email;
    const password = req.body.password;

    const exists = await userExists(username);
    if (!exists) {
        const user = new Users();
        user.username = username;
        user.email = email
        user.setPassword(password);
    
        user.save().then(() => {
            next();
        });
    } else {
        res.status(409).end();
    }
}

async function addCollaborator(project, collaborator) {
    user = await Users.findOne({ username: collaborator }).exec();
    project = await Projects.findOne({ project: project }).exec();

    // We don't add the user to the project if the user or project
    // do not exist
    if (user == null || project == null) {
        console.log(user, project)
        return false;
    }

    // We also don't add the user to the project if they are already
    // a collaborator
    if (user.projects.includes(project.project)) {
        return false;
    }

    user.projects.push(project.project);
    project.collaborators.push(collaborator);

    // TODO: this probably should be a single transaction...
    await user.save();
    await project.save();

    return true;
}

async function createProject(project, creator) {
    // TODO: make sure the
    if (!await projectExists(project)) {
        const p = new Projects();
        p.project = project;
        await p.save();
        // We also add the user as a collaborator
        await addCollaborator(project, creator);
    }
    return;
}

async function userExists(username) {
    const user = await Users.findOne({username: username}).exec();
    return user !== null;
}

async function projectExists(project) {
    const projectObj = await Projects.findOne({project: project}).exec();
    return projectObj !== null;
}

module.exports = {
    isCollaborator: isCollaborator,
    createAccount: createAccount,
    addCollaborator: addCollaborator,
    createProject: createProject,
    userExists: userExists,
    projectExists: projectExists
}