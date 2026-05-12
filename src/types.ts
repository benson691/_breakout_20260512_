/**
 * Game Types for Breakout
 */

export interface Point {
  x: number;
  y: number;
}

export interface Velocity {
  dx: number;
  dy: number;
}

export interface Ball extends Point, Velocity {
  radius: number;
  color: string;
}

export interface Paddle extends Point {
  width: number;
  height: number;
  color: string;
}

export interface Brick extends Point {
  width: number;
  height: number;
  color: string;
  points: number;
  isDestroyed: boolean;
  strength: number; // For multi-hit bricks
}

export enum GameStatus {
  START = 'START',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  GAMEOVER = 'GAMEOVER',
  WON = 'WON'
}

export interface GameState {
  score: number;
  lives: number;
  status: GameStatus;
  level: number;
}
