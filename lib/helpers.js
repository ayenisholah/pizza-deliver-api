/**
 * Helper functions for various task
 */

const crypto = require("crypto");
const config = require("./config");
const helpers = {};
const _data = require("./data");

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

module.exports = helpers;
