const express = require('express');
const router = express.Router();
const fs = require('fs-extra'); 
const auth = require('./auth');
const dbutils = require('../utils/utils');
const fileUtils = require('../utils/fileUtils');
const url = require('url');  
const join = require('path').join;  


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


// Deliver some data
router.get('/project/:projectName*',
    function(req, res) {
        const projectName = req.params.projectName;
        const path = req.params['0'];

        // TODO: check to make sure it's a valid project, otherwise, we render 404
        

        console.log(req.params)

        console.log("project", projectName);
        console.log("path", path);

        res.render(
            'projectHome2.html', 
            {
                projectName: projectName,
                path: path
            }
        );

 
        //res.end();
    }
)



/* Helper for finding out the current user */
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
        const added = await dbutils.addCollaborator("Example", req.user.username);
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
    res.send(data={
        "username": username,
        "projects": user.projects
    }).end();
})

// Get all branches of a project
router.get("/getBranches" , async function (req, res) {
    // TODO make sure this does not allow for injection attacks
    const projectName = req.query.projectName;
    const branches = await fileUtils.getBranches(projectName);
    res.send(branches).end();
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
router.get("/projectpath", async function (req, res) {
    const projectName = req.query.projectName;
    const branch = req.query.branch;
    const path = req.query.path;

    // Check if path is a repository
    const projectPath = join(projectName, path);
    const pathStartingAtEFS = join("./efs", projectPath);
    const status = fs.lstatSync(pathStartingAtEFS);
    if (status.isDirectory()) {
        // If path is a directory
        var foundPaths = await fileUtils.getPathsInEFSFolder(projectName, path)
        res.send(data = {directory: true, paths: foundPaths, branch: branch}).end(); 
    } else {
        // If Path is a file
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
    
module.exports = router;