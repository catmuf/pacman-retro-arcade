import { Direction, FruitInfo, GhostType, Vector2D } from './types';

// Board & Tile Dimensions
export const TILE_SIZE = 16;
export const MAP_COLS = 28;
export const MAP_ROWS = 36;
export const CANVAS_WIDTH = MAP_COLS * TILE_SIZE; // 448 px
export const CANVAS_HEIGHT = MAP_ROWS * TILE_SIZE; // 576 px

// Top and Bottom HUD offsets in tiles
export const TOP_OFFSET_ROWS = 3;
export const BOTTOM_OFFSET_ROWS = 2;
export const MAZE_ROWS = 31;

// Directions to Vector mapping
export const DIR_VECTORS: Record<Direction, Vector2D> = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
  NONE: { x: 0, y: 0 },
};

export const OPPOSITE_DIRECTIONS: Record<Direction, Direction> = {
  UP: 'DOWN',
  DOWN: 'UP',
  LEFT: 'RIGHT',
  RIGHT: 'LEFT',
  NONE: 'NONE',
};

// Base speeds (in pixels per second at 60 FPS)
export const PACMAN_NORMAL_SPEED = 80;
export const PACMAN_ENERGIZED_SPEED = 90;
export const GHOST_NORMAL_SPEED = 75;
export const GHOST_FRIGHTENED_SPEED = 45;
export const GHOST_TUNNEL_SPEED = 40;
export const GHOST_EATEN_SPEED = 160;

// Cruise Elroy speed boosts for Blinky
export const ELROY_1_SPEED = 82;
export const ELROY_2_SPEED = 88;
export const ELROY_1_DOTS = 20;
export const ELROY_2_DOTS = 10;

// Ghost Scatter Corner Targets (tile coordinates)
export const SCATTER_TARGETS: Record<GhostType, Vector2D> = {
  BLINKY: { x: 25, y: 0 },
  PINKY: { x: 2, y: 0 },
  INKY: { x: 27, y: 34 },
  CLYDE: { x: 0, y: 34 },
};

// Initial Home / Spawn positions (tile coordinates)
export const PACMAN_START_POS: Vector2D = { x: 13.5, y: 26 };
export const GHOST_START_POS: Record<GhostType, Vector2D> = {
  BLINKY: { x: 13.5, y: 14 },
  PINKY: { x: 13.5, y: 17 },
  INKY: { x: 11.5, y: 17 },
  CLYDE: { x: 15.5, y: 17 },
};

// Ghost Door & House Waypoints
export const GHOST_DOOR_TILE: Vector2D = { x: 13.5, y: 14 };
export const GHOST_HOUSE_CENTER: Vector2D = { x: 13.5, y: 17 };

// Colors
export const COLORS = {
  WALL_BLUE: '#2121ff',
  WALL_BORDER: '#8585ff',
  WALL_CLEAR_WHITE: '#ffffff',
  GATE_PINK: '#ffb8de',
  PELLET_YELLOW: '#ffb8ae',
  ENERGIZER_WHITE: '#ffb8ae',
  PACMAN_YELLOW: '#ffff00',
  BLINKY_RED: '#ff0000',
  PINKY_PINK: '#ffb8de',
  INKY_CYAN: '#00ffff',
  CLYDE_ORANGE: '#ffb851',
  FRIGHTENED_BLUE: '#1f38ff',
  FRIGHTENED_WHITE: '#ffffff',
  EYE_WHITE: '#ffffff',
  EYE_PUPIL: '#2121ff',
  TEXT_WHITE: '#ffffff',
  TEXT_YELLOW: '#ffff00',
  TEXT_RED: '#ff0000',
  TEXT_CYAN: '#00ffff',
};

// Point Values
export const PELLET_POINTS = 10;
export const ENERGIZER_POINTS = 50;
export const GHOST_EAT_POINTS = [200, 400, 800, 1600];
export const EXTRA_LIFE_SCORE = 10000;

// Fruit Metadata by level
export const FRUIT_TABLE: FruitInfo[] = [
  { type: 'CHERRY', points: 100, color: '#ff0000', leafColor: '#00cc00', name: 'Cherry' },
  { type: 'STRAWBERRY', points: 300, color: '#ff3366', leafColor: '#00cc00', name: 'Strawberry' },
  { type: 'PEACH', points: 500, color: '#ff9933', leafColor: '#00cc00', name: 'Peach' },
  { type: 'APPLE', points: 700, color: '#ee1111', leafColor: '#00cc00', name: 'Apple' },
  { type: 'MELON', points: 1000, color: '#66ff66', leafColor: '#00cc00', name: 'Melon' },
  { type: 'GALAXIAN', points: 2000, color: '#ffff00', leafColor: '#3366ff', name: 'Galaxian' },
  { type: 'BELL', points: 3000, color: '#ffff33', leafColor: '#3399ff', name: 'Bell' },
  { type: 'KEY', points: 5000, color: '#33ccff', leafColor: '#ffffff', name: 'Key' },
];

export function getFruitForLevel(level: number): FruitInfo {
  if (level <= 1) return FRUIT_TABLE[0];
  if (level === 2) return FRUIT_TABLE[1];
  if (level <= 4) return FRUIT_TABLE[2];
  if (level <= 6) return FRUIT_TABLE[3];
  if (level <= 8) return FRUIT_TABLE[4];
  if (level <= 10) return FRUIT_TABLE[5];
  if (level <= 12) return FRUIT_TABLE[6];
  return FRUIT_TABLE[7];
}

// Wave timers for Scatter / Chase per level
export interface WaveTiming {
  mode: 'SCATTER' | 'CHASE';
  duration: number; // in seconds
}

export function getWaveTimings(level: number): WaveTiming[] {
  if (level === 1) {
    return [
      { mode: 'SCATTER', duration: 7 },
      { mode: 'CHASE', duration: 20 },
      { mode: 'SCATTER', duration: 7 },
      { mode: 'CHASE', duration: 20 },
      { mode: 'SCATTER', duration: 5 },
      { mode: 'CHASE', duration: 20 },
      { mode: 'SCATTER', duration: 5 },
      { mode: 'CHASE', duration: Infinity },
    ];
  } else if (level <= 4) {
    return [
      { mode: 'SCATTER', duration: 7 },
      { mode: 'CHASE', duration: 20 },
      { mode: 'SCATTER', duration: 7 },
      { mode: 'CHASE', duration: 20 },
      { mode: 'SCATTER', duration: 5 },
      { mode: 'CHASE', duration: 1033 },
      { mode: 'SCATTER', duration: 0.01 },
      { mode: 'CHASE', duration: Infinity },
    ];
  } else {
    return [
      { mode: 'SCATTER', duration: 5 },
      { mode: 'CHASE', duration: 20 },
      { mode: 'SCATTER', duration: 5 },
      { mode: 'CHASE', duration: 20 },
      { mode: 'SCATTER', duration: 5 },
      { mode: 'CHASE', duration: 1037 },
      { mode: 'SCATTER', duration: 0.01 },
      { mode: 'CHASE', duration: Infinity },
    ];
  }
}

export function getFrightenedDuration(level: number): number {
  if (level === 1) return 6.0;
  if (level === 2) return 5.0;
  if (level === 3) return 4.0;
  if (level <= 5) return 3.0;
  if (level <= 8) return 2.0;
  if (level <= 12) return 1.0;
  return 0; // High levels: no blue time
}
