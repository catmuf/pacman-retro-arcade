import {
  ENERGIZER_POINTS,
  EXTRA_LIFE_SCORE,
  GHOST_EAT_POINTS,
  PELLET_POINTS,
} from './constants';

export class ScoreManager {
  public score: number = 0;
  public highScore: number = 0;
  public lives: number = 3;
  public level: number = 1;
  public extraLifeAwarded: boolean = false;
  public ghostsEatenInChain: number = 0;

  private static STORAGE_KEY = 'pacman_arcade_high_score';

  constructor() {
    this.loadHighScore();
  }

  public loadHighScore(): void {
    try {
      const saved = localStorage.getItem(ScoreManager.STORAGE_KEY);
      if (saved) {
        this.highScore = parseInt(saved, 10) || 0;
      }
    } catch {
      this.highScore = 0;
    }
  }

  public saveHighScore(): void {
    try {
      if (this.score > this.highScore) {
        this.highScore = this.score;
        localStorage.setItem(ScoreManager.STORAGE_KEY, this.highScore.toString());
      }
    } catch {
      // LocalStorage might be disabled or unavailable
    }
  }

  public resetGame(): void {
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.extraLifeAwarded = false;
    this.ghostsEatenInChain = 0;
    this.loadHighScore();
  }

  public addPellet(): boolean {
    return this.addPoints(PELLET_POINTS);
  }

  public addEnergizer(): boolean {
    this.ghostsEatenInChain = 0;
    return this.addPoints(ENERGIZER_POINTS);
  }

  public addGhostEat(): { points: number; extraLifeEarned: boolean } {
    const pointsIndex = Math.min(this.ghostsEatenInChain, GHOST_EAT_POINTS.length - 1);
    const points = GHOST_EAT_POINTS[pointsIndex];
    this.ghostsEatenInChain++;

    const extraLifeEarned = this.addPoints(points);
    return { points, extraLifeEarned };
  }

  public addFruit(points: number): boolean {
    return this.addPoints(points);
  }

  public addPoints(pts: number): boolean {
    this.score += pts;
    if (this.score > this.highScore) {
      this.highScore = this.score;
      this.saveHighScore();
    }

    // Check extra life threshold
    if (!this.extraLifeAwarded && this.score >= EXTRA_LIFE_SCORE) {
      this.extraLifeAwarded = true;
      this.lives++;
      return true; // Flag that extra life was gained
    }

    return false;
  }

  public loseLife(): boolean {
    this.lives--;
    return this.lives > 0;
  }
}
