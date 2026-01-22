
export interface Walls {
  top: boolean;
  right: boolean;
  bottom: boolean;
  left: boolean;
}

export interface Cell {
  r: number;
  c: number;
  walls: Walls;
  visited: boolean;
}

export interface Position {
  r: number;
  c: number;
}

export enum GameStatus {
  START = 'START',
  PLAYING = 'PLAYING',
  WON = 'WON',
  GAMEOVER = 'GAMEOVER'
}

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
