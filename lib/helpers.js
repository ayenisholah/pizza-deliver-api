/**
 * Helper functions for various task
 */

const crypto = require("crypto");
const querystring = require("querystring");
const https = require("https");
const config = require("./config");
const receiptTemplate = require("./recieptTemplate");
const helpers = {};

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
    amount,
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

module.exports = helpers;
