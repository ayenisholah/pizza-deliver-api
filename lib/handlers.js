const _data = require("./data");
const helpers = require("./helpers");

const handlers = {};

// Users
handlers.users = (data, callback) => {
  const acceptableMethod = ["post", "get", "delete", "put"];

  if (acceptableMethod.indexOf(data.method) > -1) {
    handlers._users[data.method](data, callback);
  } else {
    callback(405);
  }
};

/**
 * container for all users method
 * @private
 */
handlers._users = {};

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
handlers._users.post = (data, callback) => {
  const firstName =
    typeof data.payload.firstName == "string" &&
    data.payload.firstName.trim().length > 0
      ? data.payload.firstName.trim()
      : false;

  const lastName =
    typeof data.payload.lastName == "string" &&
    data.payload.lastName.trim().length > 0
      ? data.payload.lastName.trim()
      : false;

  const email =
    typeof data.payload.email == "string" &&
    data.payload.email.trim().length > 0 &&
    /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(data.payload.email)
      ? data.payload.email.trim()
      : false;

  const password =
    typeof data.payload.password == "string" &&
    data.payload.password.trim().length > 0
      ? data.payload.password.trim()
      : false;

  const tosAgreement =
    typeof data.payload.tosAgreement == "boolean" &&
    data.payload.tosAgreement == true
      ? true
      : false;

  const address =
    typeof data.payload.address == "string" &&
    data.payload.address.trim().length > 0
      ? data.payload.address.trim()
      : false;

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
                message: "new user created successfully"
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
 * @requires email
 * @returns userObject
 */

handlers._users.get = (data, callback) => {
  // Validate the email
  const email =
    typeof data.queryString.email == "string" &&
    data.queryString.email.trim().length > 0 &&
    /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(data.queryString.email)
      ? data.queryString.email.trim()
      : false;

  // Look up the user
  _data.read("users", email, (err, userData) => {
    if (email) {
      if (!err && userData) {
        delete userData.hashedPassword;
        callback(200, { success: true, userData });
      } else {
        callback(404, { success: false, error: "user not found" });
      }
    } else {
      callback(404, { success: false, error: "user not found" });
    }
  });
};

/**
 * Users - put
 * @requires email
 * @requires firstName||lastName||password||address (atleast one must be specified)
 * @callback success||error
 */
handlers._users.put = (data, callback) => {
  // validate inputs
  const firstName =
    typeof data.payload.firstName == "string" &&
    data.payload.firstName.trim().length > 0
      ? data.payload.firstName.trim()
      : false;

  const lastName =
    typeof data.payload.lastName == "string" &&
    data.payload.lastName.trim().length > 0
      ? data.payload.lastName.trim()
      : false;

  const email =
    typeof data.queryString.email == "string" &&
    data.queryString.email.trim().length > 0 &&
    /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(data.queryString.email)
      ? data.queryString.email.trim()
      : false;

  const password =
    typeof data.payload.password == "string" &&
    data.payload.password.trim().length > 0
      ? data.payload.password.trim()
      : false;

  const address =
    typeof data.payload.address == "string" &&
    data.payload.address.trim().length > 0
      ? data.payload.address.trim()
      : false;

  // Error if the email is invalid
  if (email) {
    // Error if nothing sent to update
    if (firstName || lastName || password || address) {
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
            userData.hashedPassword = helpers.hash(password);
          }
          if (address) {
            userData.address = address;
          }
          // S
          // Store the new update
          _data.update("users", email, userData, err => {
            if (!err) {
              callback(200, {
                success: true,
                message: "user updated successfully"
              });
            } else {
              console.log(err);
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
      callback(400, {
        success: false,
        error: "missing or invalid field to update"
      });
    }
  } else {
    callback(404, { success: false, error: "user not found" });
  }
};

/**
 * User - Delete
 * @requires email
 * @optional none
 */

handlers._users.delete = (data, callback) => {
  const email =
    typeof data.queryString.email == "string" &&
    data.queryString.email.trim().length > 0 &&
    /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(data.queryString.email)
      ? data.queryString.email.trim()
      : false;

  if (email) {
    // Lookup the user
    _data.read("users", email, (err, userData) => {
      if (!err && userData) {
        // Delete the user
        _data.delete("users", email, err => {
          if (!err) {
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
        callback(400, {
          success: false,
          error: "could not find the specified user"
        });
      }
    });
  } else {
    callback(400, { success: false, error: "missing required field" });
  }
};

// Tokens
handlers.tokens = (data, callback) => {
  const acceptableMethod = ["post", "get", "put", "delete"];
  if (acceptableMethod.indexOf(data.method) > -1) {
    handlers._tokens[data.method](data, callback);
  } else {
    callback(405, { sucess: false, error: "method not allowed" });
  }
};

// Container for all token methods
handlers._tokens = {};

/**
 * Token - Post
 * @requires email&&password
 * @callback success||error
 */

handlers._tokens.post = (data, callback) => {
  const email =
    typeof data.payload.email == "string" &&
    data.payload.email.trim().length > 0 &&
    /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(data.payload.email)
      ? data.payload.email.trim()
      : false;

  const password =
    typeof data.payload.password == "string" &&
    data.payload.password.trim().length > 0
      ? data.payload.password.trim()
      : false;

  if (email && password) {
    // Look up the user
    _data.read("users", email, (err, userData) => {
      if (!err && userData) {
        const hashedPassword = helpers.hash(password);

        if (hashedPassword == userData.hashedPassword) {
          const token = helpers.generateToken(20);
          const expires = new Date(Date.now() + 1000 * 60 * 60).toISOString();

          const tokenObject = {
            email,
            token,
            expires
          };
          // Store the token
          _data.create("tokens", token, tokenObject, err => {
            if (!err) {
              callback(200, { success: true, tokenObject });
            } else {
              callback(500, { sucess: false, error: "could not create token" });
            }
          });
        } else {
          callback(400, { sucess: false, error: "Incorrect password" });
        }
      } else {
        callback(404, {
          success: false,
          error: "could not find the specified user"
        });
      }
    });
  } else {
    callback(400, { sucess: false, error: "missing require field(s)" });
  }
};
/**
 * Token - get
 * @requires token
 * @callback success||error
 */
handlers._tokens.get = (data, callback) => {
  const token =
    typeof data.queryString.token == "string" &&
    data.queryString.token.trim().length == 20
      ? data.queryString.token.trim()
      : false;

  if (token) {
    // Look up the token
    _data.read("tokens", token, (err, tokenData) => {
      if (!err && tokenData) {
        callback(200, { success: true, tokenData });
      } else {
        callback(400, { sucess: false, error: "invalid token" });
      }
    });
  } else {
    callback(400, { success: false, error: "missing or invalid token" });
  }
};
/**
 * Token - Delete
 * @requires token
 * @callback success||error
 */
handlers._tokens.delete = (data, callback) => {
  const token =
    typeof data.queryString.token == "string" &&
    data.queryString.token.trim().length == 20
      ? data.queryString.token.trim()
      : false;

  if (token) {
    // Lookup the token
    _data.read("tokens", token, (err, tokenData) => {
      if (!err && tokenData) {
        _data.delete("tokens", token, err => {
          if (!err) {
            callback(200, {
              success: true,
              message: "token deleted successfully"
            });
          } else {
            callback(500, { sucess: false, error: "could not delete token" });
          }
        });
      } else {
        callback(400, {
          success: false,
          error: "could not find the specified token"
        });
      }
    });
  } else {
    callback(400, { sucess: false, error: "invalid or missing token" });
  }
};

handlers._tokens.verifyToken = (token, email, callback) => {
  // look up the token
  _data.read("tokens", token, (err, tokenData) => {
    if (!err && tokenData) {
      // Check that the token is for the given user and has not expired
      if (
        tokenData.email == email &&
        tokenData.expires > new Date(Date.now).toISOString()
      ) {
        callback(true);
      } else {
        callback(false);
      }
    } else {
      callback(false);
    }
  });
};

handlers._tokens.verifyToken()

handlers.notFound = (data, callback) => {
  callback(404, { success: false, message: "invalid route" });
};

module.exports = handlers;
