const mongoose = require('mongoose');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

// Setup mongo
mongoose.connect('mongodb+srv://admin:oNL1sXL6R0jktqVC@cluster0-4sm65.mongodb.net/production?retryWrites=true&w=majority', { 
    useNewUrlParser: true,
    useUnifiedTopology: true 
});
mongoose.set('debug', false);


require("../models/Users");
const Users = mongoose.model('Users');
require("../models/Projects");
const Projects = mongoose.model('Projects');

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
        done(err, user);
    });
});

async function isCollaborator(username, project) {
    user = await Users.findOne({ username: username }).exec();
    return user.projects.includes(project);
}


function createAccount(req, _, next) {
    const username = req.body.username;
    const email = req.body.email;
    const password = req.body.password;
    usernameTakenProm(username).then((usernameTaken) => {
        if (!usernameTaken) {
            const user = new Users();
            user.username = username;
            user.email = email
    
            user.setPassword(password);
        
            user.save().then(() => {
                next();
            });
        }  
    })
}

async function addCollaborator(project, collaborator) {
    // TODO: stop assuming that both the project and collaborator exist
    user = await Users.findOne({ username: collaborator }).exec();
    project = await Projects.findOne({ project: project }).exec();

    user.projects.push(project.project);
    project.collaborators.push(collaborator);
    await user.save();
    await project.save();
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

function usernameTakenProm (username) {
    return new Promise(resolve => {
        Users.findOne({username: username}, function(err, user) {
            resolve(user !== null);
        });
    });
}

function loggedIn(req, res, next) {
    if (req.user) {
        next();
    } else {
        res.redirect('/');
    };
}

async function projectExists(project) {
    project = await Projects.findOne({project: project}).exec();
    return project != null
}

module.exports = {
    passport: passport,
    isCollaborator: isCollaborator,
    createAccount: createAccount,
    loggedIn: loggedIn,
    projectExists: projectExists,
    createProject: createProject
}