var menu = require("../lib/menu");
var _data = require("../lib/data");
var helpers = require("../lib/helpers");
/*
 * HTML Handlers
 *
 */

var htmlHandler = {};

// Index
handlers.index = function(data, callback) {
  // Reject any request that isn't a GET
  if (data.method == "get") {
    // Prepare data for interpolation
    var templateData = {
      "head.title": "Shola's Pizza",
      "head.description": "We have the best pizza around",
      "body.class": "index"
    };
    // Read in a template as a string
    helpers.getTemplate("accountCreate", templateData, function(err, str) {
      if (!err && str) {
        // Add the universal header and footer
        helpers.addUniversalTemplates(str, templateData, function(err, str) {
          if (!err && str) {
            // Return that page as HTML
            callback(200, str, "html");
          } else {
            callback(500, undefined, "html");
          }
        });
      } else {
        callback(500, undefined, "html");
      }
    });
  } else {
    callback(405, undefined, "html");
  }
};

module.exports = htmlHandler;
