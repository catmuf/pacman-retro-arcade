import { Direction } from './types';

export interface InputCallbacks {
  onDirectionChange: (dir: Direction) => void;
  onTogglePause: () => void;
  onToggleMute: () => void;
  onRestart: () => void;
}

export class InputManager {
  private callbacks: InputCallbacks;
  private touchStartX: number = 0;
  private touchStartY: number = 0;
  private minSwipeDistance: number = 20;

  constructor(callbacks: InputCallbacks) {
    this.callbacks = callbacks;
    this.setupKeyboard();
  }

  private setupKeyboard(): void {
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      // Prevent page scrolling on arrow keys and space
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      switch (e.code) {
        case 'ArrowUp':
        case 'KeyW':
        case 'KeyK':
          this.callbacks.onDirectionChange('UP');
          break;

        case 'ArrowDown':
        case 'KeyS':
        case 'KeyJ':
          this.callbacks.onDirectionChange('DOWN');
          break;

        case 'ArrowLeft':
        case 'KeyA':
        case 'KeyH':
          this.callbacks.onDirectionChange('LEFT');
          break;

        case 'ArrowRight':
        case 'KeyD':
        case 'KeyL':
          this.callbacks.onDirectionChange('RIGHT');
          break;

        case 'Space':
        case 'KeyP':
          this.callbacks.onTogglePause();
          break;

        case 'KeyM':
          this.callbacks.onToggleMute();
          break;

        case 'KeyR':
          this.callbacks.onRestart();
          break;
      }
    });
  }

  public bindTouchEvents(canvas: HTMLElement): void {
    canvas.addEventListener(
      'touchstart',
      (e: TouchEvent) => {
        if (e.touches.length > 0) {
          this.touchStartX = e.touches[0].clientX;
          this.touchStartY = e.touches[0].clientY;
        }
      },
      { passive: false }
    );

    canvas.addEventListener(
      'touchmove',
      (e: TouchEvent) => {
        e.preventDefault(); // Prevent rubber-band scrolling
      },
      { passive: false }
    );

    canvas.addEventListener(
      'touchend',
      (e: TouchEvent) => {
        if (e.changedTouches.length > 0) {
          const deltaX = e.changedTouches[0].clientX - this.touchStartX;
          const deltaY = e.changedTouches[0].clientY - this.touchStartY;
          const absX = Math.abs(deltaX);
          const absY = Math.abs(deltaY);

          if (Math.max(absX, absY) > this.minSwipeDistance) {
            if (absX > absY) {
              this.callbacks.onDirectionChange(deltaX > 0 ? 'RIGHT' : 'LEFT');
            } else {
              this.callbacks.onDirectionChange(deltaY > 0 ? 'DOWN' : 'UP');
            }
          }
        }
      },
      { passive: false }
    );
  }

  public triggerDirection(dir: Direction): void {
    this.callbacks.onDirectionChange(dir);
  }
}
