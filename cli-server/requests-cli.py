import requests 
import os
import glob


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
        print("Creating Directory: " + file_location_excluding_file)
        os.makedirs(file_location_excluding_file)
 
    # sending get request and saving the response as response object 
    r = requests.get(url = URL, data={'file_location' : file_path}) 

    print('file_location: ' +  file_path)

    f = open(file_location, 'wb')
    f.write(r.content)
    f.close()
    print("Downloaded: {}".format(file_path))


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
    print("file path: " + file_path)
    requests.post(url = URL, data = {"destination" : file_path, "universal_folder_location" : universal_folder_location})


def send_folder(folder_path, saga_working_directory):
    # api-endpoint 
    print("folder_path: " + saga_working_directory + folder_path)
    all_internal_directories = _relative_paths_in_dir(folder_path)

    print(all_internal_directories)
    for dir in all_internal_directories:
        universal_folder_location = saga_working_directory + folder_path + dir
        relative_folder_location = folder_path + dir

        if not os.path.isdir(universal_folder_location):    
                print ("NOT a directory @ " + relative_folder_location)   
                send_file(folder_path + dir)       
        elif len(os.listdir(universal_folder_location)) == 0:
                print("Directory is empty @ " + relative_folder_location)
                send_empty_folder(folder_path + dir, universal_folder_location)

def get_folder(folder_path, saga_working_directory):
    # api-endpoint 
    URL = "http://localhost:3000/get-folder"
    
    universal_folder_location = saga_working_directory + folder_path
 
    try:
        response = requests.get(url = URL, data={'folder_location' : universal_folder_location}) 
        # get the response with array of file and folders
        # if it is a folder that is empty, create the folder
        # if it is a file read it, write it, close it
    else:
        

    
    # sending get request and saving the response as response object 

    print('file_location: ' +  file_path)

    f = open(file_location, 'wb')
    f.write(r.content)
    f.close()
    print("Downloaded: {}".format(file_path))

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


send_folder("folders/", "/Users/aarondiamond-reivich/Documents/saga/saga-server/cli-server/")
#send_file("pictures/document.rtf")
input()
get_file("pictures/document.rtf", "/Users/aarondiamond-reivich/Desktop/")

#TODO: write a route that uploads a folder
     # figure out how to dynamically set multers: https://stackoverflow.com/questions/41429355/multer-dynamic-destination-path 
     # send over a whole bunch of files from a single folder, and put them in this folder
     # also, download a whole folder 