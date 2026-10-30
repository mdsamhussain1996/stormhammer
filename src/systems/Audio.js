import { SaveSystem } from './Save.js';

/**
 * Procedural Web Audio Sound & Music Engine
 * Zero external asset dependencies, zero missing audio files, 100% reliable across browsers.
 */
export class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = SaveSystem.isMuted();
    this.masterGain = null;
    this.bgmGain = null;
    this.sfxGain = null;
    this.currentBgm = null;
    this.bgmTimer = null;
    this.bgmTheme = null;

    this.initAudioContext();
  }

  initAudioContext() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      this.ctx = new AudioContextClass();
      this.masterGain = this.ctx.createGain();
      this.bgmGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();

      this.bgmGain.gain.value = 0.35;
      this.sfxGain.gain.value = 0.65;
      this.masterGain.gain.value = this.muted ? 0.0 : 1.0;

      this.bgmGain.connect(this.masterGain);
      this.sfxGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    SaveSystem.setMuted(this.muted);
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.muted ? 0 : 1, this.ctx.currentTime);
    }
    return this.muted;
  }

  duckBgm(duck = true) {
    if (!this.ctx || !this.bgmGain) return;
    const t = this.ctx.currentTime;
    const targetVol = duck ? 0.08 : 0.35;
    this.bgmGain.gain.cancelScheduledValues(t);
    this.bgmGain.gain.linearRampToValueAtTime(targetVol, t + 0.2);
  }

  isMuted() {
    return this.muted;
  }

  // --- Sound Effects ---
  playSfx(name) {
    if (this.muted || !this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;

    try {
      switch (name) {
        case 'jump': {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(320, t);
          osc.frequency.exponentialRampToValueAtTime(650, t + 0.12);
          gain.gain.setValueAtTime(0.08, t);
          gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
          osc.connect(gain);
          gain.connect(this.sfxGain);
          osc.start(t);
          osc.stop(t + 0.14);
          break;
        }

        case 'swing': {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(260, t);
          osc.frequency.exponentialRampToValueAtTime(80, t + 0.14);
          gain.gain.setValueAtTime(0.09, t);
          gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
          osc.connect(gain);
          gain.connect(this.sfxGain);
          osc.start(t);
          osc.stop(t + 0.15);
          break;
        }

        case 'throw': {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(300, t);
          osc.frequency.exponentialRampToValueAtTime(750, t + 0.18);
          gain.gain.setValueAtTime(0.12, t);
          gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
          osc.connect(gain);
          gain.connect(this.sfxGain);
          osc.start(t);
          osc.stop(t + 0.2);
          break;
        }

        case 'catch': {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(550, t);
          osc.frequency.exponentialRampToValueAtTime(880, t + 0.08);
          gain.gain.setValueAtTime(0.1, t);
          gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
          osc.connect(gain);
          gain.connect(this.sfxGain);
          osc.start(t);
          osc.stop(t + 0.09);
          break;
        }

        case 'hit': {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(180, t);
          osc.frequency.exponentialRampToValueAtTime(45, t + 0.12);
          gain.gain.setValueAtTime(0.16, t);
          gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
          osc.connect(gain);
          gain.connect(this.sfxGain);
          osc.start(t);
          osc.stop(t + 0.13);
          break;
        }

        case 'break': {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(140, t);
          osc.frequency.exponentialRampToValueAtTime(30, t + 0.22);
          gain.gain.setValueAtTime(0.18, t);
          gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
          osc.connect(gain);
          gain.connect(this.sfxGain);
          osc.start(t);
          osc.stop(t + 0.24);
          break;
        }

        case 'coin': {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(987.77, t); // B5
          osc.frequency.setValueAtTime(1318.51, t + 0.06); // E6
          gain.gain.setValueAtTime(0.08, t);
          gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
          osc.connect(gain);
          gain.connect(this.sfxGain);
          osc.start(t);
          osc.stop(t + 0.18);
          break;
        }

        case 'power': {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(440, t);
          osc.frequency.exponentialRampToValueAtTime(1320, t + 0.35);
          gain.gain.setValueAtTime(0.14, t);
          gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
          osc.connect(gain);
          gain.connect(this.sfxGain);
          osc.start(t);
          osc.stop(t + 0.38);
          break;
        }

        case 'key': {
          // Double chime chord
          [659.25, 987.77, 1318.51].forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, t + idx * 0.07);
            gain.gain.setValueAtTime(0.1, t + idx * 0.07);
            gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.5 + idx * 0.07);
            osc.connect(gain);
            gain.connect(this.sfxGain);
            osc.start(t + idx * 0.07);
            osc.stop(t + 0.55 + idx * 0.07);
          });
          break;
        }

        case 'gate': {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(90, t);
          osc.frequency.exponentialRampToValueAtTime(220, t + 0.8);
          gain.gain.setValueAtTime(0.15, t);
          gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.8);
          osc.connect(gain);
          gain.connect(this.sfxGain);
          osc.start(t);
          osc.stop(t + 0.85);
          break;
        }

        case 'zap': {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(1400, t);
          osc.frequency.exponentialRampToValueAtTime(200, t + 0.2);
          gain.gain.setValueAtTime(0.12, t);
          gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
          osc.connect(gain);
          gain.connect(this.sfxGain);
          osc.start(t);
          osc.stop(t + 0.22);
          break;
        }

        case 'fire': {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(320, t);
          osc.frequency.exponentialRampToValueAtTime(110, t + 0.25);
          gain.gain.setValueAtTime(0.11, t);
          gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
          osc.connect(gain);
          gain.connect(this.sfxGain);
          osc.start(t);
          osc.stop(t + 0.27);
          break;
        }

        case 'hurt': {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(240, t);
          osc.frequency.exponentialRampToValueAtTime(60, t + 0.28);
          gain.gain.setValueAtTime(0.15, t);
          gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
          osc.connect(gain);
          gain.connect(this.sfxGain);
          osc.start(t);
          osc.stop(t + 0.3);
          break;
        }

        case 'die': {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(350, t);
          osc.frequency.exponentialRampToValueAtTime(40, t + 0.8);
          gain.gain.setValueAtTime(0.18, t);
          gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.8);
          osc.connect(gain);
          gain.connect(this.sfxGain);
          osc.start(t);
          osc.stop(t + 0.85);
          break;
        }
      }
    } catch (err) {}
  }

  // --- Procedural Realm Music ---
  playThemeBgm(theme) {
    if (this.bgmTheme === theme && this.bgmTimer) return;
    this.stopBgm();
    this.bgmTheme = theme;
    if (!this.ctx) return;
    this.resume();

    let step = 0;
    const interval = theme === 'storm' ? 280 :
                     theme === 'fortress' ? 380 :
                     theme === 'frost' ? 440 :
                     theme === 'castle' ? 520 : 600;

    // Scale notes
    const forestNotes = [220, 261.63, 293.66, 329.63, 392.00, 440, 523.25]; // A minor pentatonic / dorian
    const castleNotes = [164.81, 196.00, 220.00, 246.94, 261.63, 329.63]; // E gothic minor
    const fortressNotes = [110, 130.81, 146.83, 164.81, 196.00, 220]; // D driving war scale
    const frostNotes = [329.63, 392.00, 440.00, 493.88, 587.33, 659.25]; // E crystalline ice scale
    const stormNotes = [146.83, 174.61, 220.00, 293.66, 349.23, 440.00]; // D heroic storm arpeggio

    const notes = theme === 'storm' ? stormNotes :
                  theme === 'frost' ? frostNotes :
                  theme === 'fortress' ? fortressNotes :
                  theme === 'castle' ? castleNotes : forestNotes;

    const playNote = () => {
      if (this.muted || !this.ctx) return;
      const t = this.ctx.currentTime;
      const freq = notes[step % notes.length];
      const bassFreq = freq / 2;

      try {
        // Melodic synth
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = theme === 'storm' || theme === 'fortress' ? 'sawtooth' :
                   theme === 'frost' || theme === 'castle' ? 'square' : 'sine';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.035, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + interval / 1000 * 1.5);
        osc.connect(gain);
        gain.connect(this.bgmGain);
        osc.start(t);
        osc.stop(t + interval / 1000 * 1.6);

        // Low drone bass on primary bars
        if (step % 4 === 0) {
          const bass = this.ctx.createOscillator();
          const bgain = this.ctx.createGain();
          bass.type = 'triangle';
          bass.frequency.setValueAtTime(bassFreq, t);
          bgain.gain.setValueAtTime(0.06, t);
          bgain.gain.exponentialRampToValueAtTime(0.0001, t + interval / 1000 * 3.5);
          bass.connect(bgain);
          bgain.connect(this.bgmGain);
          bass.start(t);
          bass.stop(t + interval / 1000 * 3.6);
        }
      } catch (e) {}

      step++;
    };

    this.bgmTimer = setInterval(playNote, interval);
  }

  stopBgm() {
    if (this.bgmTimer) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
      this.bgmTheme = null;
    }
  }
}

export const audio = new SoundEngine();
