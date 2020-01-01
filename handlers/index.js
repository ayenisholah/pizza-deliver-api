const userHandler = require("./userHandlers");
const authHandler = require("./authHandlers");
const menuHandler = require("./menuHandlers");



/**
 * @func ping
 * @desc A function to help handle request to the "ping" endpoint.
 * This endpoint is basically to tell if the server is alive.
 *
 * @param {object} reqData The request data.
 * @param {function} callBack A callback to execute after the function is done.
 * The callback should recieve the status code as the first argument and the
 * result of creating the user as second argument.
 */
const ping = (data, callback) => {
  callback(200, { message: "I'm Alive" });
};

const notFound = (data, callBack) => {
  callBack(404, { error: "the requested route not found" });
};

module.exports = Object.assign(
  { ping, notFound },
  userHandler,
  authHandler,
  menuHandler
);
