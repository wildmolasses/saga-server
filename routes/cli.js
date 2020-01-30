var express = require('express');
var archiver = require('archiver');
var unzipper = require('unzipper');
fs = require('fs-extra');

var router = express.Router();

router.get('/pull/', function(req, res) {
  // TODO: we want to get the specific thing they want to pull
  // TODO: we need to authenticate they can actually pull it

  var archive = archiver('zip');

  archive.on('error', function(err) {
    res.status(500).send({error: err.message});
  });

  //set the archive name
  res.attachment('archive-name.zip');

  //this is the streaming magic
  archive.pipe(res);
  archive.directory("./project");
  archive.finalize();
});

router.post('/push/:project', function(req, res) {
  // TODO: we need to authenticate they can actually push it
  // TODO: we need to authetnicate its a real project!
  projectZip = "./" + req.params.project + ".zip"
  req.pipe(req.busboy);
  req.busboy.on('file', function (fieldname, file, filename) {
    file.pipe(unzipper.Extract({ path: 'projects/' + req.params.project }));
    res.end()
  });

});

module.exports = router;
