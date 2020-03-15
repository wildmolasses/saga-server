const fs = require('fs-extra').promises;
const child_process = require('child_process');
const dbutils = require('./utils');
const join = require('path').join;

// get all paths inside folder
// TODO: make sure it can only be called in EFS
async function getPathsInEFSFolder(projectName, path) {
    var paths = []
    const fullPath = join("./efs", projectName, path);
    const folderContents = await fs.readdir(fullPath);

    for (var i = 0; i < folderContents.length; i++) {
        const subpath = join(path, folderContents[i]);
        const efsSubpath = join("./efs", projectName, subpath);

        var subpathStatus = await fs.lstat(efsSubpath);
        if (subpathStatus.isDirectory()) {
            paths.push({path: subpath, isDirectory: true})
        } else {
            paths.push({path: subpath, isDirectory: false})
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
    getPathsInEFSFolder: getPathsInEFSFolder,
    validateString: validateString,
    getBranches: getBranches
}
