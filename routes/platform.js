const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs-extra'); 
const mongoose = require('mongoose');
require("../models/Feedback");
const Feedback = mongoose.model('Feedback');
const auth = require('./auth');
const child_process = require('child_process');
const url = require('url');    


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

// Render the project page
router.get('/project',
    auth.loggedIn,
    (req, res) => {
        res.render('projectHome.html', {projectName: req.query.projectName});
    }
) 

// Load a project
router.get('/load-project',
    auth.loggedIn,
    (req, res) => {
        console.log("PROJECT NAME: " + req.query.projectName)
        populatedUrl = (url.format({
            pathname:"/project",
            query: {
               "projectName":req.query.projectName
            }
        }));
        // Todo redirect directly to /project without sending to client first.
        // This seems like a security vulnerability! 
        res.send({"url" : populatedUrl}).end();
    }
) 

// render the contact page
router.get('/contact', (req, res) => {
    res.render('contact.html')
})

// submite feedback to the database
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


// Create a new account
router.post('/createAccount',
    auth.createAccount,
    auth.passport.authenticate('local', {
        successRedirect: '/projects',
        failureRedirect: '/alpha'
    })
)

// Login in to an account
router.post('/login',
    auth.passport.authenticate('local'),
    function(req, res) {
        res.status(200).end();
    }
);

// Log out of an account
router.get('/logout', 
    auth.loggedIn,  
    (req, res) => {
        req.logout();
        res.redirect('/');
    }
)

// Get all Projects of a User
router.get("/userprojects", async function(req, res) {
    var username = req.user.username;
    var user = await Users.findOne({ username: username }).exec();
    res.send(data={
        "username": username,
        "projects": user.projects
    }).end();
})

// Get all branches of a project
router.get("/getBranches" , async function (req, res) {
    // TODO make sure this does not allow for injection attacks
    var project = req.query.projectName;
    var child = child_process.spawn('cd efs/' + project + ' && saga branch', {
        shell: true
    });
    
    child.stderr.on('data', function (data) {
        console.error("STDERR:", data.toString());
    });
    child.stdout.on('data', function (data) {
        var branches = data.toString()
        res.send(data= {
            "branches": branches
        }).end();
    });
    child.on('exit', function (exitCode) {
        console.log("Child exited with code: " + exitCode);
    });

})

// Get collaborators to project
router.get("/projectinfo", async function(req, res) {
    var project = req.query.project;
    projectData = await Projects.findOne({ project: project }).exec();
    res.send(data={
        "project": project,
        "collaborators": projectData.collaborators
    }).end();
})

// If path is directory, return folders and files directly inside
// If path is a file, stream the file
router.post("/projectpath", async function (req, res) {
    var path = req.body.path;
    var branch = req.body.branch;

    console.log("path: " + path)
    console.log("branch: " + branch)
    
    /* Read the correct branch: 

    get the repository: get_repository()

    get the head commit from branch: repository.head_commit_from_branch(branch)

    get the state hash: result of the last command . state_hash()

    */

    var repository
    var firstChild = child_process.spawn('cd efs/' + path + ';', {
        shell: true
    });

    firstChild.stderr.on('data', function (data) {
        console.error("STDERR:", data.toString());
    });
    firstChild.stdout.on('data', function (data) {
        repository = data
        console.log("standard out")
        console.log(repository)
    });
    firstChild.on('exit', function (exitCode) {
        console.log("Child exited with code: " + exitCode);
    });


    // Check if path is a repository
    pathStartingAtEFS = "./efs/" + path;
    var status = fs.lstatSync(pathStartingAtEFS);
    if (status.isDirectory()) {
    // If path is a directory
        var foundPaths = getPathsInRepository(path)
        res.send(data = {paths: foundPaths}).end(); 
    } else {
    // If Path is a file
        pathStartingAtEFS = "./efs/" + path;

         // This line opens the file as a readable stream
        var readStream = fs.createReadStream(pathStartingAtEFS);

        readStream.push(path + '\n')

        // Open File as a readable stream
        readStream.on('open', function () {
            // This just pipes the read stream to the response object (which goes to the client)
            readStream.pipe(res);
            console.log(res)

        });

        // This catches any errors that happen while creating the readable stream (usually invalid names)
        readStream.on('error', function(err) {
            res.end(err);
        });
    }
})

// Add a collaborator to project
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

// get all paths inside folder
function getPathsInRepository(path) {
    pathStartingAtProject = path
    pathStartingAtEFS = "./efs/" + path;
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
}
    
module.exports = router;