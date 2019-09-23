var express = require('express');
var router = express.Router();
var multer = require('multer');
fs = require('fs-extra'); 
var fs_extfs = require('extfs');

const { readdirSync, statSync } = require('fs');
const { join } = require('path');

var storage = multer.diskStorage({
  destination: function(req, file, cb) {
    console.log(file)
      //cb(null, '/Users/aarondiamond-reivich/Documents/saga/express-server/uploaded-files');
      cb(null, './tempDir/');

   },
  filename: function (req, file, cb) {
    console.log(file)
      cb(null , file.originalname);
  }
});

var upload = multer({ storage: storage })

/* GET home page. */
router.get('/', function(req, res, next) {
  console.log("homepage")
  res.render('index', { title: 'Home Page by Aaron' });
});

/* download a single file */
router.get('/download', function(req, res){
  //console.log(req)
  var file = req.body.file_location
  console.log("file_location: " + req.body.file_location)
  res.download(file)
});

/**Download a folder */
router.get('/get-folder', function(req, res) {
    console.log("Getting Folders!")

    finalEmptyFolders = []
    finalFiles = []
    returnedFoldersAndFiles = getDirs(req.body.folder_location)
    unprocessedDirectories = returnedFoldersAndFiles[0]
    finalFiles = returnedFoldersAndFiles[1]

    while (unprocessedDirectories.length > 0) {
      currDir = unprocessedDirectories.pop()
      currdirName = currDir[0]
      currdirPath = currDir[1]

      if (fs_extfs.isEmptySync(currdirPath)) {
        // found an empty folder
        finalEmptyFolders.push([currdirName, currdirPath])
      } else {
        // found a non-empty folder
        returnedFoldersAndFiles = getDirs(currdirPath)
        unprocessedDirectories.push(returnedFoldersAndFiles[0])
        finalFiles.push(returnedFoldersAndFiles[1])
      }
    }

    console.log("finalEmptyFolders: " + finalEmptyFolders)
    console.log("finalFiles: " + finalFiles)



})


function getDirs (rootDir) {
    console.log("get dirs called")

    if (rootDir[rootDir.length -1] != '/') {
      rootDir = rootDir + "/";
    }

    files = fs.readdirSync(rootDir);
    dirs = [];
    discoveredFiles = [];

    var file 
    for (var i = 0; i < files.length; i++) {
      file = files[i]
      // TODO What to do with . files/folders!
      if (file[0] != '.') {
        filePath = rootDir + file
        stat = fs.statSync(filePath)
        if (stat.isDirectory()) {
          dirs.push([file, filePath])
        } else {
          discoveredFiles.push([file, filePath])
        }
      }
    }

    return [dirs, discoveredFiles]
}
    

upload1 = 

/* upload single file */
router.post('/single-upload', upload.single('file'), (req, res) => {
  console.log("destination of file upload: " + req.body.destination)
  var destination = req.body.destination
  var fileName = req.body.file_name
  directoryArray = destination.split('/')

  length = directoryArray.length - 2
  destinationPath = ""

  for (i = 0; i <= length; i++) {
    destinationPath += directoryArray[i] + "/"
  };

  move(fileName, destinationPath)
  res.end()  
});

/**Upload a single empty folder */
router.post('/single-empty-folder', (req, res) => {
  var currentPath = process.cwd();
  path = currentPath + "/" + req.body.destination
  console.log("path: " + path)
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path, { recursive: true })
  } 
  res.end()
});

function move (fileName, destinationPath) {
  console.log("MOVING")
  console.log("Destination Path: " + destinationPath)
  console.log("fileName: " + fileName)

  fs.move('./tempDir/' + fileName, destinationPath + fileName, { overwrite: true }, function (err) {
      if (err) {
          return console.error(err);
      }
  });
};

module.exports = router;
