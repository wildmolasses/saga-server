var express = require('express');
var archiver = require('archiver');
var unzipper = require('unzipper');
const passport = require('./auth').passport;
var auth = require('./auth');
fs = require('fs-extra');

var router = express.Router();




router.get(
  "/:project.saga",
  function(req, res) {
  // TODO: we want to get the specific thing they want to pull
  // TODO: we need to authenticate they can actually pull it

  project = req.params.project

  console.log(project)

  var archive = archiver('zip');

  archive.on('error', function(err) {
    res.status(500).send({error: err.message});
  });

  //set the archive name
  res.attachment('archive-name.zip');

  //this is the streaming magic
  archive.pipe(res);
  archive.directory("./efs/" + project, project);
  archive.finalize();
});

router.post(
  "/:project.saga",
  auth.loggedIn,
  async function(req, res) {
    // TODO: we need to authenticate they can actually push it
    // TODO: we need to authetnicate its a real project!

    project = req.params.project

    // If the project exists, we need to check if the user is a collaborator
    
    if (await auth.projectExists(project)) {
      if (!(await auth.isCollaborator(req.user.username, project))) {
        console.log("NOT AN EDITOR OF THIS PROJECT");
        res.status(403).send("You must be a collaborator to edit this project");
        return;
      }
    } else {
      await auth.createProject(project, req.user.username);
    }

    // Else, the user has permission to push
    req.pipe(req.busboy);
    req.busboy.on('file', function (fieldname, file, filename) {
      file.pipe(unzipper.Extract({ path: './efs/' + project }));


      res.end()
    });
});

module.exports = router;
