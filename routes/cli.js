const express = require('express');
const archiver = require('archiver');
const unzipper = require('unzipper');
const dbutils = require('../utils/utils')
const auth = require('./auth');

const router = express.Router();


router.get(
  "/:project.saga",
  function(req, res) {

  project = req.params.project

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
    project = req.params.project

    // If the project exists, we need to check if the user is a collaborator
    
    if (await dbutils.projectExists(project)) {
      if (!(await dbutils.isCollaborator(req.user.username, project))) {
        res.status(403).send("You must be a collaborator to edit this project");
        return;
      }
    } else {
      await dbutils.createProject(project, req.user.username);
    }

    // Else, the user has permission to push
    req.pipe(req.busboy);
    req.busboy.on('file', function (fieldname, file, filename) {
      file.pipe(unzipper.Extract({ path: './efs/' + project }));


      res.end()
    });
});


module.exports = router;
