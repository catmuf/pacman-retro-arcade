import { DIR_VECTORS, SCATTER_TARGETS } from './constants';
import { Direction, GhostType, Vector2D } from './types';

export interface PacmanState {
  tileX: number;
  tileY: number;
  dir: Direction;
}

export interface BlinkyState {
  tileX: number;
  tileY: number;
}

export function getGhostTargetTile(
  type: GhostType,
  pacman: PacmanState,
  blinky: BlinkyState | null,
  isScatter: boolean
): Vector2D {
  if (isScatter) {
    return SCATTER_TARGETS[type];
  }

  switch (type) {
    case 'BLINKY': {
      // Blinky targets Pacman's current tile directly
      return { x: pacman.tileX, y: pacman.tileY };
    }

    case 'PINKY': {
      // Pinky targets 4 tiles ahead of Pacman
      const pDirVec = DIR_VECTORS[pacman.dir] || { x: 0, y: 0 };
      if (pacman.dir === 'UP') {
        // Classic arcade overflow bug: 4 tiles up AND 4 tiles left
        return { x: pacman.tileX - 4, y: pacman.tileY - 4 };
      }
      return {
        x: pacman.tileX + pDirVec.x * 4,
        y: pacman.tileY + pDirVec.y * 4,
      };
    }

    case 'INKY': {
      // Inky targets based on Blinky's position and 2 tiles ahead of Pacman
      const pDirVec = DIR_VECTORS[pacman.dir] || { x: 0, y: 0 };
      let intermediateX = pacman.tileX + pDirVec.x * 2;
      let intermediateY = pacman.tileY + pDirVec.y * 2;
      if (pacman.dir === 'UP') {
        // Classic arcade offset bug
        intermediateX -= 2;
        intermediateY -= 2;
      }

      const blinkyX = blinky ? blinky.tileX : pacman.tileX;
      const blinkyY = blinky ? blinky.tileY : pacman.tileY;

      // Vector from Blinky to intermediate, doubled
      const targetX = intermediateX + (intermediateX - blinkyX);
      const targetY = intermediateY + (intermediateY - blinkyY);
      return { x: targetX, y: targetY };
    }

    case 'CLYDE': {
      // Default Clyde target (caller uses getClydeTarget for proximity check)
      return { x: pacman.tileX, y: pacman.tileY };
    }
  }
}

export function getClydeTarget(clydeTile: Vector2D, pacmanTile: Vector2D, isScatter: boolean): Vector2D {
  if (isScatter) return SCATTER_TARGETS.CLYDE;

  const dx = clydeTile.x - pacmanTile.x;
  const dy = clydeTile.y - pacmanTile.y;
  const distSq = dx * dx + dy * dy;

  // 8 tiles squared = 64
  if (distSq >= 64) {
    return { x: pacmanTile.x, y: pacmanTile.y };
  } else {
    return SCATTER_TARGETS.CLYDE;
  }
}

// Order of priority when distances are equal (UP > LEFT > DOWN > RIGHT)
export const TIE_BREAKER_DIRECTIONS: Direction[] = ['UP', 'LEFT', 'DOWN', 'RIGHT'];
