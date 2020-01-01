const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs-extra'); 
const mongoose = require('mongoose');
const Users = mongoose.model('Users');
const passport = require('./auth');
var exec = require('child_process').exec, child;


// Render the landing page
router.get('/', (req, res) => {
    res.render('landing.html')
});

// Render the login of the alpha
router.get('/alpha', (req, res) => {
    res.render('login.html')
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
router.get('/profile-page',
    loggedIn,
    (req, res) => {
        console.log("RENDERING PROFILE");
        res.render('profile.html')
    }
) 

function loggedIn(req, res, next) {
    if (req.user) {
        next();
    } else {
        res.redirect('/');
    };
}

router.get('/contact', (req, res) => {
    res.render('contact.html')
})


/* Create a new account */
router.post('/createAccount',
    createAccount,
    passport.authenticate('local', {
        successRedirect: '/profile-page',
        failureRedirect: '/alpha'
    })
)

function createAccount(req, _, next) {
    const username = req.body.username;
    const email = req.body.email;
    const password = req.body.password;
    usernameTakenProm(username).then((usernameTaken) => {
        if (usernameTaken) {
            next("Error: username taken");
        }

        const user = new Users();
        user.username = username;
        user.email = email

        user.setPassword(password);
    
        user.save().then(() => {
            next();
        });
    })
}


/* Login in to an account */
router.post('/login', 
    temp,
    passport.authenticate('local', {
        successRedirect: '/profile-page',
        failureRedirect: '/alpha'
    })
);

function temp(req, res, next) {
    console.log(req.body.username);
    console.log(req.body.password);
    next()
}

// Logs user out of account by resetting LOGGED_IN_USER
router.get('/logout', (req, res) => {
    console.log("HERE");
    req.logout();
    res.redirect('/');
})

// Return Profile Information
router.get('/getProfileData', (req, res) => {
    var numRepositories = getCurrentUserNumberOfRepositories(LOGGED_IN_USER)
    res.send(data = {
        "username" : LOGGED_IN_USER,
        "numRepositories" : numRepositories
    });  
})

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

/**
 * Fake Databases
 */

 /** Accounts Database */
function login (username, password) {
    for (var i = 0; i < accounts.length; i++) {
        if (accounts[i].username == username && accounts[i].password == password) {
            return true
        }
    }
    return false
}

function usernameTakenProm (username) {
    return new Promise(resolve => {
        Users.findOne({username: username}, function(err, user) {
            resolve(user !== null);
        });
    });
}

/** Repository Database */
repositoryMapping = {"aaron" : [".saga"]}

function getPathInRepositoryHelper(accountName, repositoryName, pathInRepository) { 
    if (!fs.lstatSync(pathInRepository).isDirectory()) {
        return []
    } else {
        for (var i = 0; i <repositoryMapping[accountName].length; i++) {
            currentRepoName = repositoryMapping[accountName][i]
            if (currentRepoName == repositoryName) {
                var contentsAtPath = fs.readdirSync(pathInRepository);
                console.log("contents at path: " + contentsAtPath)
                return contentsAtPath
            }
        }
    }
    return false
}

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

router.get('/seeAccounts', (req, res) => {
    console.log(accounts)
    res.end()
})

router.get('/seeLOGGED_IN_USER', (req, res) => {
    console.log("LOGGED_IN_USER" + LOGGED_IN_USER)
    res.end()
})

router.get('/allRepositories', (req, res) => {
    console.log("ALL REPOS")
    console.log(repositoryMapping)
    res.end()
})

module.exports = router;