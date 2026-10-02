import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  COLORS,
  getFruitForLevel,
  MAP_COLS,
  MAP_ROWS,
  TILE_SIZE,
} from './constants';
import { FruitManager } from './fruit';
import { Ghost } from './ghost';
import { GameMap } from './map';
import { Pacman } from './pacman';
import { ScoreManager } from './score';
import { Direction, FruitInfo, GameState, Particle, TileType } from './types';

export class CanvasRenderer {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  private particles: Particle[] = [];
  public showCrtFilter: boolean = false;
  private energizerBlinkTimer: number = 0;
  private levelClearFlashTimer: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.canvas.width = CANVAS_WIDTH;
    this.canvas.height = CANVAS_HEIGHT;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Failed to get 2D canvas context');
    }
    this.ctx = context;
    this.ctx.imageSmoothingEnabled = false;
  }

  public addPelletSparks(x: number, y: number, color: string = '#ffff99'): void {
    const count = 4;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 20 + Math.random() * 30;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.25,
        maxLife: 0.25,
        color,
        size: 1.5 + Math.random(),
      });
    }
  }

  public addGhostMunchSparks(x: number, y: number): void {
    const count = 12;
    const colors = ['#00ffff', '#ffffff', '#ffb8de', '#ffff00'];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const speed = 30 + Math.random() * 40;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.5,
        maxLife: 0.5,
        color: colors[i % colors.length],
        size: 2 + Math.random() * 2,
      });
    }
  }

  public updateParticles(dt: number): void {
    this.energizerBlinkTimer += dt * 4;
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  public render(
    dt: number,
    state: GameState,
    map: GameMap,
    pacman: Pacman,
    ghosts: Ghost[],
    fruitMgr: FruitManager,
    scoreMgr: ScoreManager,
    levelClearTimer: number
  ): void {
    this.updateParticles(dt);
    this.levelClearFlashTimer = levelClearTimer;

    const ctx = this.ctx;

    // Clear background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw HUD (Top)
    this.renderTopHUD(scoreMgr);

    // Draw Maze Walls & Pellets
    this.renderMaze(map, state === 'LEVEL_CLEAR');

    // Draw Bonus Fruit
    this.renderActiveFruit(fruitMgr);

    // Draw Pacman
    if (state !== 'LEVEL_CLEAR') {
      this.renderPacman(pacman);
    }

    // Draw Ghosts
    if (state !== 'PACMAN_DYING' && state !== 'LEVEL_CLEAR') {
      for (const ghost of ghosts) {
        this.renderGhost(ghost);
      }
    }

    // Draw Particles
    this.renderParticles();

    // Draw Floating Score Popups
    this.renderScorePopups(fruitMgr);

    // Draw Bottom HUD (Lives & Fruit history)
    this.renderBottomHUD(scoreMgr);

    // Draw Overlays (Ready, Game Over, Paused)
    this.renderOverlays(state);

    // CRT Scanlines Filter overlay (if enabled)
    if (this.showCrtFilter) {
      this.renderCrtOverlay();
    }
  }

  private renderTopHUD(scoreMgr: ScoreManager): void {
    const ctx = this.ctx;
    ctx.font = 'bold 12px "Courier New", monospace, sans-serif';
    ctx.textBaseline = 'top';

    // 1UP
    ctx.fillStyle = COLORS.TEXT_WHITE;
    ctx.textAlign = 'left';
    ctx.fillText('1UP', 24, 6);
    ctx.fillText(`${scoreMgr.score.toString().padStart(2, ' ')}`, 24, 20);

    // HIGH SCORE
    ctx.textAlign = 'center';
    ctx.fillText('HIGH SCORE', CANVAS_WIDTH / 2, 6);
    ctx.fillText(`${scoreMgr.highScore}`, CANVAS_WIDTH / 2, 20);
  }

  private renderMaze(map: GameMap, isLevelClear: boolean): void {
    const ctx = this.ctx;
    const isFlashWhite = isLevelClear && Math.floor(this.levelClearFlashTimer * 8) % 2 === 0;

    for (let r = 0; r < MAP_ROWS; r++) {
      for (let c = 0; c < MAP_COLS; c++) {
        const tile = map.getTile(c, r);
        const px = c * TILE_SIZE;
        const py = r * TILE_SIZE;

        if (tile === TileType.WALL) {
          ctx.fillStyle = isFlashWhite ? COLORS.WALL_CLEAR_WHITE : COLORS.WALL_BLUE;
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

          // Inner wall accent line for retro look
          ctx.strokeStyle = isFlashWhite ? '#cccccc' : '#0000aa';
          ctx.lineWidth = 1;
          ctx.strokeRect(px + 1, py + 1, TILE_SIZE - 2, TILE_SIZE - 2);
        } else if (tile === TileType.GHOST_DOOR) {
          ctx.fillStyle = COLORS.GATE_PINK;
          ctx.fillRect(px, py + TILE_SIZE / 2 - 2, TILE_SIZE, 4);
        } else if (tile === TileType.PELLET && !isLevelClear) {
          ctx.fillStyle = COLORS.PELLET_YELLOW;
          ctx.fillRect(px + TILE_SIZE / 2 - 1.5, py + TILE_SIZE / 2 - 1.5, 3, 3);
        } else if (tile === TileType.ENERGIZER && !isLevelClear) {
          // Blinking energizer
          if (Math.floor(this.energizerBlinkTimer) % 2 === 0) {
            ctx.fillStyle = COLORS.ENERGIZER_WHITE;
            ctx.beginPath();
            ctx.arc(px + TILE_SIZE / 2, py + TILE_SIZE / 2, 5, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    }
  }

  private renderPacman(pacman: Pacman): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(pacman.x, pacman.y);

    if (pacman.isDying) {
      // Death animation: wedge expands all the way around
      ctx.fillStyle = COLORS.PACMAN_YELLOW;
      const deathAngle = pacman.deathProgress * Math.PI;
      ctx.beginPath();
      ctx.arc(0, 0, TILE_SIZE / 2 - 1, deathAngle, Math.PI * 2 - deathAngle);
      ctx.lineTo(0, 0);
      ctx.fill();
      ctx.restore();
      return;
    }

    // Normal Pac-Man rotation based on direction
    let rotation = 0;
    if (pacman.currentDir === 'UP') rotation = -Math.PI / 2;
    else if (pacman.currentDir === 'DOWN') rotation = Math.PI / 2;
    else if (pacman.currentDir === 'LEFT') rotation = Math.PI;
    else rotation = 0; // RIGHT or NONE

    ctx.rotate(rotation);

    ctx.fillStyle = COLORS.PACMAN_YELLOW;
    ctx.beginPath();
    ctx.arc(0, 0, TILE_SIZE / 2, pacman.mouthAngle, Math.PI * 2 - pacman.mouthAngle);
    ctx.lineTo(0, 0);
    ctx.fill();

    ctx.restore();
  }

  private renderGhost(ghost: Ghost): void {
    const ctx = this.ctx;
    const x = ghost.x;
    const y = ghost.y;
    const radius = TILE_SIZE / 2;

    ctx.save();
    ctx.translate(x, y);

    if (ghost.mode === 'EATEN') {
      // Only draw floating eyes
      this.drawGhostEyes(ctx, ghost.dir);
      ctx.restore();
      return;
    }

    // Determine Ghost Body Color
    let bodyColor = COLORS.BLINKY_RED;
    if (ghost.mode === 'FRIGHTENED') {
      bodyColor = ghost.isFlashing ? COLORS.FRIGHTENED_WHITE : COLORS.FRIGHTENED_BLUE;
    } else {
      switch (ghost.type) {
        case 'BLINKY':
          bodyColor = COLORS.BLINKY_RED;
          break;
        case 'PINKY':
          bodyColor = COLORS.PINKY_PINK;
          break;
        case 'INKY':
          bodyColor = COLORS.INKY_CYAN;
          break;
        case 'CLYDE':
          bodyColor = COLORS.CLYDE_ORANGE;
          break;
      }
    }

    // Draw Ghost Body Dome and Skirt
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.arc(0, -2, radius - 1, Math.PI, 0, false);
    ctx.lineTo(radius - 1, radius - 2);

    // Animated wavy bottom tentacles (3 wave feet)
    const waveStep = Math.floor(ghost.animationTick) % 2 === 0;
    const w = (radius - 1) * 2;
    const feetCount = 3;
    const footW = w / feetCount;

    for (let i = feetCount; i > 0; i--) {
      const footRight = -radius + 1 + i * footW;
      const footMid = footRight - footW / 2;
      const footLeft = footRight - footW;
      const waveOffset = waveStep ? (i % 2 === 0 ? -3 : 0) : i % 2 === 0 ? 0 : -3;
      ctx.quadraticCurveTo(footMid, radius - 2 + waveOffset, footLeft, radius - 2);
    }

    ctx.closePath();
    ctx.fill();

    // Eyes
    if (ghost.mode === 'FRIGHTENED') {
      // Frightened face (small eyes + zigzag mouth)
      ctx.fillStyle = ghost.isFlashing ? COLORS.BLINKY_RED : '#ffb8de';
      ctx.fillRect(-4, -3, 2, 2);
      ctx.fillRect(2, -3, 2, 2);

      // Wavy mouth
      ctx.strokeStyle = ghost.isFlashing ? COLORS.BLINKY_RED : '#ffb8de';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-5, 3);
      ctx.lineTo(-3, 1);
      ctx.lineTo(-1, 3);
      ctx.lineTo(1, 1);
      ctx.lineTo(3, 3);
      ctx.lineTo(5, 1);
      ctx.stroke();
    } else {
      this.drawGhostEyes(ctx, ghost.dir);
    }

    ctx.restore();
  }

  private drawGhostEyes(ctx: CanvasRenderingContext2D, dir: Direction): void {
    // Sclera offset according to look direction
    let offsetX = 0;
    let offsetY = 0;
    if (dir === 'LEFT') offsetX = -2;
    else if (dir === 'RIGHT') offsetX = 2;
    else if (dir === 'UP') offsetY = -2;
    else if (dir === 'DOWN') offsetY = 2;

    // White eye sclera
    ctx.fillStyle = COLORS.EYE_WHITE;
    ctx.beginPath();
    ctx.ellipse(-3.5 + offsetX * 0.5, -3 + offsetY * 0.5, 3, 4, 0, 0, Math.PI * 2);
    ctx.ellipse(3.5 + offsetX * 0.5, -3 + offsetY * 0.5, 3, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Blue pupils
    ctx.fillStyle = COLORS.EYE_PUPIL;
    ctx.beginPath();
    ctx.arc(-3.5 + offsetX, -3 + offsetY, 1.8, 0, Math.PI * 2);
    ctx.arc(3.5 + offsetX, -3 + offsetY, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }

  private renderActiveFruit(fruitMgr: FruitManager): void {
    if (!fruitMgr.activeFruit) return;

    const ctx = this.ctx;
    const pos = fruitMgr.getPixelPosition();
    this.drawFruitIcon(ctx, pos.x, pos.y, fruitMgr.activeFruit, 14);
  }

  public drawFruitIcon(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    fruit: FruitInfo,
    size: number
  ): void {
    ctx.save();
    ctx.translate(x, y);

    const r = size / 2;

    if (fruit.type === 'CHERRY') {
      // Two red cherries with brown/green stems
      ctx.fillStyle = fruit.color;
      ctx.beginPath();
      ctx.arc(-3, 3, 3.5, 0, Math.PI * 2);
      ctx.arc(3, 1, 3.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = fruit.leafColor;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-3, 0);
      ctx.quadraticCurveTo(0, -6, 2, -6);
      ctx.moveTo(3, -2);
      ctx.quadraticCurveTo(2, -4, 2, -6);
      ctx.stroke();
    } else if (fruit.type === 'STRAWBERRY') {
      // Strawberry shape + green stem
      ctx.fillStyle = fruit.color;
      ctx.beginPath();
      ctx.moveTo(0, r);
      ctx.bezierCurveTo(-r, r * 0.3, -r, -r * 0.5, 0, -r * 0.5);
      ctx.bezierCurveTo(r, -r * 0.5, r, r * 0.3, 0, r);
      ctx.fill();

      // Green cap
      ctx.fillStyle = fruit.leafColor;
      ctx.fillRect(-3, -r * 0.7, 6, 2);
    } else if (fruit.type === 'PEACH' || fruit.type === 'APPLE' || fruit.type === 'MELON') {
      ctx.fillStyle = fruit.color;
      ctx.beginPath();
      ctx.arc(0, 1, r - 1, 0, Math.PI * 2);
      ctx.fill();

      // Stem
      ctx.fillStyle = fruit.leafColor;
      ctx.fillRect(-1, -r + 1, 2, 3);
    } else if (fruit.type === 'BELL' || fruit.type === 'KEY' || fruit.type === 'GALAXIAN') {
      ctx.fillStyle = fruit.color;
      ctx.beginPath();
      ctx.arc(0, 0, r - 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  private renderParticles(): void {
    const ctx = this.ctx;
    for (const p of this.particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = alpha;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1.0;
  }

  private renderScorePopups(fruitMgr: FruitManager): void {
    const ctx = this.ctx;
    ctx.font = 'bold 11px "Courier New", monospace, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (const popup of fruitMgr.scorePopups) {
      ctx.fillStyle = popup.color;
      ctx.fillText(popup.text, popup.x, popup.y);
    }
  }

  private renderBottomHUD(scoreMgr: ScoreManager): void {
    const ctx = this.ctx;
    const bottomY = (MAP_ROWS - 1) * TILE_SIZE;

    // Lives icons at bottom left
    const maxDisplayedLives = Math.min(scoreMgr.lives - 1, 5);
    for (let i = 0; i < maxDisplayedLives; i++) {
      const lx = 24 + i * 18;
      ctx.fillStyle = COLORS.PACMAN_YELLOW;
      ctx.beginPath();
      ctx.arc(lx, bottomY, 6, 0.25 * Math.PI, 1.75 * Math.PI);
      ctx.lineTo(lx, bottomY);
      ctx.fill();
    }

    // Fruit progress indicator at bottom right
    const displayedFruitsCount = Math.min(scoreMgr.level, 7);
    for (let i = 0; i < displayedFruitsCount; i++) {
      const fruitLevel = scoreMgr.level - displayedFruitsCount + 1 + i;
      const fruit = getFruitForLevel(fruitLevel);
      const fx = CANVAS_WIDTH - 24 - (displayedFruitsCount - 1 - i) * 18;
      this.drawFruitIcon(ctx, fx, bottomY, fruit, 12);
    }
  }

  private renderOverlays(state: GameState): void {
    const ctx = this.ctx;
    ctx.font = 'bold 15px "Courier New", monospace, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (state === 'READY') {
      ctx.fillStyle = COLORS.TEXT_YELLOW;
      ctx.fillText('READY!', CANVAS_WIDTH / 2, 20 * TILE_SIZE + 8);
    } else if (state === 'GAME_OVER') {
      ctx.fillStyle = COLORS.TEXT_RED;
      ctx.fillText('GAME  OVER', CANVAS_WIDTH / 2, 20 * TILE_SIZE + 8);
    } else if (state === 'PAUSED') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = COLORS.TEXT_CYAN;
      ctx.font = 'bold 18px "Courier New", monospace, sans-serif';
      ctx.fillText('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    }
  }

  private renderCrtOverlay(): void {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(18, 16, 16, 0.15)';
    for (let y = 0; y < CANVAS_HEIGHT; y += 3) {
      ctx.fillRect(0, y, CANVAS_WIDTH, 1);
    }
  }
}
