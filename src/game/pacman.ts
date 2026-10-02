import {
  DIR_VECTORS,
  MAP_COLS,
  OPPOSITE_DIRECTIONS,
  PACMAN_NORMAL_SPEED,
  PACMAN_START_POS,
  TILE_SIZE,
} from './constants';
import { GameMap } from './map';
import { Direction, Vector2D } from './types';

export class Pacman {
  public x: number;
  public y: number;
  public currentDir: Direction = 'NONE';
  public nextDir: Direction = 'NONE';
  public speed: number = PACMAN_NORMAL_SPEED;
  public mouthAngle: number = 0.2;
  public mouthSpeed: number = 12;
  public mouthOpening: boolean = true;
  public deathProgress: number = 0; // 0 to 1
  public isDying: boolean = false;

  constructor() {
    this.x = PACMAN_START_POS.x * TILE_SIZE + TILE_SIZE / 2;
    this.y = PACMAN_START_POS.y * TILE_SIZE + TILE_SIZE / 2;
  }

  public reset(): void {
    this.x = PACMAN_START_POS.x * TILE_SIZE + TILE_SIZE / 2;
    this.y = PACMAN_START_POS.y * TILE_SIZE + TILE_SIZE / 2;
    this.currentDir = 'NONE';
    this.nextDir = 'NONE';
    this.speed = PACMAN_NORMAL_SPEED;
    this.mouthAngle = 0.2;
    this.mouthOpening = true;
    this.deathProgress = 0;
    this.isDying = false;
  }

  public getTileX(): number {
    return Math.floor(this.x / TILE_SIZE);
  }

  public getTileY(): number {
    return Math.floor(this.y / TILE_SIZE);
  }

  public setDesiredDirection(dir: Direction): void {
    this.nextDir = dir;
    // Immediate 180 reverse turnaround
    if (this.currentDir !== 'NONE' && OPPOSITE_DIRECTIONS[this.currentDir] === dir) {
      this.currentDir = dir;
    }
  }

  public update(dt: number, map: GameMap): void {
    if (this.isDying) {
      this.deathProgress = Math.min(1, this.deathProgress + dt * 0.8);
      return;
    }

    const currentTileX = this.getTileX();
    const currentTileY = this.getTileY();
    const tileCenterX = currentTileX * TILE_SIZE + TILE_SIZE / 2;
    const tileCenterY = currentTileY * TILE_SIZE + TILE_SIZE / 2;

    const cornerTolerance = 4.0; // Cornering pre-turn window in pixels

    // Try to apply nextDir if possible
    if (this.nextDir !== 'NONE' && this.nextDir !== this.currentDir) {
      const isNextHoriz = this.nextDir === 'LEFT' || this.nextDir === 'RIGHT';
      const isCurrVert = this.currentDir === 'UP' || this.currentDir === 'DOWN' || this.currentDir === 'NONE';

      if (isNextHoriz && isCurrVert) {
        // Turning horizontally from vertical movement: check if y is close to tile center
        if (Math.abs(this.y - tileCenterY) <= cornerTolerance) {
          const nextTargetTileX = currentTileX + DIR_VECTORS[this.nextDir].x;
          if (map.isPassableForPacman(nextTargetTileX, currentTileY)) {
            this.y = tileCenterY;
            this.currentDir = this.nextDir;
          }
        }
      } else if (!isNextHoriz && !isCurrVert) {
        // Turning vertically from horizontal movement: check if x is close to tile center
        if (Math.abs(this.x - tileCenterX) <= cornerTolerance) {
          const nextTargetTileY = currentTileY + DIR_VECTORS[this.nextDir].y;
          if (map.isPassableForPacman(currentTileX, nextTargetTileY)) {
            this.x = tileCenterX;
            this.currentDir = this.nextDir;
          }
        }
      }
    }

    if (this.currentDir === 'NONE') return;

    // Move in current direction
    const moveDist = this.speed * dt;
    const dirVec = DIR_VECTORS[this.currentDir];
    const newX = this.x + dirVec.x * moveDist;
    const newY = this.y + dirVec.y * moveDist;

    // Check forward movement obstacle
    const nextTileX = currentTileX + dirVec.x;
    const nextTileY = currentTileY + dirVec.y;
    const canMoveForward = map.isPassableForPacman(nextTileX, nextTileY);

    let moved = false;

    if (this.currentDir === 'LEFT') {
      if (canMoveForward || this.x - moveDist >= tileCenterX) {
        this.x = newX;
        moved = true;
      } else {
        this.x = tileCenterX;
      }
    } else if (this.currentDir === 'RIGHT') {
      if (canMoveForward || this.x + moveDist <= tileCenterX) {
        this.x = newX;
        moved = true;
      } else {
        this.x = tileCenterX;
      }
    } else if (this.currentDir === 'UP') {
      if (canMoveForward || this.y - moveDist >= tileCenterY) {
        this.y = newY;
        moved = true;
      } else {
        this.y = tileCenterY;
      }
    } else if (this.currentDir === 'DOWN') {
      if (canMoveForward || this.y + moveDist <= tileCenterY) {
        this.y = newY;
        moved = true;
      } else {
        this.y = tileCenterY;
      }
    }

    // Tunnel wrap logic (Row 17)
    if (currentTileY === 17) {
      if (this.x < -TILE_SIZE / 2) {
        this.x = MAP_COLS * TILE_SIZE + TILE_SIZE / 2;
      } else if (this.x > MAP_COLS * TILE_SIZE + TILE_SIZE / 2) {
        this.x = -TILE_SIZE / 2;
      }
    }

    // Mouth animation update
    if (moved) {
      if (this.mouthOpening) {
        this.mouthAngle += this.mouthSpeed * dt;
        if (this.mouthAngle >= 0.55) {
          this.mouthAngle = 0.55;
          this.mouthOpening = false;
        }
      } else {
        this.mouthAngle -= this.mouthSpeed * dt;
        if (this.mouthAngle <= 0.05) {
          this.mouthAngle = 0.05;
          this.mouthOpening = true;
        }
      }
    }
  }

  public getCenter(): Vector2D {
    return { x: this.x, y: this.y };
  }
}
