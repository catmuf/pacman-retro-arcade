import { SoundManager } from './audio';
import { getFrightenedDuration, getWaveTimings, TILE_SIZE, WaveTiming } from './constants';
import { FruitManager } from './fruit';
import { Ghost } from './ghost';
import { InputManager } from './input';
import { GameMap } from './map';
import { Pacman } from './pacman';
import { CanvasRenderer } from './renderer';
import { ScoreManager } from './score';
import { Direction, GameState } from './types';

export class GameEngine {
  public state: GameState = 'READY';
  public map: GameMap;
  public pacman: Pacman;
  public ghosts: Ghost[];
  public blinky: Ghost;
  public pinky: Ghost;
  public inky: Ghost;
  public clyde: Ghost;
  public fruitMgr: FruitManager;
  public scoreMgr: ScoreManager;
  public soundMgr: SoundManager;
  public renderer: CanvasRenderer;
  public inputMgr: InputManager;

  // Timers & Waves
  private waveTimings: WaveTiming[] = [];
  private currentWaveIndex: number = 0;
  private waveTimer: number = 0;
  public isGlobalScatter: boolean = true;

  private stateTimer: number = 0;
  private freezeTimer: number = 0;
  private lastTime: number = 0;
  private animationFrameId: number | null = null;
  private isRunning: boolean = false;

  constructor(canvas: HTMLCanvasElement) {
    this.map = new GameMap();
    this.pacman = new Pacman();
    this.blinky = new Ghost('BLINKY');
    this.pinky = new Ghost('PINKY');
    this.inky = new Ghost('INKY');
    this.clyde = new Ghost('CLYDE');
    this.ghosts = [this.blinky, this.pinky, this.inky, this.clyde];

    this.fruitMgr = new FruitManager();
    this.scoreMgr = new ScoreManager();
    this.soundMgr = new SoundManager();
    this.renderer = new CanvasRenderer(canvas);

    this.inputMgr = new InputManager({
      onDirectionChange: (dir: Direction) => this.handleDirectionInput(dir),
      onTogglePause: () => this.togglePause(),
      onToggleMute: () => this.toggleMute(),
      onRestart: () => this.restartGame(),
    });
    this.inputMgr.bindTouchEvents(canvas);

    this.initLevel(1);
  }

  public initLevel(level: number): void {
    this.scoreMgr.level = level;
    this.map.resetPellets();
    this.waveTimings = getWaveTimings(level);
    this.currentWaveIndex = 0;
    this.waveTimer = this.waveTimings[0]?.duration || 7;
    this.isGlobalScatter = this.waveTimings[0]?.mode === 'SCATTER';

    this.fruitMgr.reset(level);
    this.resetEntityPositions();
    this.state = 'READY';
    this.stateTimer = 2.2; // 2.2s intro countdown

    if (level === 1 && this.scoreMgr.score === 0) {
      this.soundMgr.playIntro();
    }
  }

  public resetEntityPositions(): void {
    this.pacman.reset();
    for (const g of this.ghosts) {
      g.reset();
    }
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  public stop(): void {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.soundMgr.stopSiren();
  }

  public restartGame(): void {
    this.scoreMgr.resetGame();
    this.initLevel(1);
  }

  public togglePause(): void {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
      this.soundMgr.stopSiren();
    } else if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
    }
  }

  public toggleMute(): boolean {
    return this.soundMgr.toggleMute();
  }

  public isMuted(): boolean {
    return this.soundMgr.getMuted();
  }

  public toggleCrtFilter(): boolean {
    this.renderer.showCrtFilter = !this.renderer.showCrtFilter;
    return this.renderer.showCrtFilter;
  }

  private handleDirectionInput(dir: Direction): void {
    if (this.state === 'GAME_OVER') {
      this.restartGame();
      return;
    }
    if (this.state === 'READY') {
      // Buffer direction for when round starts
      this.pacman.setDesiredDirection(dir);
      return;
    }
    if (this.state === 'PLAYING') {
      this.pacman.setDesiredDirection(dir);
    }
  }

  private loop(currentTime: number): void {
    if (!this.isRunning) return;

    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1); // Clamp delta time to max 100ms
    this.lastTime = currentTime;

    this.update(dt);
    this.render(dt);

    this.animationFrameId = requestAnimationFrame((t) => this.loop(t));
  }

  private update(dt: number): void {
    if (this.freezeTimer > 0) {
      this.freezeTimer -= dt;
      return;
    }

    switch (this.state) {
      case 'READY':
        this.updateReadyState(dt);
        break;

      case 'PLAYING':
        this.updatePlayingState(dt);
        break;

      case 'PACMAN_DYING':
        this.updateDyingState(dt);
        break;

      case 'LEVEL_CLEAR':
        this.updateLevelClearState(dt);
        break;

      case 'GAME_OVER':
      case 'PAUSED':
        // No physics updates
        break;
    }
  }

  private updateReadyState(dt: number): void {
    this.stateTimer -= dt;
    if (this.stateTimer <= 0) {
      this.state = 'PLAYING';
      if (this.pacman.nextDir === 'NONE') {
        this.pacman.currentDir = 'LEFT'; // Standard arcade auto-start direction
      } else {
        this.pacman.currentDir = this.pacman.nextDir;
      }
    }
  }

  private updatePlayingState(dt: number): void {
    // 1. Update Wave Timers (Scatter / Chase cycle)
    this.updateWaves(dt);

    // 2. Update Pacman
    this.pacman.update(dt, this.map);

    // 3. Check Pellet / Energizer Eating
    const pacTileX = this.pacman.getTileX();
    const pacTileY = this.pacman.getTileY();
    const eatResult = this.map.eatPellet(pacTileX, pacTileY);

    if (eatResult.atePellet) {
      const pelletPx = pacTileX * TILE_SIZE + TILE_SIZE / 2;
      const pelletPy = pacTileY * TILE_SIZE + TILE_SIZE / 2;

      if (eatResult.isEnergizer) {
        const extraLife = this.scoreMgr.addEnergizer();
        if (extraLife) this.soundMgr.playExtraLife();
        this.soundMgr.playEnergizerSiren();
        this.renderer.addPelletSparks(pelletPx, pelletPy, '#ffffff');

        // Frighten ghosts
        const duration = getFrightenedDuration(this.scoreMgr.level);
        for (const g of this.ghosts) {
          g.setFrightened(duration);
        }
      } else {
        const extraLife = this.scoreMgr.addPellet();
        if (extraLife) this.soundMgr.playExtraLife();
        this.soundMgr.playWaka();
        this.renderer.addPelletSparks(pelletPx, pelletPy);
      }

      // Check fruit spawn milestones
      const dotsEaten = this.map.totalPellets - this.map.remainingPellets;
      this.fruitMgr.onDotsChanged(dotsEaten, this.scoreMgr.level);

      // Check level clear
      if (this.map.remainingPellets <= 0) {
        this.state = 'LEVEL_CLEAR';
        this.stateTimer = 2.0;
        this.soundMgr.stopSiren();
        return;
      }
    }

    // 4. Update Siren Audio
    let anyFrightened = false;
    for (const g of this.ghosts) {
      if (g.mode === 'FRIGHTENED') {
        anyFrightened = true;
        break;
      }
    }

    if (!anyFrightened) {
      const speedMultiplier = this.map.remainingPellets <= 20 ? 1.5 : 1.0;
      this.soundMgr.startSiren(speedMultiplier);
    }

    // 5. Update Fruit
    this.fruitMgr.update(dt);
    const fruitPoints = this.fruitMgr.checkPacmanCollision(pacTileX, pacTileY);
    if (fruitPoints > 0) {
      const extraLife = this.scoreMgr.addFruit(fruitPoints);
      if (extraLife) this.soundMgr.playExtraLife();
      this.soundMgr.playEatFruit();
    }

    // 6. Update Ghosts
    for (const g of this.ghosts) {
      g.update(
        dt,
        this.map,
        this.pacman,
        this.blinky,
        this.isGlobalScatter,
        this.map.remainingPellets
      );
    }

    // 7. Check Ghost Collisions
    this.checkGhostCollisions();
  }

  private updateWaves(dt: number): void {
    if (this.currentWaveIndex >= this.waveTimings.length) return;

    this.waveTimer -= dt;
    if (this.waveTimer <= 0) {
      this.currentWaveIndex++;
      if (this.currentWaveIndex < this.waveTimings.length) {
        const nextWave = this.waveTimings[this.currentWaveIndex];
        this.waveTimer = nextWave.duration;
        this.isGlobalScatter = nextWave.mode === 'SCATTER';

        // Ghosts reverse direction on mode switch (classic mechanic)
        for (const g of this.ghosts) {
          if (g.mode === 'CHASE' || g.mode === 'SCATTER') {
            g.mode = this.isGlobalScatter ? 'SCATTER' : 'CHASE';
          }
        }
      }
    }
  }

  private checkGhostCollisions(): void {
    const pacPos = this.pacman.getCenter();
    const collisionThresholdSq = (TILE_SIZE * 0.75) * (TILE_SIZE * 0.75);

    for (const ghost of this.ghosts) {
      const ghostPos = ghost.getCenter();
      const dx = pacPos.x - ghostPos.x;
      const dy = pacPos.y - ghostPos.y;
      const distSq = dx * dx + dy * dy;

      if (distSq <= collisionThresholdSq) {
        if (ghost.mode === 'FRIGHTENED') {
          // Pacman eats ghost!
          ghost.eat();
          const { points, extraLifeEarned } = this.scoreMgr.addGhostEat();
          if (extraLifeEarned) this.soundMgr.playExtraLife();

          this.soundMgr.playEatGhost();
          this.renderer.addGhostMunchSparks(ghost.x, ghost.y);
          this.fruitMgr.addScorePopup(ghost.x, ghost.y, `${points}`, '#00ffff');

          // Freeze game for brief dramatic pause (0.35s)
          this.freezeTimer = 0.35;
        } else if (ghost.mode === 'CHASE' || ghost.mode === 'SCATTER') {
          // Pacman dies!
          this.triggerPacmanDeath();
          return;
        }
      }
    }
  }

  private triggerPacmanDeath(): void {
    this.state = 'PACMAN_DYING';
    this.stateTimer = 1.6;
    this.pacman.isDying = true;
    this.pacman.deathProgress = 0;
    this.soundMgr.playDeath();
  }

  private updateDyingState(dt: number): void {
    this.pacman.update(dt, this.map);
    this.stateTimer -= dt;

    if (this.stateTimer <= 0) {
      const hasLivesRemaining = this.scoreMgr.loseLife();
      if (hasLivesRemaining) {
        this.resetEntityPositions();
        this.state = 'READY';
        this.stateTimer = 1.8;
      } else {
        this.state = 'GAME_OVER';
        this.scoreMgr.saveHighScore();
      }
    }
  }

  private updateLevelClearState(dt: number): void {
    this.stateTimer -= dt;
    if (this.stateTimer <= 0) {
      this.initLevel(this.scoreMgr.level + 1);
    }
  }

  private render(dt: number): void {
    this.renderer.render(
      dt,
      this.state,
      this.map,
      this.pacman,
      this.ghosts,
      this.fruitMgr,
      this.scoreMgr,
      this.stateTimer
    );
  }
}
