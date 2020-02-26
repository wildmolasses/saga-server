var mongoose = require('mongoose');
const request = require('supertest');
const assert = require('chai').assert
const app = require("../app");

function waitForConnection() {
  return new Promise(function(resolve, reject) {
    function checkConnection() {
      if (mongoose.connection.readyState === 1) {
        // the connection has veen created
        resolve();
      } else {
        setTimeout(checkConnection, 1000);
      }
    }
    checkConnection();
  });
}


before(async function() {
  this.timeout(10000);
  console.log("Waiting for connection with database");
  await waitForConnection();
  console.log("Connected to database");
})

describe('public routes allow access', function () {

  it('serves the homepage', (done) => {
    request(app)
      .get('/')
      .expect(200, done);
  });

  it('serves the signup page', (done) => {
    request(app)
      .get('/signup')
      .expect(200, done);
  });

  it('serves the login-page', (done) => {
    request(app)
      .get('/login-page')
      .expect(200, done);
  });

  it('serves the about', (done) => {
    request(app)
      .get('/about')
      .expect(200, done);
  });

  it('serves the /comingsoon', (done) => {
    request(app)
      .get('/comingsoon')
      .expect(200, done);
  });

  it('serves the /contact', (done) => {
    request(app)
      .get('/contact')
      .expect(200, done);
  });

  it('serves the /submit-feedback', (done) => {
    request(app)
      .post('/submit-feedback')
      .field('email', 'test')
      .field('relevance', 'test')
      .field('response', 'test')
      .expect(200, done);
  });
});