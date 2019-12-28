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

  res.end("I'm Alive");
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

server.router = {};

module.exports = server;
