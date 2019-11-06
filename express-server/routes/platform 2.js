var express = require('express');
var router = express.Router();

/* Create a new account */
router.post('/create-account', (req, res) => {
    
});


router.get('/', (req, res) => {
    res.render('createAccount.html')
});

router.post('/createAccount', (req, res) => {
    username = req.body.username
    password = req.body.password

    
})



module.exports = router;