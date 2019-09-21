var express = require('express');
var router = express.Router();
var multer = require('multer');
fs = require('fs-extra'); //npm install fs.extra

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

router.get('/get-folder', function(req, res) {
    var folder_location = req.body.folder_location
    // recursivly check for empty files and files to return
    // return array in response
})


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
