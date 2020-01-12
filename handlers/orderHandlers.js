var menu = require("../lib/menu");
var _data = require("../lib/data");
var helpers = require("../lib/helpers");

var orderHandler = {};

orderHandler.getMenuItems = (data, callback) => {
  const token = data.payload.token || data.headers.token;
  // Lookup the token
  _data.read("tokens", token, (err, tokenData) => {
    if (!err && tokenData) {
      // check if the token is stil valid
      if (tokenData.expires > Date.now()) {
        // Proceed
        callback(200, { menu });
      } else {
        callback(403, {
          success: false,
          error: "access denied, expired token"
        });
      }
    } else {
      callback(403, { success: false, error: "access denied, invalid token" });
    }
  });
};