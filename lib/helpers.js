/**
 * Helper functions for various task
 */

const crypto = require("crypto");
const querystring = require("querystring");
const https = require("https");
const config = require("./config");
const receiptTemplate = require("./recieptTemplate");
const helpers = {};
var path = require("path");
var fs = require("fs");

helpers.parseJsonToObject = str => {
  try {
    const obj = JSON.parse(str);
    return obj;
  } catch (err) {
    return {};
  }
};

helpers.hash = str => {
  if (typeof str == "string" && str.length > 0) {
    const hash = crypto
      .createHmac("sha256", config.hashingSecret)
      .update(str)
      .digest("hex");
    return hash;
  } else {
    return false;
  }
};

helpers.generateToken = strLength => {
  strLength = typeof strLength == "number" && strLength > 0 ? strLength : false;

  if (strLength) {
    const possibleCharacters = "abcdefghijklmnopqrstuvwxyz1234567890";

    let token = "";

    for (let i = 0; i < strLength; i++) {
      let randomCharacter = possibleCharacters.charAt(
        Math.floor(Math.random() * possibleCharacters.length)
      );

      token += randomCharacter;
    }
    return token;
  } else {
    return false;
  }
};

helpers.checkForSelectedItem = (cart, selectedItem) => {
  cart.filter(item => {
    return item.selectedItem == selectedItem;
  });
};

// Get the string content of a template, and use provided data for string interpolation
helpers.getTemplate = function(templateName, data, callback) {
  templateName =
    typeof templateName == "string" && templateName.length > 0
      ? templateName
      : false;

  data = typeof data == "object" && data !== null ? data : {};

  if (templateName) {
    var templateDir = path.join(__dirname, "/../templates/");
    fs.readFile(templateDir + templateName + ".html", "utf8", function(
      err,
      str
    ) {
      if (!err && str && str.length) {
        // Do interpolation on the string
        var finalString = helpers.interpolate(str, data);
        callback(false, finalString);
      } else {
        callback("No template could be found");
      }
    });
  } else {
    callback("A valid template name was not specified");
  }
};

// Add the universal header and footer to a string, and pass provided data object to header and footer for interpolation
helpers.addUniversalTemplates = function(str, data, callback) {
  str = typeof str == "string" && str.length > 0 ? str : "";
  data = typeof data == "object" && data != null ? data : {};
  // Get the header
  helpers.getTemplate("_header", data, function(err, headerString) {
    if (!err && headerString) {
      // Get the footer
      helpers.getTemplate("_footer", data, function(err, footerString) {
        if (!err && footerString) {
          // Add them all together
          var fullString = headerString + str + footerString;
          callback(false, fullString);
        } else {
          callback("Could not find the footer template");
        }
      });
    } else {
      callback("Could not find the header template");
    }
  });
};

// Take a given string and data object, and find/replace all the keys within it
helpers.interpolate = function(str, data) {
  str = typeof str == "string" && str.length > 0 ? str : "";
  data = typeof data == "object" && data != null ? data : {};

  // Add the templateGlobalss to the data object, prepending their key name with "global."
  for (var keyname in config.templateGlobals) {
    if (config.templateGlobals.hasOwnProperty(keyname)) {
      data["global." + keyname] = config.templateGlobals[keyname];
    }
  }
  // For each key in the data object, insert its value into the string at the corresponding placeholder
  for (var key in data) {
    if (data.hasOwnProperty(key) && typeof data[key] == "string") {
      var replace = data[key];
      var find = "{" + key + "}";
      str = str.replace(find, replace);
    }
  }
  return str;
};


/**
 * @method sendHTTPSRequest
 * @memberof helpers
 * @description An helper function to help send HTTPS request
 */

helpers.sendHTTPSRequest = (requestDetails, payload, callback) => {
  const req = https.request(requestDetails, res => {
    let responseData = "";
    res.on("data", data => {
      responseData += data.toString();
    });
    res.on("end", () => callback(false, res.statusCode, responseData));
  });
  req.write(payload);
  req.on("error", error => {
    callback(error);
  });
  req.end();
};
/**
 * @method chargeCreditCard
 * @memberof helpers
 * @description An helper function to help charge credit cards using Stripe.
 */

helpers.chargeCreditCard = (cardToken, amount, callback) => {
  const payload = {
    amount: amount,
    currency: "usd",
    source: cardToken
  };

  const stringPayload = querystring.stringify(payload);
  const requestDetails = {
    protocol: "https:",
    hostname: "api.stripe.com",
    method: "POST",
    path: "/v1/charges",
    auth: config.stripeAPISecret
  };

  helpers.sendHTTPSRequest(
    requestDetails,
    stringPayload,
    (httpsErr, statusCode, data) => {
      if (httpsErr) return callback(httpsErr, data);
      if (statusCode == 200) {
        return callback(false, data);
      }
    }
  );
};

/**
 * @method sendReceipt
 * @memberof helpers
 * @description An helper function to help send pizza order receipt
 *
 * @param {string} recipient The email of the recipient of the reciept
 */

helpers.sendReceipt = (recipient, order, callback) => {
  const payload = {
    from: "Shola Pizza <no-reply@mail.sholaayeni.com>",
    to: recipient,
    subject: "Order Receipt",
    html: receiptTemplate(order)
  };

  const payloadString = querystring.stringify(payload);
  const requestDetails = {
    protocol: "https:",
    hostname: "api.mailgun.net",
    method: "POST",
    path: `/v3/${config.mailgunDomain}/messages`,
    headers: {
      Authorization: `Bearer ${Buffer.from(
        `api:${config.mailgunAPIKey}`
      ).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded"
    }
  };

  helpers.sendHTTPSRequest(
    requestDetails,
    payloadString,
    (httpsErr, statusCode, data) => {
      if (httpsErr) return callback(httpsErr, data);
      if (statusCode == 200) {
        return callback(false, data);
      } else {
        return callback(data);
      }
    }
  );
};

module.exports = helpers;
