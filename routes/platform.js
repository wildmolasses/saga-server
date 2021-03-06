const express = require('express');
const router = express.Router();
const fs = require('fs-extra'); 
const auth = require('./auth');
const dbutils = require('../utils/utils');
const child_process = require('child_process');
const url = require('url');    


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

// Render the project page
router.get('/project',
    auth.loggedIn,
    (req, res) => {
        res.render('projectHome.html', {projectName: req.query.projectName});
    }
) 

router.get('/projectSettings',
    auth.loggedIn,
    (req, res) => {
        res.render('projectSettings.html', {projectName: req.query.projectName});
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

/* Create a new account */
router.get('/currentuser',
    function(req, res) {
        if (req.user) {
            res.json({username: req.user.username});
        } else {
            res.json({});
        }
    }
)


// Create a new account
router.post('/createAccount',
    dbutils.createAccount,
    auth.passport.authenticate('local'),
    async function(req, res) {
        // We add the user
        console.log("CALLING");
        const added = await dbutils.addCollaborator("Example", req.user.username);
        console.log("ADDED:", added);
        res.status(200).end();
    }
)

// Login in to an account
router.post('/login',
    auth.passport.authenticate('local'),
    function(req, res) {
        res.status(200).end();
    }
);

// Log out of an account
router.post('/logout', 
    auth.loggedIn,  
    (req, res) => {
        req.logout();
        res.redirect('/');
    }
)

// Get all Projects of a User
router.get("/userprojects", 
    auth.loggedIn,
    async function(req, res) {
    var username = req.user.username;
    var user = await Users.findOne({ username: username }).exec();
    console.log("PROJECTS", user.projects);
    res.send(data={
        "username": username,
        "projects": user.projects
    }).end();
})

// Get all branches of a project
router.get("/getBranches" , async function (req, res) {
    // TODO make sure this does not allow for injection attacks
    var project = req.query.projectName;

    // Validate the string
    if (!validateString(project)) {
        console.log("Alert: Invalid Project Name. Potential Attack")
        res.end();
    } else {
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
    }
})

function validateString (string) {
    blacklist = [';', '|', "||", "&&", ".."]
    for (var i = 0; i < blacklist.length; i++) {
        if (string.indexOf(blacklist[i]) > -1) {
            return false;
          }
    }
    return true;
}


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

    /*

        
    Read the correct branch: 

    get the repository: get_repository()

    get the head commit from branch: repository.head_commit_from_branch(branch)

    get the state hash: result of the last command . state_hash()

    var stateHash
    var stateHashChild = child_process.spawn('saga state_hash ' + branch + ';', {
        shell: true
    });

    stateHashChild.stderr.on('data', function (data) {
        console.error("STDERR:", data.toString());
    });
    stateHashChild.stdout.on('data', function (data) {
        stateHash = data
        console.log("state hash: " + stateHash)
    });
    stateHashChild.on('exit', function (exitCode) {
        console.log("Child exited with code: " + exitCode);
    });
    
    */

    // Check if path is a repository
    pathStartingAtEFS = "./efs/" + path;
    var status = fs.lstatSync(pathStartingAtEFS);
    if (status.isDirectory()) {
    // If path is a directory
        var foundPaths = getPathsInRepository(path)
        res.send(data = {directory: true, paths: foundPaths, branch: branch}).end(); 
    } else {
    // If Path is a file
        pathStartingAtEFS = "./efs/" + path;

         // This line opens the file as a readable stream
        var readStream = fs.createReadStream(pathStartingAtEFS);

        readStream.push(path + '\n')
        readStream.push(branch + '\n')

        // Open File as a readable stream
        readStream.on('open', function () {
            // This just pipes the read stream to the response object (which goes to the client)
            readStream.pipe(res);
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
        if (await dbutils.isCollaborator(req.user.username, project)) {
            const addedCollaborator = await dbutils.addCollaborator(project, collaborator);
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