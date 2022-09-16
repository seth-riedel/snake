const express = require("express");
const app = express();
const http = require("http");
const logger = require("./logger");
const getSocketEventHandlers = require("./socketEventHandlers");
const shared = require("./shared");

const Redis = require("ioredis");
const client = new Redis();

// client.on("error", (err) => console.log("Redis Client Error", err));

const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: { origin: "*" },
});

const socketEventHandlers = getSocketEventHandlers(io, client);

io.on("connection", (socket) => {
  shared.connectedCount++;
  logger.info(`a user connected, connected count: ${shared.connectedCount}`);

  for (const eventName in socketEventHandlers) {
    socket.on(eventName, socketEventHandlers[eventName]);
  }
});

server.listen(3111, () => {
  logger.info("listening on port 3111");
});
