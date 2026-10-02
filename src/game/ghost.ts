import {
  DIR_VECTORS,
  ELROY_1_DOTS,
  ELROY_1_SPEED,
  ELROY_2_DOTS,
  ELROY_2_SPEED,
  GHOST_DOOR_TILE,
  GHOST_EATEN_SPEED,
  GHOST_FRIGHTENED_SPEED,
  GHOST_HOUSE_CENTER,
  GHOST_NORMAL_SPEED,
  GHOST_START_POS,
  GHOST_TUNNEL_SPEED,
  MAP_COLS,
  OPPOSITE_DIRECTIONS,
  TILE_SIZE,
} from './constants';
import { getClydeTarget, getGhostTargetTile, TIE_BREAKER_DIRECTIONS } from './ghostAi';
import { GameMap } from './map';
import { Pacman } from './pacman';
import { Direction, GhostMode, GhostType, Vector2D } from './types';

export class Ghost {
  public type: GhostType;
  public x: number = 0;
  public y: number = 0;
  public dir: Direction = 'NONE';
  public mode: GhostMode = 'IN_HOUSE';
  public previousMode: GhostMode = 'SCATTER';
  public targetTile: Vector2D = { x: 0, y: 0 };
  public frightenedTimer: number = 0;
  public frightenedDuration: number = 6.0;
  public isFlashing: boolean = false;
  public houseBobDirection: number = 1; // 1 = down, -1 = up
  public houseTimer: number = 0;
  public dotsRequiredToExit: number = 0;
  public isExitingHouse: boolean = false;
  public animationTick: number = 0;

  constructor(type: GhostType) {
    this.type = type;
    this.reset();
  }

  public reset(): void {
    const start = GHOST_START_POS[this.type];
    this.x = start.x * TILE_SIZE + TILE_SIZE / 2;
    this.y = start.y * TILE_SIZE + TILE_SIZE / 2;
    this.frightenedTimer = 0;
    this.isFlashing = false;
    this.animationTick = 0;
    this.isExitingHouse = false;
    this.houseBobDirection = 1;

    if (this.type === 'BLINKY') {
      this.mode = 'SCATTER';
      this.dir = 'LEFT';
      this.dotsRequiredToExit = 0;
    } else if (this.type === 'PINKY') {
      this.mode = 'IN_HOUSE';
      this.dir = 'DOWN';
      this.dotsRequiredToExit = 0;
      this.houseTimer = 0.5; // Leaves shortly
    } else if (this.type === 'INKY') {
      this.mode = 'IN_HOUSE';
      this.dir = 'UP';
      this.dotsRequiredToExit = 30;
      this.houseTimer = 3.0;
    } else {
      // CLYDE
      this.mode = 'IN_HOUSE';
      this.dir = 'UP';
      this.dotsRequiredToExit = 60;
      this.houseTimer = 6.0;
    }
  }

  public getTileX(): number {
    return Math.floor(this.x / TILE_SIZE);
  }

  public getTileY(): number {
    return Math.floor(this.y / TILE_SIZE);
  }

  public setFrightened(duration: number): void {
    if (this.mode === 'EATEN' || this.mode === 'IN_HOUSE') return;
    if (duration <= 0) return;

    if (this.mode !== 'FRIGHTENED') {
      this.previousMode = this.mode;
      // Reverse direction on frightened trigger
      if (this.dir !== 'NONE') {
        this.dir = OPPOSITE_DIRECTIONS[this.dir];
      }
    }

    this.mode = 'FRIGHTENED';
    this.frightenedDuration = duration;
    this.frightenedTimer = duration;
    this.isFlashing = false;
  }

  public eat(): void {
    this.mode = 'EATEN';
    this.frightenedTimer = 0;
    this.isFlashing = false;
  }

  public update(
    dt: number,
    map: GameMap,
    pacman: Pacman,
    blinky: Ghost | null,
    globalScatter: boolean,
    remainingPellets: number
  ): void {
    this.animationTick += dt * 8;

    // Frightened timer countdown
    if (this.mode === 'FRIGHTENED') {
      this.frightenedTimer -= dt;
      this.isFlashing = this.frightenedTimer <= 2.0 && Math.floor(this.frightenedTimer * 4) % 2 === 0;
      if (this.frightenedTimer <= 0) {
        this.mode = this.previousMode === 'SCATTER' ? 'SCATTER' : 'CHASE';
        this.isFlashing = false;
      }
    }

    // In-house behavior
    if (this.mode === 'IN_HOUSE') {
      this.updateInHouse(dt, remainingPellets);
      return;
    }

    // Speed calculation
    const speed = this.calculateSpeed(map, remainingPellets);

    // If ghost is eaten, path towards door tile (13.5, 14) then descend into house
    if (this.mode === 'EATEN') {
      const doorPixelX = 13.5 * TILE_SIZE + TILE_SIZE / 2;
      const doorPixelY = 14 * TILE_SIZE + TILE_SIZE / 2;
      const houseCenterY = GHOST_HOUSE_CENTER.y * TILE_SIZE + TILE_SIZE / 2;

      // Check if entering or descending into the house
      if (
        Math.abs(this.x - doorPixelX) < 4 &&
        this.y >= doorPixelY - 2 &&
        this.y < houseCenterY
      ) {
        // Force straight descent down through door into house center
        this.x = doorPixelX;
        this.y += speed * dt;
        this.dir = 'DOWN';

        if (this.y >= houseCenterY) {
          // Revived in house!
          this.y = houseCenterY;
          this.mode = 'IN_HOUSE';
          this.dir = 'UP';
          this.isExitingHouse = true;
        }
        return;
      }

      this.targetTile = { x: GHOST_DOOR_TILE.x, y: GHOST_DOOR_TILE.y };
    } else {
      // Calculate target tile
      const isScatter = this.mode === 'SCATTER' || (this.mode !== 'FRIGHTENED' && globalScatter);
      if (this.type === 'CLYDE') {
        this.targetTile = getClydeTarget(
          { x: this.getTileX(), y: this.getTileY() },
          { x: pacman.getTileX(), y: pacman.getTileY() },
          isScatter
        );
      } else {
        this.targetTile = getGhostTargetTile(
          this.type,
          {
            tileX: pacman.getTileX(),
            tileY: pacman.getTileY(),
            dir: pacman.currentDir,
          },
          blinky
            ? { tileX: blinky.getTileX(), tileY: blinky.getTileY() }
            : null,
          isScatter
        );
      }
    }

    this.moveGhost(dt, speed, map);
  }

  private updateInHouse(dt: number, remainingPellets: number): void {
    this.houseTimer -= dt;
    const initialDots = 244;
    const dotsEaten = initialDots - remainingPellets;

    // Check if ready to leave
    if (dotsEaten >= this.dotsRequiredToExit || this.houseTimer <= 0) {
      this.isExitingHouse = true;
    }

    if (!this.isExitingHouse) {
      // Bob up and down in house
      const bobSpeed = 30;
      const minY = 16.5 * TILE_SIZE;
      const maxY = 17.5 * TILE_SIZE;

      this.y += this.houseBobDirection * bobSpeed * dt;
      if (this.y <= minY) {
        this.y = minY;
        this.houseBobDirection = 1;
        this.dir = 'DOWN';
      } else if (this.y >= maxY) {
        this.y = maxY;
        this.houseBobDirection = -1;
        this.dir = 'UP';
      }
    } else {
      const exitSpeed = 50;
      // Move towards center column (13.5)
      const centerX = 13.5 * TILE_SIZE + TILE_SIZE / 2;
      if (Math.abs(this.x - centerX) > 1.5) {
        this.x += (centerX > this.x ? 1 : -1) * exitSpeed * dt;
        this.dir = centerX > this.x ? 'RIGHT' : 'LEFT';
      } else {
        this.x = centerX;
        // Move up through the door to row 14
        this.y -= exitSpeed * dt;
        this.dir = 'UP';

        if (this.y <= 14 * TILE_SIZE + TILE_SIZE / 2) {
          this.y = 14 * TILE_SIZE + TILE_SIZE / 2;
          this.mode = 'CHASE';
          this.dir = 'LEFT';
          this.isExitingHouse = false;
        }
      }
    }
  }

  private calculateSpeed(_map: GameMap, remainingPellets: number): number {
    if (this.mode === 'EATEN') return GHOST_EATEN_SPEED;
    if (this.mode === 'FRIGHTENED') return GHOST_FRIGHTENED_SPEED;

    const tileX = this.getTileX();
    const tileY = this.getTileY();

    // Slow down in tunnel row 17
    if (tileY === 17 && (tileX <= 5 || tileX >= 22)) {
      return GHOST_TUNNEL_SPEED;
    }

    // Blinky Cruise Elroy speeds
    if (this.type === 'BLINKY') {
      if (remainingPellets <= ELROY_2_DOTS) return ELROY_2_SPEED;
      if (remainingPellets <= ELROY_1_DOTS) return ELROY_1_SPEED;
    }

    return GHOST_NORMAL_SPEED;
  }

  private moveGhost(dt: number, speed: number, map: GameMap): void {
    const moveDist = speed * dt;
    const currentTileX = this.getTileX();
    const currentTileY = this.getTileY();
    const tileCenterX = currentTileX * TILE_SIZE + TILE_SIZE / 2;
    const tileCenterY = currentTileY * TILE_SIZE + TILE_SIZE / 2;

    // Check if crossing tile center to make a turn decision
    const dirVec = DIR_VECTORS[this.dir] || { x: 0, y: 0 };
    const prevRelX = this.x - tileCenterX;
    const prevRelY = this.y - tileCenterY;

    this.x += dirVec.x * moveDist;
    this.y += dirVec.y * moveDist;

    const newRelX = this.x - tileCenterX;
    const newRelY = this.y - tileCenterY;

    let crossedCenter = false;

    if (this.dir === 'LEFT') {
      if (prevRelX > 0 && newRelX <= 0) {
        crossedCenter = true;
      }
    } else if (this.dir === 'RIGHT') {
      if (prevRelX < 0 && newRelX >= 0) {
        crossedCenter = true;
      }
    } else if (this.dir === 'UP') {
      if (prevRelY > 0 && newRelY <= 0) {
        crossedCenter = true;
      }
    } else if (this.dir === 'DOWN') {
      if (prevRelY < 0 && newRelY >= 0) {
        crossedCenter = true;
      }
    }

    if (crossedCenter || this.dir === 'NONE') {
      // Snap to tile center for clean turn
      this.x = tileCenterX;
      this.y = tileCenterY;

      // Choose next direction
      this.dir = this.chooseNextDirection(currentTileX, currentTileY, map);
    }

    // Tunnel wrap
    if (currentTileY === 17) {
      if (this.x < -TILE_SIZE / 2) {
        this.x = MAP_COLS * TILE_SIZE + TILE_SIZE / 2;
      } else if (this.x > MAP_COLS * TILE_SIZE + TILE_SIZE / 2) {
        this.x = -TILE_SIZE / 2;
      }
    }
  }

  private chooseNextDirection(tileX: number, tileY: number, map: GameMap): Direction {
    const legalDirs: Direction[] = [];
    const isEaten = this.mode === 'EATEN';

    // Test candidate directions
    for (const testDir of TIE_BREAKER_DIRECTIONS) {
      // Never turn 180 degrees back
      if (this.dir !== 'NONE' && OPPOSITE_DIRECTIONS[this.dir] === testDir) {
        continue;
      }

      const vec = DIR_VECTORS[testDir];
      const nextTileX = tileX + vec.x;
      const nextTileY = tileY + vec.y;

      if (map.isPassableForGhost(nextTileX, nextTileY, isEaten)) {
        // Classic restriction: ghosts cannot turn UP at specific tiles unless frightened or eaten
        if (
          testDir === 'UP' &&
          !isEaten &&
          this.mode !== 'FRIGHTENED' &&
          ((tileY === 11 && (tileX === 12 || tileX === 15)) ||
            (tileY === 23 && (tileX === 12 || tileX === 15)))
        ) {
          continue;
        }

        legalDirs.push(testDir);
      }
    }

    if (legalDirs.length === 0) {
      // Fallback: reverse if trapped
      return this.dir !== 'NONE' ? OPPOSITE_DIRECTIONS[this.dir] : 'LEFT';
    }

    if (this.mode === 'FRIGHTENED') {
      // Pick random legal direction
      const randomIndex = Math.floor(Math.random() * legalDirs.length);
      return legalDirs[randomIndex];
    }

    // Pick direction minimizing Euclidean distance squared to target tile
    let bestDir = legalDirs[0];
    let minDistanceSq = Infinity;

    for (const d of legalDirs) {
      const vec = DIR_VECTORS[d];
      const nextTileX = tileX + vec.x;
      const nextTileY = tileY + vec.y;

      const dx = nextTileX - this.targetTile.x;
      const dy = nextTileY - this.targetTile.y;
      const distSq = dx * dx + dy * dy;

      if (distSq < minDistanceSq) {
        minDistanceSq = distSq;
        bestDir = d;
      }
    }

    return bestDir;
  }

  public getCenter(): Vector2D {
    return { x: this.x, y: this.y };
  }
}
