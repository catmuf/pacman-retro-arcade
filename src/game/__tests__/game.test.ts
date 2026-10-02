import { describe, expect, it } from 'vitest';
import { getFruitForLevel, SCATTER_TARGETS, TILE_SIZE } from '../constants';
import { FruitManager } from '../fruit';
import { Ghost } from '../ghost';
import { getClydeTarget, getGhostTargetTile } from '../ghostAi';
import { GameMap } from '../map';
import { Pacman } from '../pacman';
import { ScoreManager } from '../score';
import { TileType } from '../types';

describe('Pac-Man Game Engine Tests', () => {
  describe('GameMap', () => {
    it('correctly initializes classic arcade grid and counts pellets', () => {
      const map = new GameMap();
      expect(map.totalPellets).toBe(244);
      expect(map.remainingPellets).toBe(244);
    });

    it('identifies walls, pellets, and ghost doors correctly', () => {
      const map = new GameMap();
      expect(map.getTile(0, 3)).toBe(TileType.WALL);
      expect(map.isWall(0, 3)).toBe(true);

      // Ghost house door
      expect(map.getTile(13, 15)).toBe(TileType.GHOST_DOOR);

      // Pacman cannot enter ghost door
      expect(map.isPassableForPacman(13, 15)).toBe(false);

      // Ghost can enter ghost door when eaten or in house
      expect(map.isPassableForGhost(13, 15, true, false)).toBe(true);
      expect(map.isPassableForGhost(13, 15, false, false)).toBe(false);
    });

    it('handles pellet consumption accurately', () => {
      const map = new GameMap();
      // Row 4 Col 1 has a regular pellet
      const result = map.eatPellet(1, 4);
      expect(result.atePellet).toBe(true);
      expect(result.isEnergizer).toBe(false);
      expect(map.remainingPellets).toBe(243);
      expect(map.getTile(1, 4)).toBe(TileType.EMPTY);

      // Eating again yields false
      const result2 = map.eatPellet(1, 4);
      expect(result2.atePellet).toBe(false);
    });

    it('handles energizer consumption', () => {
      const map = new GameMap();
      // Row 6 Col 1 has an energizer
      const result = map.eatPellet(1, 6);
      expect(result.atePellet).toBe(true);
      expect(result.isEnergizer).toBe(true);
      expect(map.remainingPellets).toBe(243);
    });
  });

  describe('Pacman Entity', () => {
    it('calculates tile coordinates correctly', () => {
      const pacman = new Pacman();
      pacman.x = 10 * TILE_SIZE + 8;
      pacman.y = 15 * TILE_SIZE + 8;
      expect(pacman.getTileX()).toBe(10);
      expect(pacman.getTileY()).toBe(15);
    });

    it('allows immediate 180-degree direction reversal', () => {
      const pacman = new Pacman();
      pacman.currentDir = 'RIGHT';
      pacman.setDesiredDirection('LEFT');
      expect(pacman.currentDir).toBe('LEFT');
    });
  });

  describe('Ghost AI Logic', () => {
    it('calculates Blinky direct targeting', () => {
      const pacman = { tileX: 10, tileY: 15, dir: 'RIGHT' as const };
      const target = getGhostTargetTile('BLINKY', pacman, null, false);
      expect(target).toEqual({ x: 10, y: 15 });
    });

    it('calculates Pinky 4-tile ambush targeting', () => {
      const pacmanRight = { tileX: 10, tileY: 15, dir: 'RIGHT' as const };
      const targetRight = getGhostTargetTile('PINKY', pacmanRight, null, false);
      expect(targetRight).toEqual({ x: 14, y: 15 });

      const pacmanUp = { tileX: 10, tileY: 15, dir: 'UP' as const };
      const targetUp = getGhostTargetTile('PINKY', pacmanUp, null, false);
      // Classic arcade overflow bug for UP: 4 tiles up AND 4 tiles left
      expect(targetUp).toEqual({ x: 6, y: 11 });
    });

    it('calculates Inky flanking vector targeting', () => {
      const pacman = { tileX: 10, tileY: 15, dir: 'RIGHT' as const };
      const blinky = { tileX: 8, tileY: 15 };
      // Intermediate (2 tiles ahead) = (12, 15)
      // Vector from blinky (8, 15) to (12, 15) = (4, 0)
      // Inky target = 12 + 4 = 16, 15
      const target = getGhostTargetTile('INKY', pacman, blinky, false);
      expect(target).toEqual({ x: 16, y: 15 });
    });

    it('calculates Clyde proximity behavior', () => {
      const pacman = { x: 10, y: 10 };
      // Clyde far away (dx=10, dy=0 => dist=10 >= 8) -> targets Pacman
      const targetFar = getClydeTarget({ x: 20, y: 10 }, pacman, false);
      expect(targetFar).toEqual({ x: 10, y: 10 });

      // Clyde close by (dx=3, dy=3 => dist=4.24 < 8) -> retreats to scatter corner
      const targetClose = getClydeTarget({ x: 13, y: 13 }, pacman, false);
      expect(targetClose).toEqual(SCATTER_TARGETS.CLYDE);
    });

    it('routes to scatter corners during scatter mode', () => {
      const pacman = { tileX: 10, tileY: 10, dir: 'LEFT' as const };
      expect(getGhostTargetTile('BLINKY', pacman, null, true)).toEqual(SCATTER_TARGETS.BLINKY);
      expect(getGhostTargetTile('PINKY', pacman, null, true)).toEqual(SCATTER_TARGETS.PINKY);
      expect(getGhostTargetTile('INKY', pacman, null, true)).toEqual(SCATTER_TARGETS.INKY);
      expect(getGhostTargetTile('CLYDE', pacman, null, true)).toEqual(SCATTER_TARGETS.CLYDE);
    });

    it('moves Blinky continuously along the maze over time without getting stuck', () => {
      const map = new GameMap();
      const pacman = new Pacman();
      const blinky = new Ghost('BLINKY');

      const startX = blinky.x;
      const startY = blinky.y;

      // Update over 1 second (60 frames)
      const dt = 1 / 60;
      for (let frame = 0; frame < 60; frame++) {
        blinky.update(dt, map, pacman, null, true, map.remainingPellets);
      }

      // Blinky should have moved significantly away from start position
      expect(blinky.x !== startX || blinky.y !== startY).toBe(true);
      expect(blinky.dir !== 'NONE').toBe(true);
    });

    it('emerges Pinky from ghost house when timer expires', () => {
      const map = new GameMap();
      const pacman = new Pacman();
      const pinky = new Ghost('PINKY');

      expect(pinky.mode).toBe('IN_HOUSE');

      // Update over 2 seconds
      const dt = 1 / 60;
      for (let frame = 0; frame < 120; frame++) {
        pinky.update(dt, map, pacman, null, true, map.remainingPellets);
      }

      // Pinky should have exited the house and be active in the maze
      expect(pinky.mode).toBe('CHASE');
    });

    it('revives eaten ghost when returning to house and re-emerges into maze', () => {
      const map = new GameMap();
      const pacman = new Pacman();
      const blinky = new Ghost('BLINKY');

      // Put Blinky in eaten mode near the top of the ghost house (e.g. col 13.5, row 11)
      blinky.x = 13.5 * TILE_SIZE + TILE_SIZE / 2;
      blinky.y = 11 * TILE_SIZE + TILE_SIZE / 2;
      blinky.dir = 'DOWN';
      blinky.eat();

      expect(blinky.mode).toBe('EATEN');

      // Update over 3 seconds (180 frames)
      const dt = 1 / 60;
      for (let frame = 0; frame < 180; frame++) {
        blinky.update(dt, map, pacman, null, false, map.remainingPellets);
      }

      // Blinky should have navigated down into house, revived, and emerged back into maze
      expect(blinky.mode).toBe('CHASE');
      expect(blinky.isExitingHouse).toBe(false);
    });
  });

  describe('ScoreManager', () => {
    it('awards points and calculates ghost eating combo multiplier chain', () => {
      const score = new ScoreManager();
      score.resetGame();

      // Normal pellet
      score.addPellet();
      expect(score.score).toBe(10);

      // Energizer
      score.addEnergizer();
      expect(score.score).toBe(60);

      // Ghost combo chain
      const g1 = score.addGhostEat();
      expect(g1.points).toBe(200);
      expect(score.score).toBe(260);

      const g2 = score.addGhostEat();
      expect(g2.points).toBe(400);
      expect(score.score).toBe(660);

      const g3 = score.addGhostEat();
      expect(g3.points).toBe(800);
      expect(score.score).toBe(1460);

      const g4 = score.addGhostEat();
      expect(g4.points).toBe(1600);
      expect(score.score).toBe(3060);
    });

    it('awards extra life at 10,000 points', () => {
      const score = new ScoreManager();
      score.resetGame();
      expect(score.lives).toBe(3);

      score.addPoints(9990);
      expect(score.lives).toBe(3);

      const earnedLife = score.addPoints(10);
      expect(earnedLife).toBe(true);
      expect(score.lives).toBe(4);

      // Should not re-award above 10,000
      const secondCheck = score.addPoints(500);
      expect(secondCheck).toBe(false);
      expect(score.lives).toBe(4);
    });
  });

  describe('FruitManager', () => {
    it('spawns fruit at 70 and 170 dots eaten', () => {
      const fruitMgr = new FruitManager();
      fruitMgr.reset(1);

      expect(fruitMgr.activeFruit).toBeNull();

      fruitMgr.onDotsChanged(69, 1);
      expect(fruitMgr.activeFruit).toBeNull();

      fruitMgr.onDotsChanged(70, 1);
      expect(fruitMgr.activeFruit).not.toBeNull();
      expect(fruitMgr.activeFruit?.name).toBe('Cherry');
      expect(fruitMgr.activeFruit?.points).toBe(100);
    });

    it('returns appropriate fruit type by level', () => {
      expect(getFruitForLevel(1).type).toBe('CHERRY');
      expect(getFruitForLevel(2).type).toBe('STRAWBERRY');
      expect(getFruitForLevel(3).type).toBe('PEACH');
      expect(getFruitForLevel(5).type).toBe('APPLE');
      expect(getFruitForLevel(7).type).toBe('MELON');
      expect(getFruitForLevel(9).type).toBe('GALAXIAN');
      expect(getFruitForLevel(11).type).toBe('BELL');
      expect(getFruitForLevel(13).type).toBe('KEY');
    });
  });
});
