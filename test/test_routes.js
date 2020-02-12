const request = require('supertest');
const assert = require('chai').assert
const app = require("../app");

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


describe('private routes do not allow unauthenticated', function () {

  it('for /projects', function test(done) {
    request(app)
      .get('/projects')
      .expect(401, done);
  });

  it('for /projectHome', function test(done) {
    request(app)
      .get('/projectHome')
      .expect(401, done);
  });

  it('for /userprojects', function test(done) {
    request(app)
      .get('/userprojects')
      .expect(401, done);
  });

  it('for /addcollaborator', function test(done) {
    request(app)
      .post('/addcollaborator')
      .send({project: "test", collaborator: "test"})
      .expect(401, done);
  });
});



describe('private routes do allow access', function () {

  // helper for logging in
  function createAuthenticatedRequest(loginDetails, done) {
    var user = request.agent(app);
    user
      .post("/login")
      .send(loginDetails)
      .end(function(error, res) {
          if (error) {
              throw error;
          } 
          done(res, user)
      });
  }

  it('allows the user to login with correct password', function test(done) {
    createAuthenticatedRequest({ username: 'aarondia', password: 'aarondia' }, function(res, user) {
      assert(res.status, 200);
      done();
    });
  });

  it('does not allow the user to login with incorrect password', function test(done) {
    createAuthenticatedRequest({ username: 'aarondia', password: 'aarondia1' }, function(res, user) {
      assert(res.status, 401);
      done();
    });
  });

  it('doesnt allow user in with missing feild', function test(done) {
    createAuthenticatedRequest({ username: 'aarondia'}, function(res, user) {
      assert(res.status, 400);
    });

    createAuthenticatedRequest({ password: 'aarondia'}, function(res, user) {
      assert(res.status, 400);
      done();
    });
  });

  it('allows use to get homepage', function test(done) {
    createAuthenticatedRequest({ username: 'aarondia', password: 'aarondia'}, function(res, user) {
      assert(res.status, 400);
      user
        .get('/projects')
        .end(function(err, res) {
          assert(res.status, 200, "correct code");
          assert(err === null, "no errors");
          assert(!res.redirect, "no redirects");
          done();
        });
    });
  });
});

