# About
This is a basic web implementation of the [classic snake game](https://en.wikipedia.org/wiki/Snake_(video_game_genre)) using websockets and Redis to persist and stream the game state to any number of viewers.

## Getting Started
- Ensure you have a compatible version of `node` and `npm` installed
- Run `npm install` or `yarn` inside the:
  - project root
  - `api` directory
  - `ui` directory
- Ensure [Docker](https://www.docker.com/) is installed and running

## Running the Project
From the project root, run `yarn start` or `npm run start` to run the project.
This will run Redis in a docker container, the API with Node, and the UI with `react-scripts`.

Next, visit http://localhost:3000 to play the game ("player" mode). You can open additional "watcher" browser tabs/windows at http://localhost:3000/?watch=1 to stream the game in real time.

Currently, only 1 "player" window is supported. Any number of "watcher" windows are supported. 
