const fs = require('fs-extra').promises;
const child_process = require('child_process');
const dbutils = require('./utils');

// get all paths inside folder
async function getPathsInFolder(path) {
    pathStartingAtProject = path
    pathStartingAtEFS = "./efs/" + path;
    paths = []
    var contentsAtPath = await fs.readdir(pathStartingAtEFS);
    for (var i = 0; i < contentsAtPath.length; i++ ) {
        var newPath = pathStartingAtProject + "/" + contentsAtPath[i]
        var newPathStartingAtEFS = "./efs/" + newPath
        var newPathStatus = await fs.lstat(newPathStartingAtEFS);
        if (newPathStatus.isDirectory()) {
            // true if directory
            paths.push({path: newPath, isDirectory: true})
        } else {
            // false if file
            paths.push({path: newPath, isDirectory: false})
        }
    }
    return paths
}

function validateString(string) {
    blacklist = [';', '|', "||", "&&", ".."]
    for (var i = 0; i < blacklist.length; i++) {
        if (string.indexOf(blacklist[i]) > -1) {
            return false;
          }
    }
    return true;
}


async function getBranches(projectName) {
    return new Promise(function(resolve, reject) {
        if (!dbutils.projectExists(projectName)) {
            // If there is no project with this name, there are no branches
            resolve([]);
            return;
        } else if (!validateString(projectName)) {
            // If this is an attack, then we don't try either
            resolve([]);
            return;
        } else {
            const child = child_process.spawn('cd efs/' + projectName + ' && saga branch', {
                shell: true
            });
            
            child.stderr.on('data', function (data) {
                // If there's an error, we just don't have branches
                resolve([]);
            });

            child.stdout.on('data', function (data) {
                const branches = data.toString();
                var branchArray = branches.replace("*", "").split("\n");
                // remove all the empty branches
                branchArray = branchArray.filter(branch => (branch.trim() !== ''));
                // cleanup the whitespace
                branchArray = branchArray.map(branch => branch.trim());
                resolve(branchArray);
            });
        }
    });
}


module.exports = {
    getPathsInFolder: getPathsInFolder,
    validateString: validateString,
    getBranches: getBranches
}
