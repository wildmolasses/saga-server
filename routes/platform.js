const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs-extra'); 
const mongoose = require('mongoose');
require("../models/Feedback");
const Feedback = mongoose.model('Feedback');
const auth = require('./auth');
var exec = require('child_process').exec, child;

const Users = mongoose.model('Users');
const Projects = mongoose.model('Projects');

// Render the homePage page
router.get('/', (req, res) => {
    res.render('homePage.html')
});

// Render the signup page of the alpha
router.get('/signup', (req, res) => {
    res.render('signup.html')
});

// Render the login page of the alpha
router.get('/login-page', (req, res) => {
    res.render('login.html')
});

// Render the about page of the alpha
router.get('/about', (req, res) => {
    res.render('about.html')
});

// Render the coming soon page
router.get('/comingsoon', (req, res) => {
    res.render('comingsoon.html')
});

// render the profile page
router.get('/projects',
    auth.loggedIn,
    (req, res) => {
        res.render('userProjects.html')
    }
) 

// render the profile page
router.post('/projectHome',
    auth.loggedIn,
    (req, res) => {
        const projectName = req.body.projectName;
        console.log(projectName)
        res.render('projectHome.html', {projectName: projectName});
    }
) 

router.get('/contact', (req, res) => {
    res.render('contact.html')
})

router.post('/submit-feedback', (req, res) => {
    const email = req.body.email;
    const relevance = req.body.relevance; 
    const response = req.body.response;

    const feedback = new Feedback();
    feedback.email = email
    feedback.relevance = relevance;
    feedback.response = response;

    feedback.save().then(() =>{
        res.render('contact.html')
    })
})


/* Create a new account */
router.post('/createAccount',
    auth.createAccount,
    auth.passport.authenticate('local', {
        successRedirect: '/projects',
        failureRedirect: '/alpha'
    })
)

/* Login in to an account */
router.post('/login',
    auth.passport.authenticate('local'),
    function(req, res) {
        res.status(200).end();
    }
);

/* Log out of an account */
router.get('/logout', 
    auth.loggedIn,  
    (req, res) => {
        req.logout();
        res.redirect('/');
    }
)

router.get("/userprojects", async function(req, res) {
    var username = req.user.username;
    var user = await Users.findOne({ username: username }).exec();
    res.send(data={
        "username": username,
        "projects": user.projects
    }).end();
})

router.get("/projectinfo", async function(req, res) {
    var project = req.query.project;
    projectData = await Projects.findOne({ project: project }).exec();
    res.send(data={
        "project": project,
        "collaborators": projectData.collaborators
    }).end();
})

router.post("/projectpath", async function (req, res) {
    var path = req.body.path;

    console.log("path: " + path)

    var foundPaths = getPathsInRepository(path)
    // Path was a directory
    if (Array.isArray(foundPaths)) {
        res.send(data = {paths: foundPaths}).end();
    // Path was a file    
    } else {
        console.log("Returning File: " + foundPaths)
        res.sendFile(foundPaths)
    }
})


function getPathsInRepository(path) {
    pathStartingAtProject = path
    pathStartingAtEFS = "./efs/" + path;
    var status = fs.lstatSync(pathStartingAtEFS);
    if (status.isDirectory()) {
        paths = []
        var contentsAtPath = fs.readdirSync(pathStartingAtEFS);
        for (var i = 0; i < contentsAtPath.length; i++ ) {
            var newPath = pathStartingAtProject + "/" + contentsAtPath[i]
            var newPathStartingAtEFS = "./efs/" + newPath
            var newPathStatus = fs.lstatSync(newPathStartingAtEFS);
            if (newPathStatus.isDirectory()) {
                // true if directory
                paths.push({path: newPath, isDirectory: true})
            } else {
                // false if file
                paths.push({path: newPath, isDirectory: false})
            }
        }
        console.log(paths)
        return paths
    } else {
        // TODO Return the File
        console.log("Return File")
        return pathStartingAtEFS
    } 
}

router.post("/addcollaborator", 
    auth.loggedIn,    
    async function(req, res) {
        var project = req.body.project;
        var collaborator = req.body.collaborator;

        // you can only add a collaborator if you are already a 
        // collaborator on the projct
        if (await auth.isCollaborator(req.user.username, project)) {
            const addedCollaborator = await auth.addCollaborator(project, collaborator);
            if (addedCollaborator) {
                res.status(200).end();
            } else {
                res.status(400).end();
            }
        } else {
            res.status(401).end();
        }
    }
)



// Creates new empty repository with given name
router.post('/createNewRepository', (req, res) => {
    repositoryName = req.body.repositoryName

    folder = "/../repositories/" + LOGGED_IN_USER + "/" + repositoryName 
    folder_path = path.join(__dirname, folder) 

    if (createRepository(folder_path, LOGGED_IN_USER, repositoryName)) {
        res.send(data = {"success" : true})
    } else {
        res.send(data = {"success" : false})
    }
})

// Search For All Repositories with Given Name
router.post('/searchForRepositories', (req, res) => {
    repositoryName = req.body.repositoryName
    foundRepositories = []
    for (var i = 0; i < accounts.length; i++) {
        accountName = accounts[i].username
        if (repositoryExists(accountName, repositoryName)) {
            repository = {
                "accountName" : accountName,
                "repositoryName" : repositoryName
            }
            foundRepositories.push(repository)
        }
    }
    res.send(data = {
        "repositories" : foundRepositories
    }) 
})

// Returns the name of all repositories owned by the logged in user
router.get('/getAllRepositories', (req, res) => {
    userRepositories = getCurrentUsersRepositories(LOGGED_IN_USER)
    res.send(data = {"repositories" : userRepositories})
})

// Returns the contents of the repository at the given path
router.post('/getPathInRepository', (req, res) => {
    var accountName = req.body.accountName
    if (accountName === undefined) {
        accountName = LOGGED_IN_USER
    }

    var repositoryName = req.body.repositoryName
    var pathRequested = req.body.path

    repositoryPath = "/../repositories/" + accountName + "/" + repositoryName 
    repositoryPath = path.join(__dirname, repositoryPath) 
    pathInRepository = path.join(repositoryPath, pathRequested)

    // check if the path is a file
    if (fs.lstatSync(pathInRepository).isFile()) {
        fs.readFile(pathInRepository, 'utf8', function(err, fileContents) {
            if (err) throw err;
            res.send(data = {
                "success" : true, 
                "owner" : accountName,
                "repositoryName" : repositoryName,
                "file" : true, 
                "directoryContents" : [],
                "fileContents" : fileContents,
                "path" : pathRequested
            })  
        });
    } else {
        // if the path is a directory
        var contents = getPathInRepositoryHelper(accountName, repositoryName, pathInRepository);

        if (contents || contents == []) {
            res.send(data = {
                "success" : true, 
                "owner" : accountName,
                "repositoryName" : repositoryName,
                "file" : false, 
                "directoryContents" : contents, 
                "fileContents" : null,
                "path" : pathRequested
            })
        } else {
            res.send(data = {
                "success" : false, 
                "owner" : accountName,
                "repositoryName" : repositoryName, 
                "file" : false, 
                "directoryContents" : null, 
                "fileContents" : null,
                "path" : pathRequested
            })
        }
    }  
})

function getRepositoryContent(accountName, repositoryName) {
    child = exec('cat *.js bad_file | wc -l',
    function (error, stdout, stderr) {
        console.log('stdout: ' + stdout);
        console.log('stderr: ' + stderr);
        if (error !== null) {
             console.log('exec error: ' + error);
        }
    });
 child();
}

function getCurrentUsersRepositories(accountName) {
    if (accountName in repositoryMapping) {
        return repositoryMapping[accountName]
    } else {
        return []
    }
}

function getCurrentUserNumberOfRepositories(accountName) {
    var count = 0
    if (accountName in repositoryMapping) {
        count++
    } 
    return count
}

function repositoryExists(accountName, repositoryName) {
    if (accountName in repositoryMapping && repositoryMapping[accountName].indexOf(repositoryName) > -1) {
        return true
    } 
    return false
}

function createRepository (repositoryLocation, accountName, repositoryName) {
    // if the user already has a repo named repositoryName
    if (repositoryExists(accountName, repositoryName)) {
        return false    
    } else {
        fs.mkdirSync(repositoryLocation, { recursive: true })
        fs.mkdirSync(repositoryLocation + '/commits', { recursive: true })
        fs.mkdirSync(repositoryLocation + '/index', { recursive: true })
        fs.mkdirSync(repositoryLocation + '/states', { recursive: true })
        // if the user has at least one repo
        if (accountName in repositoryMapping) {
            repositoryMapping[accountName] =  repositoryMapping[accountName].concat([repositoryName])
        // if this is the user's first repo
        } else {
            repositoryMapping[accountName] = [repositoryName]
        }
        return true 
    }
}
    
/**
 * Testing Routes!
 */

router.get('/allRepositories', (req, res) => {
    console.log("ALL REPOS")
    console.log(repositoryMapping)
    res.end()
})

module.exports = router;