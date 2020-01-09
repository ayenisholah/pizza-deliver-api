const _data = require("../lib/data");
const helpers = require("../lib/helpers");
const validator = require("../lib/validator");

const userHandler = {};

/**
 * User - Post
 * @requires firstName
 * @requires lastName
 * @requires email
 * @requires password
 * @requires tosAgreement
 * @requires address
 * @callback success||error

 */
userHandler.createUser = (data, callback) => {
  let {
    firstName,
    lastName,
    address,
    email,
    password,
    tosAgreement
  } = data.payload;

  firstName = validator.validateString(firstName);
  lastName = validator.validateString(lastName);
  address = validator.validateString(address);
  email = validator.validateEmail(email);
  password = validator.validateString(password);
  tosAgreement = validator.validateBoolean(tosAgreement);

  if (firstName && lastName && email && password && tosAgreement && address) {
    // Make sure that the user doesn't already exist
    _data.read("users", email, (err, data) => {
      if (err) {
        const hashedPassword = helpers.hash(password);

        if (hashedPassword) {
          const userObject = {
            firstName,
            lastName,
            email,
            address,
            hashedPassword,
            tosAgreement: true
          };

          // Store the user
          _data.create("users", email, userObject, err => {
            if (!err) {
              callback(200, {
                success: true,
                userObject
              });
            } else {
              console.log(err);
              callback(500, {
                success: false,
                error: "could not create new user"
              });
            }
          });
        } else {
          callback(500, { success: false, error: "could not hash password" });
        }
      } else {
        // User already exist
        callback(400, {
          success: false,
          error: "a user with the email already exists"
        });
      }
    });
  } else {
    callback(400, { success: false, error: "Missing or invalid field" });
  }
};

/**
 * Users - get
 * @description A method to get user data
 * @requires email
 * @returns userObject
 */

userHandler.getUser = (data, callback) => {
  let { email } = data.queryString || data.payload;
  email = validator.validateEmail(email);

  if (email) {
    let { token } = data.headers;
    token = validator.validateString(token);

    // Verify the given token is valid for the email
    userHandler.verifyToken(token, email, tokenIsValid => {
      if (tokenIsValid) {
        // Look up the user
        _data.read("users", email, (err, userData) => {
          if (!err && userData) {
            delete userData.hashedPassword;
            callback(200, { success: true, userData });
          } else {
            callback(404, { success: false, error: "user not found" });
          }
        });
      } else {
        callback(403, {
          success: false,
          error: "access denied, invalid token"
        });
      }
    });
  } else {
    callback(400, { success: false, error: "invalid or missing email" });
  }
};

/**
 * @method editUser
 * @memberof userHandler
 * @requires email
 * @optional firstName||lastName||password||address (atleast one must be specified)
 * @callback success||error
 * @description A method to help edit a user.
 */

userHandler.editUser = (data, callback) => {
  let { email } = data.queryString;
  let { firstName, lastName, password, address } = data.payload;

  email = validator.validateEmail(email);
  firstName = validator.validateString(firstName);
  lastName = validator.validateString(lastName);
  password = validator.validateString(password);
  address = validator.validateString(address);

  if (email) {
    // Error if nothing to update
    if (firstName || lastName || password || address) {
      // Get token from header
      let { token } = data.headers;
      userHandler.verifyToken(token, email, tokenIsValid => {
        if (tokenIsValid) {
          // Lookup the user
          _data.read("users", email, (err, userData) => {
            if (!err && userData) {
              // Update the neccessary field
              if (firstName) {
                userData.firstName = firstName;
              }
              if (lastName) {
                userData.lastName = lastName;
              }
              if (password) {
                userData.password = password;
              }
              if (address) {
                userData.address = address;
              }
              // Store the update
              _data.update("users", email, userData, err => {
                if (!err) {
                  callback(200, {
                    success: true,
                    userData
                  });
                } else {
                  callback(500, {
                    success: false,
                    error: "could not update the user"
                  });
                }
              });
            } else {
              callback(404, { success: false, error: "user not found" });
            }
          });
        } else {
          callback(403, {
            sucess: false,
            error: "access denied, invalid token"
          });
        }
      });
    } else {
      callback(400, {
        success: false,
        error: "missing or invalid field to update"
      });
    }
  } else {
    callback(400, { success: false, error: "invalid email address" });
  }
};

userHandler.verifyToken = (token, email, callback) => {
  // Lookup the token
  _data.read("tokens", token, (err, tokenData) => {
    if (!err && tokenData) {
      // Check that the token is for the given user and has not expired
      if (tokenData.email == email && tokenData.expires > Date.now()) {
        callback(true);
      } else {
        callback(false);
      }
    } else {
      callback(false);
    }
  });
};

/**
 * @method deleteUser
 * @memberof userHandler
 * @description A method to help delete a user.
 * @requires email
 * @optional none
 */

userHandler.deleteUser = (data, callback) => {
  let { email } = data.queryString;
  email = validator.validateEmail(email);

  if (email) {
    const { token } = data.headers;

    // verify that the token is valid for the email address

    userHandler.verifyToken(token, email, tokenIsValid => {
      if (tokenIsValid) {
        // Look up the user
        _data.read("users", email, (err, userData) => {
          if (!err && userData) {
            // Delete the user
            _data.delete("users", email, err => {
              if (!err) {
                // execute
                callback(200, {
                  success: true,
                  message: "user deleted successfully"
                });
              } else {
                callback(500, {
                  success: false,
                  error: "could not delete the user"
                });
              }
            });
          } else {
            callback(404, {
              success: false,
              error: "could not find the specified user"
            });
          }
        });
      } else {
        callback(403, {
          success: false,
          error: "access denied, or invalid token"
        });
      }
    });
  } else {
    callback(400, { success: true, error: "missing or invalid email" });
  }
};

module.exports = userHandler;
