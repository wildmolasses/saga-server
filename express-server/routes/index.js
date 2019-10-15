var express = require('express');
var router = express.Router();
var multer = require('multer');
fs = require('fs-extra'); 
var fs_extfs = require('extfs');
const path = require('path')

var storage = multer.diskStorage({
  destination: function(req, file, cb) {
      fs.mkdirSync('./tempDir/', { recursive: true })
      cb(null, './tempDir/');

   },
  filename: function (req, file, cb) {
      cb(null , file.originalname);
  }
});

var upload = multer({ storage: storage })

/* download a single file */
router.get('/cli/download', function(req, res){
  var file = req.body.file_location
  res.download(file)
});

/**Download a folder */
router.get('/cli/get-folder', function(req, res) {
    finalEmptyFolders = []
    finalFiles = []

    root_directory = __dirname
    folder = "/../" + req.body.folder_location
    folder_path = path.join(__dirname, folder) 
    unprocessed = []
    foundDirs = getDirs(folder_path)
    unprocessed.push.apply(unprocessed, foundDirs)

    while (unprocessed.length > 0) {
      currdirPath = unprocessed.pop()

      stat = fs.lstatSync(currdirPath)
      if (stat.isDirectory()) {
        // found a directory
        finalFolders.push(currdirPath);
        foundDirs = getDirs(currdirPath);
        unprocessed.push.apply(unprocessed, foundDirs);
      } else {
        // found a file
        finalFiles.push(currdirPath)
      }
    }
    
    // Remove the last 6 characters to get out of the route folder
    var start_relative_path_index = root_directory.length - 6

    console.log(start_relative_path_index)

    // create list of relative file paths to return
    var filePaths = []
    for (var i = 0; i < finalFiles.length; i++) { 
      if (finalFiles[i] != undefined) {
        filePaths.push(finalFiles[i].substring(start_relative_path_index))
      }
    }

    // create list of relative folder paths to return
    var folderPaths = []
    for (var i = 0; i < finalFolders.length; i++) { 
      if (finalFolders[i] != undefined) {
        folderPaths.push(finalFolders[i].substring(start_relative_path_index))
      }
    }
    
    var JSONdata = JSON.stringify({"file_paths": filePaths, "folder_paths" : folderPaths});
    res.send(JSONdata)
    res.end()
    
})

/* upload single file */
router.post('/cli/single-upload', upload.single('file'), (req, res) => {
  var destination = req.body.relative_file_path
  var fileName = req.body.file_name
  directoryArray = destination.split('/')

  length = directoryArray.length - 2
  destinationPath = ""

  for (i = 0; i <= length; i++) {
    destinationPath += directoryArray[i] + "/"
  };

  destionationPath = "/../" + destinationPath
  folder_path = path.join(__dirname, destinationPath) 

  console.log("Destination Path: " + destinationPath)

  move(fileName, destinationPath)
  res.end()  
});

/**Upload a single empty folder */
router.post('/cli/single-empty-folder', (req, res) => {
  folder = "/../" + req.body.relative_folder_path
  folder_path = path.join(__dirname, folder)

  if (!fs.existsSync(folder_path)) {
    fs.mkdirSync(folder_path, { recursive: true })
  } 
  res.end()
});

/** Move location of file */
function move (fileName, destinationPath) {
  fs.move('./tempDir/' + fileName, destinationPath + fileName, { overwrite: true }, function (err) {
      if (err) {
          console.log("ERROR")
          return console.error(err);
      }
  });
};

/** Find all directories */
function getDirs (rootDir) {
  if (rootDir[rootDir.length -1] != '/') {
    rootDir = rootDir + "/";
  }

  objectsInsideFolder = fs.readdirSync(rootDir);
  dirs = [];

  var fileOrFolder 
  for (var i = 0; i < objectsInsideFolder.length; i++) {
    fileOrFolder = objectsInsideFolder[i]
    filePath = rootDir + fileOrFolder
    dirs.push(filePath) 
  }

  console.log("DIRS: " + dirs)
  return dirs
}

module.exports = router;
