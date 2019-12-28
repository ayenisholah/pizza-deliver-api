const fs = require("fs");
const path = require("path");
const helpers = require("./helpers");

// Container for the module to be exported
const lib = {};

// Base directory of the data folder
lib.baseDir = path.join(__dirname, "/../.data/");

// Write data to file
lib.create = (dir, file, data, callback) => {
  fs.open(
    lib.baseDir + dir + "/" + file + ".json",
    "wx",
    (err, fileDescriptor) => {
      // Open the file for writing
      if (!err && fileDescriptor) {
        // Convert data to string
        const stringData = JSON.stringify(data);

        // Write to file and close it
        fs.writeFile(fileDescriptor, stringData, err => {
          if (!err) {
            fs.close(fileDescriptor, err => {
              if (!err) {
                callback(false);
              } else {
                callback("error closing new file");
              }
            });
          } else {
            callback("error writing to new file");
          }
        });
      } else {
        callback("could not create a new file, it may already exist");
      }
    }
  );
};

// Read data from file
lib.read = (dir, file, callback) => {
  fs.readFile(lib.baseDir + dir + "/" + file + ".json", "utf8", (err, data) => {
    if (!err && data) {
      var parsedData = helpers.parseJsonToObject(data);
      callback(false, parsedData);
    } else {
      callback(err, data);
    }
  });
};

// Update data from a file
lib.update = (dir, file, data, callback) => {
  // Open the file for writing
  fs.open(
    lib.baseDir + dir + "/" + file + ".json",
    "r+",
    (err, fileDescriptor) => {
      if (!err && fileDescriptor) {
        // Convert data to string
        var stringData = JSON.stringify(data);

        // Truncate the file
        fs.ftruncate(fileDescriptor, err => {
          if (!err) {
            // Write to the file and close
            fs.writeFile(fileDescriptor, stringData, err => {
              if (!err) {
                fs.close(fileDescriptor, err => {
                  if (!err) {
                    callback(false);
                  } else {
                    callback("error closing existing file");
                  }
                });
              } else {
                callback("error writing to existing file");
              }
            });
          } else {
            callback("error truncating file");
          }
        });
      }
    }
  );
};

lib.delete = (dir, file, callback) => {
  // Unlink the file
  fs.unlink(lib.baseDir + dir + "/" + file + ".json", err => {
    if (!err) {
      callback(false);
    } else {
      callback("error deleting file");
    }
  });
};

// List all the items in a directory
lib.list = (dir, callback) => {
  fs.readdir(lib.baseDir + dir + "/", (err, data) => {
    if (!err && data && data.length > 0) {
      var trimmedFileName = [];
      data.forEach(fileName => {
        trimmedFileName.push(fileName.replace(".json", ""));
      });
      callback(false, trimmedFileName);
    } else {
      callback(err, data);
    }
  });
};

module.exports = lib;
