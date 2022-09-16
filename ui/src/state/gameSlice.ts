import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export interface GameState {
  isStarted: boolean;
  isConnected: boolean;
  isGameOver: boolean;
  playerSize: number;
  playerPosition: number[][];
  foodPosition: number[];
  direction: string;
  nextDirection: string;
  score: number;
}

const initialState: GameState = {
  isStarted: false,
  isConnected: false,
  isGameOver: false,
  playerSize: 1,
  playerPosition: [[0, 0]],
  foodPosition: [-1, -1],
  direction: "south",
  nextDirection: "south",
  score: 0,
};

export const gameSlice = createSlice({
  name: "game",
  initialState,
  reducers: {
    setIsStarted: (state, action: PayloadAction<boolean>) => {
      state.isStarted = action.payload;
    },
    setIsConnected: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload;
    },
    setIsGameOver: (state, action: PayloadAction<boolean>) => {
      state.isGameOver = action.payload;
    },
    setPlayerSize: (state, action: PayloadAction<number>) => {
      state.playerSize = action.payload;
    },
    setPlayerPosition: (state, action: PayloadAction<number[][]>) => {
      state.playerPosition = action.payload;
    },
    setFoodPosition: (state, action: PayloadAction<number[]>) => {
      state.foodPosition = action.payload;
    },
    setDirection: (state, action: PayloadAction<string>) => {
      state.direction = action.payload;
    },
    setNextDirection: (state, action: PayloadAction<string>) => {
      state.nextDirection = action.payload;
    },
    setScore: (state, action: PayloadAction<number>) => {
      state.score = action.payload;
    },
  },
});

export const {
  setIsStarted,
  setIsConnected,
  setIsGameOver,
  setPlayerSize,
  setPlayerPosition,
  setFoodPosition,
  setDirection,
  setNextDirection,
  setScore,
} = gameSlice.actions;

export default gameSlice.reducer;
