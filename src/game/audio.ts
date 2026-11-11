// Web Audio API pure synthesizer sound engine
// Completely local, zero latency, guaranteed to work in any browser!

class SoundEngine {
  private ctx: AudioContext | null = null;
  private sfxGain: GainNode | null = null;
  private bgmGain: GainNode | null = null;
  private masterGain: GainNode | null = null;

  public sfxMuted: boolean = false;
  public bgmMuted: boolean = false;
  public sfxVolume: number = 0.5;
  public bgmVolume: number = 0.35;

  private isBgmPlaying: boolean = false;
  private bgmTimer: number | null = null;
  private gemStreak: number = 0;
  private lastGemTime: number = 0;

  constructor() {
    // AudioContext will be initialized on first user gesture
  }

  private initContext() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.sfxMuted ? 0 : this.sfxVolume, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.setValueAtTime(this.bgmMuted ? 0 : this.bgmVolume, this.ctx.currentTime);
      this.bgmGain.connect(this.masterGain);
    } catch {
      // Audio not supported
    }
  }

  public unlockAudio() {
    this.initContext();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setSfxMuted(muted: boolean) {
    this.sfxMuted = muted;
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(muted ? 0 : this.sfxVolume, this.ctx.currentTime);
    }
  }

  public setBgmMuted(muted: boolean) {
    this.bgmMuted = muted;
    if (this.bgmGain && this.ctx) {
      this.bgmGain.gain.setValueAtTime(muted ? 0 : this.bgmVolume, this.ctx.currentTime);
    }
  }

  public setSfxVolume(vol: number) {
    this.sfxVolume = Math.max(0, Math.min(1, vol));
    if (this.sfxGain && this.ctx && !this.sfxMuted) {
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
    }
  }

  public setBgmVolume(vol: number) {
    this.bgmVolume = Math.max(0, Math.min(1, vol));
    if (this.bgmGain && this.ctx && !this.bgmMuted) {
      this.bgmGain.gain.setValueAtTime(this.bgmVolume, this.ctx.currentTime);
    }
  }

  // --- Sound Effects ---

  public playLaser() {
    this.unlockAudio();
    if (!this.ctx || !this.sfxGain || this.sfxMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(880, t);
    osc.frequency.exponentialRampToValueAtTime(110, t + 0.12);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.12);
  }

  public playHit() {
    this.unlockAudio();
    if (!this.ctx || !this.sfxGain || this.sfxMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.08);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.08);
  }

  public playExplosion(isLarge: boolean = false) {
    this.unlockAudio();
    if (!this.ctx || !this.sfxGain || this.sfxMuted) return;

    const t = this.ctx.currentTime;
    const duration = isLarge ? 0.45 : 0.22;

    // Synthesize noise explosion
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(isLarge ? 400 : 800, t);
    filter.frequency.exponentialRampToValueAtTime(60, t + duration);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(isLarge ? 0.4 : 0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    whiteNoise.start(t);
    whiteNoise.stop(t + duration);
  }

  public playGem() {
    this.unlockAudio();
    if (!this.ctx || !this.sfxGain || this.sfxMuted) return;

    const now = performance.now();
    if (now - this.lastGemTime < 400) {
      this.gemStreak = (this.gemStreak + 1) % 8;
    } else {
      this.gemStreak = 0;
    }
    this.lastGemTime = now;

    // Pentatonic scale chime (C5, D5, E5, G5, A5, C6, D6, E6)
    const scale = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.51];
    const freq = scale[this.gemStreak];

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.15);
  }

  public playLevelUp() {
    this.unlockAudio();
    if (!this.ctx || !this.sfxGain || this.sfxMuted) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C E G C
    notes.forEach((freq, idx) => {
      const t = this.ctx!.currentTime + idx * 0.08;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(t);
      osc.stop(t + 0.3);
    });
  }

  public playDash() {
    this.unlockAudio();
    if (!this.ctx || !this.sfxGain || this.sfxMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(240, t);
    osc.frequency.exponentialRampToValueAtTime(650, t + 0.15);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.15);
  }

  public playBossAlarm() {
    this.unlockAudio();
    if (!this.ctx || !this.sfxGain || this.sfxMuted) return;

    for (let i = 0; i < 2; i++) {
      const t = this.ctx.currentTime + i * 0.35;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, t);
      osc.frequency.linearRampToValueAtTime(220, t + 0.25);

      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.3);
    }
  }

  public playLightning() {
    this.unlockAudio();
    if (!this.ctx || !this.sfxGain || this.sfxMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1200, t);
    osc.frequency.exponentialRampToValueAtTime(200, t + 0.1);

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.1);
  }

  // --- Procedural Synth BGM (Cosmic Arpeggio Loop) ---
  public startBgm() {
    if (this.isBgmPlaying) return;
    this.unlockAudio();
    this.isBgmPlaying = true;

    // Ambient space progression: Dm -> F -> C -> Bb
    const chords = [
      [146.83, 220.0, 261.63, 349.23], // Dm
      [174.61, 220.0, 261.63, 349.23], // F
      [130.81, 196.0, 261.63, 329.63], // C
      [116.54, 174.61, 233.08, 293.66], // Bb
    ];
    let step = 0;

    const playStep = () => {
      if (!this.isBgmPlaying) return;
      if (this.ctx && this.bgmGain && !this.bgmMuted) {
        const chordIdx = Math.floor(step / 8) % chords.length;
        const noteIdx = step % 4;
        const noteFreq = chords[chordIdx][noteIdx];

        const t = this.ctx.currentTime;

        // Bass root on beat 0
        if (step % 8 === 0) {
          const bassOsc = this.ctx.createOscillator();
          const bassGain = this.ctx.createGain();
          bassOsc.type = 'sine';
          bassOsc.frequency.setValueAtTime(chords[chordIdx][0] / 2, t);
          bassGain.gain.setValueAtTime(0.2, t);
          bassGain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
          bassOsc.connect(bassGain);
          bassGain.connect(this.bgmGain);
          bassOsc.start(t);
          bassOsc.stop(t + 0.8);
        }

        // Arpeggiator note
        const arpOsc = this.ctx.createOscillator();
        const arpGain = this.ctx.createGain();
        arpOsc.type = 'sine';
        arpOsc.frequency.setValueAtTime(noteFreq, t);
        arpGain.gain.setValueAtTime(0.08, t);
        arpGain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
        arpOsc.connect(arpGain);
        arpGain.connect(this.bgmGain);
        arpOsc.start(t);
        arpOsc.stop(t + 0.22);
      }

      step++;
      this.bgmTimer = window.setTimeout(playStep, 200);
    };

    playStep();
  }

  public stopBgm() {
    this.isBgmPlaying = false;
    if (this.bgmTimer) {
      clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
    }
  }
}

export const sound = new SoundEngine();
