const pickBy = require("lodash/pickBy");
const logger = require("./logger");
const shared = require("./shared");

const getSocketEventHandlers = (io, client) => ({
  disconnect: () => {
    shared.connectedCount--;
    logger.info(`user disconnected, connected count: ${shared.connectedCount}`);
  },
  playStart: async (data) => {
    logger.info(`playStart received: ${JSON.stringify(data)}`);
    await client.set("playing", 1);
    await client.del("position");
    await client.hmset("position", data);
  },
  gameover: async () => {
    logger.info("gameover received");

    await client.set("gameover", 1);
    await client.set("playing", 0);

    io.emit("gameover");
  },
  setPosition: async (data) => {
    logger.debug(`position data received: ${JSON.stringify(data)}`);

    // remove values set to 0
    const keysToDelete = Object.keys(data.position).filter((key) => data.position[key] === 0);
    console.log('keysToDelete', keysToDelete)
    if (keysToDelete.length) {
      await client.hdel("position", keysToDelete);
    }

    // add values that are set to 1
    console.log('before filter 1', data)
    console.log('before filter', data.position)
    console.log('setting position', pickBy(data.position, (value) => value === 1))
    await client.hmset(
      "position",
      pickBy(data.position, (value) => value === 1)
    );

    // set or remove food
    if (data.food) {
      console.log('setting food position', data.food);
      await client.set("food", data.food);
    } else {
      await client.del("food");
    }

    // update score
    await client.set("score", data.score);

    // get full object out and broadcast to connected clients
    const results = await client.hgetall("position");
    io.emit("positionChanged", {
      position: results,
      food: data.food,
      score: data.score,
    });
  },
});

module.exports = getSocketEventHandlers;
