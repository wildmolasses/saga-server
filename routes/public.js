const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');
const Feedback = mongoose.model('Feedback');

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

module.exports = router;