const validator = {};

validator.validateString = string =>
  typeof string == "string" && string.trim().length > 0 ? string : false;

validator.validateEmail = email =>
  typeof email == "string" &&
  email.trim().length > 0 &&
  /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)
    ? email.trim()
    : false;

validator.validateBoolean = value =>
  typeof value == "boolean" && value == true ? true : false;

module.exports = validator;
