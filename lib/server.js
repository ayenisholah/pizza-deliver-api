/**
 * Server related task
 */

const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");
const url = require("url");
const StringDecoder = require("string_decoder").StringDecoder;
const config = require("./config");
const helpers = require("./helpers");
const handlers = require("../handlers");

const server = {};

server.httpServer = http.createServer((req, res) => {
  server.unifiedServer(req, res);
});

server.httpsServerOptions = {
  key: fs.readFileSync(path.join(__dirname, "/../https/key.pem")),
  cert: fs.readFileSync(path.join(__dirname, "/../https/cert.pem"))
};

server.httpsServer = https.createServer(
  server.httpsServerOptions,
  (req, res) => {
    server.unifiedServer(req, res);
  }
);

// All the server logic for both http and https server
server.unifiedServer = (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  const trimmedPath = path.replace(/^\/+|\/+$/g, "");
  const queryString = parsedUrl.query;
  const decoder = new StringDecoder("utf-8");
  const method = req.method.toLowerCase();
  const headers = req.headers;
  let buffer = "";

  req.on("data", data => {
    buffer += decoder.write(data);
  });

  req.on("end", () => {
    buffer += decoder.end();

    let chosenHandler =
      server.router[method] && server.router[method](trimmedPath)
        ? server.router[method](trimmedPath)
        : handlers.notFound;

    const data = {
      trimmedPath,
      queryString,
      method,
      headers,
      payload: helpers.parseJsonToObject(buffer)
    };

    chosenHandler(data, (statusCode, payload) => {
      statusCode = typeof statusCode == "number" ? statusCode : 200;
      payload = typeof payload == "object" ? payload : {};

      const payloadString = JSON.stringify(payload);

      res.setHeader("Content-Type", "application/json");
      res.writeHead(statusCode);
      res.end(payloadString);
      console.log("Returning this response", statusCode, payloadString);
    });
  });
};

server.router = {
  get: route => {
    switch (route) {
      case "menu":
        return handlers.getMenuItems;
      case "users":
        return handlers.getUser;
      case "account/create":
        return handlers.accountCreate;
      case "account/edit":
        return handlers.accountEdit;
      case "session/create":
        return handlers.sessionCreate;
      case "session/deleted":
        return handlers.sessionDeleted;
      case "order/create":
        return handlers.orderCreated;
    }
  },
  post: route => {
    switch (route) {
      case "ping":
        return handlers.ping;
      case "api/users":
        return handlers.createUser;
      case "api/login":
        return handlers.login;
      case "api/logout":
        return handlers.logout;
      case "api/order":
        return handlers.createOrder;
    }
  },
  put: route => {
    switch (route) {
      case "users":
        return handlers.editUser;
    }
  },
  delete: route => {
    switch (route) {
      case "users/delete":
        return handlers.deleteUser;
    }
  }
};

server.init = () => {
  server.httpServer.listen(config.httpPort, () => {
    console.log(
      "\x1b[36m%s\x1b[0m",
      `Magic happening on ${config.httpPort} in ${config.envName} mode`
    );
  });

  server.httpsServer.listen(config.httpsPort, () => {
    console.log(
      "\x1b[36m%s\x1b[0m",
      `Magic happening on ${config.httpsPort} in ${config.envName} mode`
    );
  });
};

module.exports = server;
