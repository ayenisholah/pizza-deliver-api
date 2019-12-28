const handlers = {};

handlers.notFound = (data, callback) => {
  callback(404, { success: false, message: "invalid route" });
};

module.exports = handlers;
