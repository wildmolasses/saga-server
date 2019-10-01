import requests 
import os
import glob
import json


def get_file(file_path, saga_working_directory):

    # api-endpoint 
    URL = "http://localhost:3000/download"
    
    # location given here 
    file_location = saga_working_directory
    
    # append the file name onto the path
    file_location = file_location + file_path

    file_name = file_path.split('/')
    length = len(file_name)
    file_name = file_name[length - 1]
    file_name_length = len(file_name)

    file_location_excluding_file = file_location[:-file_name_length]

    if not os.path.exists(file_location_excluding_file):
        # create directory
        os.makedirs(file_location_excluding_file)
 
    # sending get request and saving the response as response object 
    r = requests.get(url = URL, data={'file_location' : file_path}) 

    print('file_location: ' + file_path)

    f = open(file_location, 'wb')
    f.write(r.content)
    f.close()
    print("Downloaded: {}".format(file_path))


def get_folder(relative_folder_path, saga_working_directory):
    # api-endpoint 
    URL = "http://localhost:3000/get-folder"
     
    try:
        response = requests.get(url = URL, data={'folder_location' : relative_folder_path})
        paths = response.json()
        
        # download all of the files
        for path in paths['file_paths']:
            print(path)
            get_file(path, saga_working_directory)

        # make all of the empty folders
        for path in paths['empty_folder_paths']:
            os.makedirs(saga_working_directory + path)

    except:
        print("response failed")
        


def send_file(file_path):
    # api-endpoint 
    URL = "http://localhost:3000/single-upload"

    file_name = file_path.split('/')
    length = len(file_name)
    file_name = file_name[length - 1]

    print("file path: " + file_path)
    with open(file_path, 'rb') as f:
        r = requests.post(URL, files={"file": f}, data = {"destination" : file_path, "file_name" : file_name})
        print("Uploaded: {}".format(file_path))

def send_empty_folder(file_path, universal_folder_location):
    # api-endpoint 
    URL = "http://localhost:3000/single-empty-folder"
    requests.post(url = URL, data = {"destination" : file_path, "universal_folder_location" : universal_folder_location})


def send_folder(folder_path, saga_working_directory):
    # api-endpoint 
    all_internal_directories = _relative_paths_in_dir(folder_path)

    for dir in all_internal_directories:
        universal_folder_location = saga_working_directory + folder_path + dir
        if not os.path.isdir(universal_folder_location):    
                # Found a file 
                send_file(folder_path + dir)       
        elif len(os.listdir(universal_folder_location)) == 0:
                print("empty folder")
                # Found an empty folder
                send_empty_folder(folder_path + dir, universal_folder_location)


def _relative_paths_in_dir(directory, ignore=None):    
     if ignore is None:
         ignore = []

     # we make sure that the path does not start with a slash
     if directory[-1] == "/":
         paths = [path[len(directory):] for path in glob.glob(directory + '/**', recursive=True) if path[len(directory):] != ""]
     else:
         paths = [path[len(directory) + 1:] for path in glob.glob(directory + '/**', recursive=True) if path[len(directory) + 1:] != ""]
     def include_path(path):
         for ignore_path in ignore:
             if path.startswith(ignore_path):
                 return False
         if path == directory:
             return False
         return True
     return {path for path in paths if include_path(path)}


send_folder(".DOTFOLDER/", "/Users/aarondiamond-reivich/Documents/saga/saga-server/cli-server/")
input()
get_folder(".DOTFOLDER/", "/Users/aarondiamond-reivich/Documents/saga/saga-server/testing_location_download/")
