import { getFruitForLevel, TILE_SIZE } from './constants';
import { FruitInfo, ScorePopup, Vector2D } from './types';

export class FruitManager {
  public activeFruit: FruitInfo | null = null;
  public fruitTile: Vector2D = { x: 13.5, y: 20 };
  public fruitTimer: number = 0;
  public firstSpawned: boolean = false;
  public secondSpawned: boolean = false;
  public scorePopups: ScorePopup[] = [];

  constructor() {
    this.reset(1);
  }

  public reset(_level: number = 1): void {
    this.activeFruit = null;
    this.fruitTimer = 0;
    this.firstSpawned = false;
    this.secondSpawned = false;
    this.scorePopups = [];
  }

  public onDotsChanged(dotsEaten: number, level: number): void {
    if (!this.firstSpawned && dotsEaten >= 70) {
      this.spawnFruit(level);
      this.firstSpawned = true;
    } else if (!this.secondSpawned && dotsEaten >= 170) {
      this.spawnFruit(level);
      this.secondSpawned = true;
    }
  }

  private spawnFruit(level: number): void {
    this.activeFruit = getFruitForLevel(level);
    this.fruitTimer = 9.5; // Active for ~9.5 seconds
  }

  public update(dt: number): void {
    if (this.activeFruit) {
      this.fruitTimer -= dt;
      if (this.fruitTimer <= 0) {
        this.activeFruit = null;
      }
    }

    // Update floating score popups
    for (let i = this.scorePopups.length - 1; i >= 0; i--) {
      this.scorePopups[i].timer -= dt;
      if (this.scorePopups[i].timer <= 0) {
        this.scorePopups.splice(i, 1);
      }
    }
  }

  public checkPacmanCollision(pacTileX: number, pacTileY: number): number {
    if (!this.activeFruit) return 0;

    // Fruit tile is at 13 or 14, row 20
    if ((pacTileX === 13 || pacTileX === 14) && pacTileY === 20) {
      const points = this.activeFruit.points;
      this.addScorePopup(
        (this.fruitTile.x + 0.5) * TILE_SIZE,
        (this.fruitTile.y + 0.5) * TILE_SIZE,
        `${points}`,
        '#ffb8de'
      );
      this.activeFruit = null;
      return points;
    }

    return 0;
  }

  public addScorePopup(x: number, y: number, text: string, color: string = '#33ffff'): void {
    this.scorePopups.push({
      x,
      y,
      text,
      timer: 1.5,
      color,
    });
  }

  public getPixelPosition(): Vector2D {
    return {
      x: this.fruitTile.x * TILE_SIZE + TILE_SIZE / 2,
      y: this.fruitTile.y * TILE_SIZE + TILE_SIZE / 2,
    };
  }
}
