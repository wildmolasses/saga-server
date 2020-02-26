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

  // generate a new account and password for testing
  function getUID() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  var loginDetails;

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

  it('allows the user to create an account', function test(done) {
    const user = request.agent(app);
    loginDetails = {
      username: getUID(),
      password: getUID()
    }
    user
      .post("/createAccount")
      .send(loginDetails)
      .end(function(error, res) {
          if (error) {
              throw error;
          } 
          console.log(res.status)
          user
            .get('/currentuser')
            .expect({username: loginDetails['username']}, done);
      });
  }).timeout(4000);

  it('does not allow a user to recreate an existing account', function test(done) {
    const user = request.agent(app);
    user
      .post("/createAccount")
      .send(loginDetails)
      .end(function(error, res) {
          if (error) {
              throw error;
          } 
          assert(res.status === 409);
          done();
      });
  }).timeout(4000);

  it('allows the user to login with correct password', function test(done) {
    createAuthenticatedRequest(loginDetails, function(res, user) {
      assert(res.status === 200);
      done();
    });
  }).timeout(4000);

  it('does not allow the user to login with incorrect password', function test(done) {
    createAuthenticatedRequest({ username: loginDetails['username'], password: "123"}, function(res, user) {
      assert(res.status === 401);
      done();
    });
  }).timeout(4000);

  it('doesnt allow user in with missing feild', function test(done) {
    createAuthenticatedRequest({ username: loginDetails['username']}, function(res, user) {
      assert(res.status === 400);
    });

    createAuthenticatedRequest({ password: loginDetails['password']}, function(res, user) {
      assert(res.status === 400);
      done();
    });
  }).timeout(4000);

  it('allows use to get homepage', function test(done) {
    createAuthenticatedRequest(loginDetails, function(res, user) {
      assert(res.status === 200);
      user
        .get('/projects')
        .end(function(err, res) {
          assert(res.status === 200, "code was " + res.status);
          assert(err === null, "no errors");
          assert(!res.redirect, "no redirects");
          done();
        });
    });
  }).timeout(4000);

  it('allows you to logout', function test(done) {
    createAuthenticatedRequest(loginDetails, function(res, user) {
      assert(res.status === 200);
      user
        .get('/logout')
        .end(function(err, res) {
          user
            .get('/currentuser')
            .expect({}, done);
        });
    });
  }).timeout(4000);
});

