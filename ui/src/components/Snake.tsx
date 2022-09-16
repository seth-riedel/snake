import { useEffect } from "react";
import classnames from "classnames";
import { useStore, useSelector, useDispatch } from "react-redux";
import io from 'socket.io-client';
import { RootState } from "../state/store";
import {
  setIsStarted,
  setIsConnected,
  setIsGameOver,
  setPlayerSize,
  setPlayerPosition,
  setFoodPosition,
  setDirection,
  setNextDirection,
  setScore,
  GameState,
} from "../state/gameSlice";

import "./snake.css";

const width = 20;
const height = 20;

const ButtonArea = ({
  playMode,
  isStarted,
  handleStart,
}: {
  playMode: boolean;
  isStarted: boolean;
  handleStart: () => void;
}) => {
  if (playMode) {
    if (isStarted) {
      return null;
    }
    return <button onClick={handleStart}>Start Game</button>;
  }
  return null;
};

const calculateNextPosition = (direction: string, currentPosition: any) => {
  switch (direction) {
    case "south":
      return [currentPosition[0], currentPosition[1] + 1];
    case "north":
      return [currentPosition[0], currentPosition[1] - 1];
    case "east":
      return [currentPosition[0] + 1, currentPosition[1]];
    case "west":
      return [currentPosition[0] - 1, currentPosition[1]];
    default:
      return currentPosition;
  }
};

function getRandomInt(max: number) {
  return Math.floor(Math.random() * max);
}

const arrowMappings = {
  38: "north",
  40: "south",
  37: "west",
  39: "east",
};
const directionOpposites: any = {
  north: "south",
  south: "north",
  east: "west",
  west: "east",
};

const pointsPerItem = 25;

type Coords = number[];
const initialPlayerPosition = [[0, 0]];
const initialDirection = "south";

let socket: any;

const translateCoordsToBitOffset = (prevData: Coords[], data: Coords[]) => {
  // console.log("Translate:");
  // console.log(JSON.stringify(prevData));
  // console.log(JSON.stringify(data));

  const newValues = data.filter(
    ([x, y]) => !prevData.find(([px, py]) => px === x && py === y)
  );
  const removedValues = prevData.filter(
    ([x, y]) => !data.find(([px, py]) => px === x && py === y)
  );

  return {
    ...newValues.reduce((all, [x, y]) => ({ ...all, [`${x}:${y}`]: 1 }), {}),
    ...removedValues.reduce(
      (all, [x, y]) => ({ ...all, [`${x}:${y}`]: 0 }),
      {}
    ),
  };
};

const Snake = () => {
  const store = useStore();
  const dispatch = useDispatch();
  const playMode = !window.location.href.includes("watch=1");

  const isStarted = useSelector((state: RootState) => state.game.isStarted);
  const playerPosition = useSelector(
    (state: RootState) => state.game.playerPosition
  );
  const playerSize = useSelector((state: RootState) => state.game.playerSize);
  const foodPosition = useSelector(
    (state: RootState) => state.game.foodPosition
  );
  const score = useSelector((state: RootState) => state.game.score);
  const isGameOver = useSelector((state: RootState) => state.game.isGameOver);

  let intervalId: any;
  let justAte = false;
  let foodTimeout: any;

  const spawnFood = () => {
    foodTimeout = null;
    let pos: number[];
    do {
      pos = [getRandomInt(width), getRandomInt(height)];
    } while (playerPosition.find(([x, y]) => x === pos[0] && y === pos[1]));
    dispatch(setFoodPosition(pos));
  };

  const gameover = () => {
    socket?.emit("gameover");
    if (intervalId) {
      clearInterval(intervalId);
    }
    dispatch(setIsStarted(false));
    dispatch(setIsGameOver(true));
  };

  const startGame = () => {
    dispatch(setIsGameOver(false));
    dispatch(setIsStarted(true));
    dispatch(setPlayerPosition(initialPlayerPosition));
    dispatch(setDirection(initialDirection));
    dispatch(setPlayerSize(1));

    const state = store.getState() as unknown as { game: GameState };
    const { playerSize, playerPosition, direction } = state.game;
    console.log("STATE", state);

    intervalId = setInterval(() => {
      const state = store.getState() as unknown as { game: GameState };
      const {
        playerSize,
        playerPosition,
        foodPosition,
        direction,
        nextDirection,
        score,
      } = state.game;
      const currentActivePlayerPositions = playerPosition.slice(
        playerPosition.length - playerSize
      );

      const newHeadPosition = calculateNextPosition(
        nextDirection,
        playerPosition[playerPosition.length - 1]
      );

      // check for collision
      if (
        newHeadPosition[0] < 0 ||
        newHeadPosition[0] >= width ||
        newHeadPosition[1] < 0 ||
        newHeadPosition[1] >= height ||
        (
          playerSize > 1
          && playerPosition.find(
            ([x, y]) => x === newHeadPosition[0] && y === newHeadPosition[1]
          )
        )) {
        gameover();
        return;
      }

      // update position if it changed since the last interval run
      if (direction !== nextDirection) {
        dispatch(setDirection(nextDirection));
      }

      // check for item consumption
      if (
        newHeadPosition[0] === foodPosition[0] &&
        newHeadPosition[1] === foodPosition[1]
      ) {
        justAte = true;
        dispatch(setFoodPosition([-1, -1]));
        dispatch(setPlayerSize(playerSize + 1));
        dispatch(setScore(score + pointsPerItem));
      }

      let newPlayerPosition = [...playerPosition];
      if (justAte) {
        setTimeout(spawnFood, 1100);
      } else if (playerPosition.length > playerSize) {
        newPlayerPosition.shift();
      }
      newPlayerPosition.push(newHeadPosition)

      // broadcast updated position and board status
      dispatch(setPlayerPosition([...newPlayerPosition]));
      console.log('currentActivePlayerPositions', currentActivePlayerPositions)
      console.log('newPlayerPosition', newPlayerPosition)
      socket?.emit("setPosition", {
        position: translateCoordsToBitOffset(
          currentActivePlayerPositions,
          newPlayerPosition.slice(newPlayerPosition.length - playerSize)
        ),
        score: score,
        food:
          !justAte && foodPosition[0] > -1
            ? `${foodPosition[0]}-${foodPosition[1]}`
            : null,
      });

      justAte = false;
    }, 200);

    // bind arrow event handlers
    document.onkeydown = (e) => {
      // @ts-ignore
      if (arrowMappings[e.keyCode as any]) {
        // @ts-ignore
        const newDirection: string = arrowMappings[e.keyCode];

        if (playerSize > 1 && newDirection === directionOpposites[direction]) {
          console.log("Invalid direction change specified", newDirection);
        } else {
          console.log("Changing direction to " + newDirection);
          dispatch(setNextDirection(newDirection));
        }
      }
    };

    // start game
    console.log("start", playerPosition, initialPlayerPosition);

    const currentActivePlayerPositions = playerPosition.slice(
      playerPosition.length - playerSize
    );
    const formattedData = currentActivePlayerPositions.reduce(
      (all, [x, y]) => ({ ...all, [`${x}:${y}`]: 1 }),
      {}
    );
    console.log("play start", formattedData);
    socket?.emit("playStart", formattedData);

    // spawn item
    spawnFood();
  };

  // startup
  useEffect(() => {
    console.log("useEffect!");
    // open ws to stream changes
    console.log("opening socket...");
    // @ts-ignore
    socket = io("http://localhost:3111");
    console.log("opened socket");

    socket.on("connect", () => {
      setIsConnected(true);
      console.log("connected!");

      socket.emit("foo", "bar");
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
      console.log("disconnected");
    });

    socket.on("gameover", () => {
      if (playMode) {
        return;
      }

      setIsStarted(false);
      dispatch(setIsGameOver(true));
    });

    socket.on("positionChanged", (allData: any) => {
      if (playMode) {
        return;
      }

      console.log("got data", allData);
      const data = allData.position;

      // food
      if (!allData.food) {
        dispatch(setFoodPosition([-1, -1]));
      } else {
        const [x, y] = allData.food.split(/-/);
        dispatch(setFoodPosition([parseInt(x, 10), parseInt(y, 10)]));
      }
      const newData: Coords[] = Object.keys(data)
        .filter((key) => parseInt(data[key]) === 1)
        .map((key) => {
          const [x, y] = key.split(":");
          return [parseInt(x, 10), parseInt(y, 10)];
        })
        .filter((item) => item);
      dispatch(setPlayerPosition(newData));
      dispatch(setPlayerSize(newData.length));

      // score update
      dispatch(setScore(parseInt(allData.score, 10)));
    });

    return () => {
      console.log("UNMOUNT");
      if (socket) {
        socket.close();
      }
    };
  }, []);

  const activePlayerPositions = playerPosition.slice(
    playerPosition.length - playerSize
  );

  // console.log("activePlayerPositions", activePlayerPositions);

  const rows = [];
  for (let y = 0; y < height; y++) {
    const cols = [];
    for (let x = 0; x < width; x++) {
      cols.push(
        <div
          key={`${x}-${y}`}
          className={classnames({ tile: true, first: x === 0 })}
        >
          <>
            {activePlayerPositions.find(
              (pos) => pos[0] === x && pos[1] === y
            ) ? (
              <div className="player" />
            ) : null}
            {foodPosition[0] === x && foodPosition[1] === y ? (
              <div className="item" />
            ) : null}
          </>
        </div>
      );
    }
    rows.push(
      <div key={y} className="row">
        {cols}
      </div>
    );
  }

  // console.log("RENDER", playerSize, JSON.stringify(playerPosition));
  return (
    <>
      <div className="snake">{rows}</div>
      <br />
      <ButtonArea
        playMode={playMode}
        isStarted={isStarted}
        handleStart={() => {
          startGame();
        }}
      />
      <br />
      <div>Score: {score}</div>
      {isGameOver ? <div>Game over!</div> : null}
    </>
  );
};

export default Snake;
