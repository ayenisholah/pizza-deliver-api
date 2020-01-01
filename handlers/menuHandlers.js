const menu = require("../lib/menu");
const _data = require("../lib/data");
const helpers = require("../lib/helpers");

const menuHandler = {};

menuHandler.getMenuItems = (data, callback) => {
  const token = data.payload.token || data.headers.token;
  // Lookup the token
  _data.read("tokens", token, (err, tokenData) => {
    if (!err && tokenData) {
      // check if the token is stil valid
      if (tokenData.expires > new Date(Date.now()).toISOString()) {
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

menuHandler.createOrder = (data, callback) => {
  const token = data.headers.token || data.payload.token;

  // Lookup the token
  _data.read("tokens", token, (err, tokenData) => {
    if (!err && tokenData) {
      // check if the token is stil valid
      if (tokenData.expires > new Date(Date.now()).toISOString()) {
        let { items, cardToken } = data.payload;
        cardToken = typeof cardToken != "string" ? "tok_visa" : cardToken;
        const menuIds = Object.keys(menu).map(Number);
        if (!items || !items.length) {
          return callback(500, {
            success: false,
            error: "error charging credit card"
          });
        }
        const price = 50; //items.reduce((acc, curr) => acc + menu[curr].price, 0);
        helpers.chargeCreditCard(cardToken, price, stripeErr => {
          if (stripeErr) {
            return callback(500, {
              success: false,
              error: "Error charging credit card"
            });
          }
          console.log(items, price);
          helpers.sendReceipt(tokenData.email, { items, price }, mailErr => {
            if (mailErr) {
              console.log(mailErr);
              return callback(500, {
                success: false,
                error: "Error sending delievery mail"
              });
            }
            return callback(200, {
              message: "Order created successfully",
              items,
              price
            });
          });
        });
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

menuHandler.verifyToken = (token, email, callback) => {
  // Lookup the token
  _data.read("tokens", token, (err, tokenData) => {
    if (!err && tokenData) {
      // Check that the token is for the given user and has not expired
      if (
        tokenData.email == email &&
        tokenData.expires > new Date(Date.now()).toISOString()
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

module.exports = menuHandler;
