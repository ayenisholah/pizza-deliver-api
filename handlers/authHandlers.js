const _data = require("../lib/data");
const helpers = require("../lib/helpers");
const validator = require("../lib/validator");

const authHandler = {};
/**
 * User - Post
 
 * @desc A method to help handle user login.
 * @requires email
 * @requires password
 * @callback success||error

 */
authHandler.login = (data, callback) => {
  let { email, password } = data.payload;
  email = validator.validateEmail(email);
  password = validator.validateString(password);

  if (email && password) {
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
      }
    });
  } else {
    callback(400, { sucess: false, error: "missing require field(s)" });
  }
};

/**
 * @method logout
 * @memberof authHandler
 * @description A method to help handle user logout.
 */
authHandler.logout = (data, callback) => {
  const token = data.payload.token || data.headers.token;
  if (typeof token !== "string") {
    return callback(400, { error: "Token is not valid" });
  }
  _data.read("tokens", token, (err, tokenData) => {
    if (err) {
      return callback(400, { error: "Token is not valid" });
    }
    _data.delete("tokens", token, err => {
      if (err) {
        return callback(500, { error: "Error deleting token" });
      }
      return callback(204, {});
    });
  });
};

module.exports = authHandler;
