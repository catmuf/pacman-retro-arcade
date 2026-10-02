import { GameEngine } from './game/engine';

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  if (!canvas) {
    console.error('Canvas element #game-canvas not found');
    return;
  }

  const engine = new GameEngine(canvas);
  engine.start();

  // Toolbar elements
  const btnPause = document.getElementById('btn-pause');
  const pauseIcon = document.getElementById('pause-icon');
  const pauseText = document.getElementById('pause-text');

  const btnSound = document.getElementById('btn-sound');
  const soundIcon = document.getElementById('sound-icon');
  const soundText = document.getElementById('sound-text');

  const btnCrt = document.getElementById('btn-crt');
  const btnRestart = document.getElementById('btn-restart');
  const btnHelp = document.getElementById('btn-help');

  // Modal elements
  const helpModal = document.getElementById('help-modal');
  const btnCloseModal = document.getElementById('btn-close-modal');
  const btnModalGotIt = document.getElementById('btn-modal-got-it');

  // Virtual D-pad elements
  const btnDUp = document.getElementById('btn-d-up');
  const btnDDown = document.getElementById('btn-d-down');
  const btnDLeft = document.getElementById('btn-d-left');
  const btnDRight = document.getElementById('btn-d-right');

  // Pause button listener
  btnPause?.addEventListener('click', () => {
    engine.togglePause();
    updatePauseUI();
  });

  function updatePauseUI() {
    if (engine.state === 'PAUSED') {
      if (pauseIcon) pauseIcon.textContent = '▶️';
      if (pauseText) pauseText.textContent = 'RESUME';
      btnPause?.classList.add('active');
    } else {
      if (pauseIcon) pauseIcon.textContent = '⏸️';
      if (pauseText) pauseText.textContent = 'PAUSE';
      btnPause?.classList.remove('active');
    }
  }

  // Sound button listener
  btnSound?.addEventListener('click', () => {
    const isMuted = engine.toggleMute();
    if (isMuted) {
      if (soundIcon) soundIcon.textContent = '🔇';
      if (soundText) soundText.textContent = 'MUTED';
      btnSound.classList.remove('active');
    } else {
      if (soundIcon) soundIcon.textContent = '🔊';
      if (soundText) soundText.textContent = 'SOUND';
      btnSound.classList.add('active');
    }
  });

  // CRT scanlines toggle
  btnCrt?.addEventListener('click', () => {
    const active = engine.toggleCrtFilter();
    btnCrt.classList.toggle('active', active);
  });

  // Restart button listener
  btnRestart?.addEventListener('click', () => {
    engine.restartGame();
  });

  // Help Modal listeners
  btnHelp?.addEventListener('click', () => {
    if (engine.state === 'PLAYING') {
      engine.togglePause();
      updatePauseUI();
    }
    helpModal?.classList.remove('hidden');
  });

  btnCloseModal?.addEventListener('click', () => {
    helpModal?.classList.add('hidden');
  });

  btnModalGotIt?.addEventListener('click', () => {
    helpModal?.classList.add('hidden');
    if (engine.state === 'PAUSED') {
      engine.togglePause();
      updatePauseUI();
    }
  });

  // Virtual D-pad buttons
  btnDUp?.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    engine.inputMgr.triggerDirection('UP');
  });
  btnDDown?.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    engine.inputMgr.triggerDirection('DOWN');
  });
  btnDLeft?.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    engine.inputMgr.triggerDirection('LEFT');
  });
  btnDRight?.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    engine.inputMgr.triggerDirection('RIGHT');
  });
});
