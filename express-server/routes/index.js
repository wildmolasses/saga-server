var express = require('express');
var router = express.Router();
var multer = require('multer');
fs = require('fs-extra'); 
var fs_extfs = require('extfs');
const path = require('path')

var storage = multer.diskStorage({
  destination: function(req, file, cb) {
    console.log(file)
      cb(null, './tempDir/');

   },
  filename: function (req, file, cb) {
    console.log(file)
      cb(null , file.originalname);
  }
});

var upload = multer({ storage: storage })

/* download a single file */
router.get('/download', function(req, res){
  var file = req.body.file_location
  res.download(file)
});

/**Download a folder */
router.get('/get-folder', function(req, res) {
    finalEmptyFolders = []
    finalFiles = []

    root_directory = __dirname
    folder = "/../" + req.body.folder_location
    folder_path = path.join(__dirname, folder) 
    returnedFoldersAndFiles = getDirs(folder_path)

    unprocessedDirectories = returnedFoldersAndFiles[0]
    finalFiles.push(returnedFoldersAndFiles[1])

    while (unprocessedDirectories.length > 0) {
      currDir = unprocessedDirectories.pop()
      currdirName = currDir[0]
      currdirPath = currDir[1]

      if (fs_extfs.isEmptySync(currdirPath)) {
        // found an empty folder
        finalEmptyFolders.push(([currdirName, currdirPath]))
      } else {
        // found a non-empty folder
        returnedFoldersAndFiles = getDirs(currdirPath)
        unprocessedDirectories.push(returnedFoldersAndFiles[0])
        finalFiles.push(returnedFoldersAndFiles[1])
      }
    }

    var start_relative_path_index = root_directory.length - 6

    // create list of relative file paths to return
    var filePaths = []
    for (var i = 0; i < finalFiles.length; i++) { 
      if (finalFiles[i][0][1] != undefined) {
        filePaths.push(finalFiles[i][0][1].substring(start_relative_path_index))
      }
    }

    // create list of relative empty folder paths to return
    var emptyFolderPaths = []
    for (var i = 0; i < finalEmptyFolders.length; i++) { 
      if (finalEmptyFolders[i][1] != undefined) {
        emptyFolderPaths.push(finalEmptyFolders[i][1].substring(start_relative_path_index))
      }
    }

    var JSONdata = JSON.stringify({file_paths: filePaths, empty_folder_paths : emptyFolderPaths});
    res.send(JSONdata)
    res.end()
    
})

/* upload single file */
router.post('/single-upload', upload.single('file'), (req, res) => {
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
  folder = "/../" + req.body.destination
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
          return console.error(err);
      }
  });
};

/** Find all directories */
function getDirs (rootDir) {
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
      } else if (file != undefined && file != null) {
        discoveredFiles.push([file, filePath])
      }
    }
  }

  return [dirs, discoveredFiles]
}

module.exports = router;
