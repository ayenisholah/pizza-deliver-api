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
 * @callback success/error

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

  if (firstName && lastName && email && password && tosAgreement) {
    // Make sure that the user doesn't already exist
    _data.read("users", email, (err, data) => {
      if (err) {
        const hashedPassword = helpers.hash(password);

        if (hashedPassword) {
          const userObject = {
            firstName,
            lastName,
            email,
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
 * @optional none
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
  _data.read("users", email, (err, data) => {
    if (!err && data) {
      delete data.hashedPassword;
      callback(200, { success: true, data });
    } else {
      callback(404, { success: false, error: "user not found" });
    }
  });
};

handlers.notFound = (data, callback) => {
  callback(404, { success: false, message: "invalid route" });
};

module.exports = handlers;
