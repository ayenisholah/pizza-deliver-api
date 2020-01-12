var menu = require("../lib/menu");
var _data = require("../lib/data");
var helpers = require("../lib/helpers");

var orderHandler = {};

orderHandler.getMenuItems = (data, callback) => {
  const token = data.payload.token || data.headers.token;
  _data.read("tokens", token, (err, tokenData) => {
    if (!err && tokenData) {
      if (tokenData.expires > Date.now()) {
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

/**
 * @data - menu item && quantity
 * @returns cart object
 */

orderHandler.addToCart = function addToCart(data, callback) {
  var item =
    typeof data.payload.item == "string" && data.payload.item.trim().length > 0
      ? data.payload.item.toUpperCase()
      : false;
  var quantity =
    typeof data.payload.quantity == "number" && data.payload.quantity > 0
      ? data.payload.quantity
      : 1;

  if (item && quantity) {
    var token =
      typeof data.headers.token == "string" ? data.headers.token : false;
    _data.read("tokens", token, function tokenCallback(err, tokenData) {
      if (!err && tokenData) {
        var userEmail = tokenData.email;

        _data.read("users", userEmail, function userCallback(err, userData) {
          if (!err && userData) {
            var userCart =
              typeof userData.cart == "object" ? userData.cart : {};

            userData.cart = userCart;
            var menuList = Object.values(menu);
            var menuItems = menuList.map(getMenu);

            if (menuItems.indexOf(item) > -1) {
              var selectedItems =
                typeof userCart.selectedItems == "object" &&
                userCart.selectedItems instanceof Array
                  ? userCart.selectedItems
                  : [];

              var cartTotal =
                typeof userCart.cartTotal == "number" && userCart.cartTotal > 0
                  ? userCart.cartTotal
                  : 0;

              var { price } = menuList.find(findItem);
              price *= quantity;
              var cartObject = {
                item,
                quantity,
                price
              };

              userData.cart.selectedItems = selectedItems;
              userData.cart.cartTotal = cartTotal;

              var cartList = userData.cart.selectedItems;
              var cartItemList = cartList.map(getMenuItemList);

              if (cartItemList.indexOf(item) > -1) {
                var selected = cartList.find(function(str) {
                  return str.item == item;
                });
                selected.quantity += quantity;
                let { price } = menuList.find(findItem);
                selected.price = price * selected.quantity;
              } else {
                userData.cart.selectedItems.unshift(cartObject);
              }

              var cartItemPrices = cartList.map(getCartPrices);
              cartTotal = cartItemPrices.reduce(reducer);
              userData.cart.cartTotal = cartTotal;

              _data.update("users", userEmail, userData, function(err) {
                if (!err) {
                  callback(200, { success: true, userCart });
                } else {
                  callback(500, {
                    Error: "Could not add item to cart"
                  });
                }
              });
            } else {
              callback(400, {
                success: false,
                error:
                  "You have selected an item that does not exist. check api/menu to get menu list"
              });
            }
          } else {
            callback(404, {
              success: false,
              error: "could not find the specied user"
            });
          }
        });
      } else {
        callback(403, { success: false, error: "invalid or missing token" });
      }
    });
  } else {
    callback(400, {
      success: false,
      error: "Missing required fields, check api/menu to get menu list"
    });
  }

  function getMenu(item) {
    return item.name;
  }

  function findItem(menu) {
    return menu.name == item;
  }

  function getMenuItemList(menu) {
    return menu.item;
  }

  function getCartPrices(menu) {
    return menu.price;
  }

  function reducer(acc, curr) {
    return acc + curr;
  }
};

// Todo send receipt when mailgun reset my password
orderHandler.cartCheckout = (data, callback) => {
  var token = data.headers.token;
  if (token) {
    _data.read("tokens", token, (err, tokenData) => {
      if (!err && tokenData) {
        if (tokenData.expires > Date.now()) {
          var userEmail = tokenData.email;

          _data.read("users", userEmail, function userCallback(err, userData) {
            if (!err && userData) {
              var cardToken =
                typeof cardToken == "string" && cardToken.trim().length > 0
                  ? cardToken.trim()
                  : "tok_visa";

              var cart = userData.cart;

              helpers.chargeCreditCard(cardToken, cart.cartTotal, function(
                stripeErr
              ) {
                if (!stripeErr) {
                  var orderId = helpers.generateToken(10);
                  orderId += `-${Date.now()}`;
                  var orderObject = {
                    orderId,
                    email: userEmail,
                    selctedItems: cart.selectedItems,
                    cartTotal: cart.cartTotal
                  };
                  _data.create(
                    "orders",
                    orderId,
                    orderObject,
                    function createOrder(err) {
                      if (!err && orderObject) {
                        delete userData.cart;
                        _data.update(
                          "users",
                          userEmail,
                          userData,
                          function updateUser(err) {
                            if (!err) {
                              callback(200, {
                                success: true,
                                message: "order created successfully"
                              });
                            } else {
                              callback(500, {
                                success: false,
                                error: "could not clear user  cart"
                              });
                            }
                          }
                        );
                        // send receipt
                      } else {
                        callback(500, {
                          success: false,
                          error: "could not create order"
                        });
                      }
                    }
                  );
                } else {
                  callback(400, {
                    success: false,
                    error: "error could not charge credit card"
                  });
                }
              });
            } else {
              callback(404, {
                success: false,
                error: "could not find the specied user"
              });
            }
          });
        } else {
          callback(403, {
            success: false,
            error: "token expired, please create another session"
          });
        }
      } else {
        callback(400, { success: false, error: "invalid token" });
      }
    });
  } else {
    callback(403, { success: false, error: "Missing token" });
  }
};

module.exports = orderHandler;
