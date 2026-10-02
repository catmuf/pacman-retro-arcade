export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'NONE';

export interface Vector2D {
  x: number;
  y: number;
}

export type GameState =
  | 'READY'
  | 'PLAYING'
  | 'PACMAN_DYING'
  | 'LEVEL_CLEAR'
  | 'GAME_OVER'
  | 'PAUSED';

export type GhostType = 'BLINKY' | 'PINKY' | 'INKY' | 'CLYDE';

export type GhostMode = 'CHASE' | 'SCATTER' | 'FRIGHTENED' | 'EATEN' | 'IN_HOUSE';

export enum TileType {
  EMPTY = 0,
  WALL = 1,
  PELLET = 2,
  ENERGIZER = 3,
  GHOST_DOOR = 4,
  GHOST_HOUSE = 5,
  TUNNEL = 6,
}

export type FruitType =
  | 'CHERRY'
  | 'STRAWBERRY'
  | 'PEACH'
  | 'APPLE'
  | 'MELON'
  | 'GALAXIAN'
  | 'BELL'
  | 'KEY';

export interface FruitInfo {
  type: FruitType;
  points: number;
  color: string;
  leafColor: string;
  name: string;
}

export interface ScorePopup {
  x: number;
  y: number;
  text: string;
  timer: number;
  color: string;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface GhostTarget {
  tileX: number;
  tileY: number;
}

export interface HighScoreEntry {
  name: string;
  score: number;
  date: string;
}
