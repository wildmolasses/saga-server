const express = require('express');
const router = express.Router();
const fs = require('fs-extra'); 
const auth = require('./auth');
const dbutils = require('../utils/utils');

// Get required models
const mongoose = require('mongoose');
const Users = mongoose.model('Users');
const Projects = mongoose.model('Projects');


// login to the user account
router.post('/login',
    auth.passport.authenticate('local'),
    function(req, res) {
        res.status(200).end();
    }
);

// log out of the user account
router.get('/logout', 
    auth.loggedIn,  
    (req, res) => {
        req.logout();
        res.redirect('/');
    }
)

// render the profile page
router.get('/projects',
    auth.loggedIn,
    (req, res) => {
        res.render('userProjects.html')
    }
) 

// render the profile page
router.get('/projectHome',
    auth.loggedIn,
    (req, res) => {
        const projectName = req.body.projectName;
        console.log(projectName)
        res.render('projectHome.html', {projectName: projectName});
    }
) 


/* Create a new account */
router.post('/createAccount',
    dbutils.createAccount,
    auth.passport.authenticate('local', {
        successRedirect: '/projects',
        failureRedirect: '/alpha'
    })
)

router.get("/userprojects", 
    auth.loggedIn,
    async function(req, res) {
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
        if (await dbutils.isCollaborator(req.user.username, project)) {
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

module.exports = router;