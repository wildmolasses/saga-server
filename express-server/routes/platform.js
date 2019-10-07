var express = require('express');
var router = express.Router();


/* Render the account sign-up page */
router.get('/', (req, res) => {
    res.render('createAccount.html')
});

router.get('/seeAccounts', (req, res) => {
    console.log(accounts)
    res.end()
})


/* Create a new account */
router.post('/createAccount', (req, res) => {
    username = req.body.username
    password = req.body.password

    console.log("username!: " + username)
    console.log("password!: " + password)

    if (login(username, password)) {
        console.log("account already exists")
        res.send(data = {"success" : false})
    } else {
        createAccount(username, password)
        res.send(data = {"success" : true})
    }
    
    res.end()
})

/* Create a new account */
router.post('/login', (req, res) => {
    username = req.body.username
    password = req.body.password

    if (login(username, password)) {
        console.log("Successfully logged in")
        res.send(data = {"success" : true})
    } else {
        res.send(data = {"success" : false})
    }
    res.end()
})


/**
 * Fake Databases
 */


 /** Accounts Database */
function login (username, password) {
    for (var i = 0; i < accounts.length; i++) {
        console.log("current account")
        console.log(accounts[i])
        if (accounts[i].username == username && accounts[i].password == password) {
            console.log("account exists")
            return true
        }
    }
    return false
}

function createAccount (username, password) {
    accounts.push({"username" : username, "password" : password})
}

var accounts = [
    {"username" : "aaron", "password" : "aaron_password"},
    {"username" : "jacob", "password" : "jacob_password"}
]



module.exports = router;