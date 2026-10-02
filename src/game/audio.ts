export class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private sirenOsc: OscillatorNode | null = null;
  private sirenGain: GainNode | null = null;
  private sirenLfo: OscillatorNode | null = null;
  private sirenLfoGain: GainNode | null = null;
  private wakaPhase: number = 0;
  private isSirenPlaying: boolean = false;
  private masterGain: GainNode | null = null;

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  private initContext(): boolean {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtxClass) return false;
      this.ctx = new AudioCtxClass();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.4, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return true;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.4, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public playWaka(): void {
    if (this.isMuted || !this.initContext() || !this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    // Alternate pitch between two notes for iconic "waka waka"
    const freq = this.wakaPhase === 0 ? 340 : 480;
    this.wakaPhase = 1 - this.wakaPhase;

    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.5, this.ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.08);
  }

  public startSiren(speedMultiplier: number = 1.0): void {
    if (this.isMuted || !this.initContext() || !this.ctx || !this.masterGain) return;
    if (this.isSirenPlaying) {
      this.updateSirenSpeed(speedMultiplier);
      return;
    }

    try {
      this.sirenOsc = this.ctx.createOscillator();
      this.sirenGain = this.ctx.createGain();
      this.sirenLfo = this.ctx.createOscillator();
      this.sirenLfoGain = this.ctx.createGain();

      this.sirenOsc.type = 'sawtooth';
      this.sirenOsc.frequency.setValueAtTime(450, this.ctx.currentTime);

      this.sirenLfo.type = 'sine';
      this.sirenLfo.frequency.setValueAtTime(4 * speedMultiplier, this.ctx.currentTime);

      this.sirenLfoGain.gain.setValueAtTime(150, this.ctx.currentTime);

      this.sirenLfo.connect(this.sirenLfoGain);
      this.sirenLfoGain.connect(this.sirenOsc.frequency);

      this.sirenGain.gain.setValueAtTime(0.06, this.ctx.currentTime);

      this.sirenOsc.connect(this.sirenGain);
      this.sirenGain.connect(this.masterGain);

      this.sirenOsc.start();
      this.sirenLfo.start();
      this.isSirenPlaying = true;
    } catch {
      // Ignored if audio setup was interrupted
    }
  }

  public updateSirenSpeed(multiplier: number): void {
    if (!this.ctx || !this.sirenLfo) return;
    this.sirenLfo.frequency.setValueAtTime(4 * multiplier, this.ctx.currentTime);
  }

  public stopSiren(): void {
    if (!this.isSirenPlaying) return;
    try {
      if (this.sirenOsc) {
        this.sirenOsc.stop();
        this.sirenOsc.disconnect();
        this.sirenOsc = null;
      }
      if (this.sirenLfo) {
        this.sirenLfo.stop();
        this.sirenLfo.disconnect();
        this.sirenLfo = null;
      }
    } catch {
      // Ignore
    }
    this.isSirenPlaying = false;
  }

  public playEnergizerSiren(): void {
    if (this.isMuted || !this.initContext() || !this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(600, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(800, this.ctx.currentTime + 0.15);
    osc.frequency.linearRampToValueAtTime(600, this.ctx.currentTime + 0.3);

    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);
  }

  public playEatGhost(): void {
    if (this.isMuted || !this.initContext() || !this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(250, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(900, this.ctx.currentTime + 0.25);

    gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.25);
  }

  public playEatFruit(): void {
    if (this.isMuted || !this.initContext() || !this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const freqs = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 arpeggio

    freqs.forEach((f, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, t + idx * 0.05);

      gain.gain.setValueAtTime(0.3, t + idx * 0.05);
      gain.gain.linearRampToValueAtTime(0.01, t + idx * 0.05 + 0.08);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t + idx * 0.05);
      osc.stop(t + idx * 0.05 + 0.08);
    });
  }

  public playDeath(): void {
    this.stopSiren();
    if (this.isMuted || !this.initContext() || !this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';

    // Iconic descending chromatic sweeps
    const steps = 12;
    for (let i = 0; i < steps; i++) {
      const stepTime = t + i * 0.1;
      const f1 = 600 - i * 35;
      const f2 = 450 - i * 35;
      osc.frequency.setValueAtTime(f1, stepTime);
      osc.frequency.linearRampToValueAtTime(f2, stepTime + 0.09);
    }

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.linearRampToValueAtTime(0.01, t + 1.3);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 1.3);
  }

  public playIntro(): void {
    this.stopSiren();
    if (this.isMuted || !this.initContext() || !this.ctx || !this.masterGain) return;

    // Classic arcade intro melody: (note, duration in seconds)
    const melody: [number, number][] = [
      [493.88, 0.15], // B4
      [987.77, 0.15], // B5
      [739.99, 0.15], // F#5
      [622.25, 0.15], // D#5
      [987.77, 0.10], // B5
      [739.99, 0.15], // F#5
      [622.25, 0.20], // D#5

      [523.25, 0.15], // C5
      [1046.5, 0.15], // C6
      [783.99, 0.15], // G5
      [659.25, 0.15], // E5
      [1046.5, 0.10], // C6
      [783.99, 0.15], // G5
      [659.25, 0.20], // E5

      [493.88, 0.15], // B4
      [987.77, 0.15], // B5
      [739.99, 0.15], // F#5
      [622.25, 0.15], // D#5
      [987.77, 0.10], // B5
      [739.99, 0.15], // F#5
      [622.25, 0.20], // D#5

      [622.25, 0.08], // D#5
      [659.25, 0.08], // E5
      [698.46, 0.08], // F5
      [739.99, 0.08], // F#5
      [783.99, 0.08], // G5
      [830.61, 0.08], // G#5
      [880.0, 0.08],  // A5
      [987.77, 0.30], // B5
    ];

    let currentT = this.ctx.currentTime;
    for (const [freq, dur] of melody) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, currentT);

      gain.gain.setValueAtTime(0.3, currentT);
      gain.gain.linearRampToValueAtTime(0.01, currentT + dur * 0.95);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(currentT);
      osc.stop(currentT + dur);

      currentT += dur;
    }
  }

  public playExtraLife(): void {
    if (this.isMuted || !this.initContext() || !this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
    notes.forEach((freq, i) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + i * 0.1);

      gain.gain.setValueAtTime(0.3, t + i * 0.1);
      gain.gain.linearRampToValueAtTime(0.01, t + i * 0.1 + 0.15);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t + i * 0.1);
      osc.stop(t + i * 0.1 + 0.15);
    });
  }
}
