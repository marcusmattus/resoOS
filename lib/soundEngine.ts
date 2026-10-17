// Web Audio Sound Engine for ResOS Frequency Resonance Therapy

export type SoundMode = 'sine' | 'binaural' | 'isochronic' | 'harmonic_stack';

export interface SoundEngineState {
  isPlaying: boolean;
  frequency: number;
  mode: SoundMode;
  volume: number; // 0 to 1
  binauralDelta: number; // e.g. 7.83 or 10 Hz
  heartRateCoupled: boolean;
  targetBpm: number;
}

class ResonanceSoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;

  // Oscillators & Nodes
  private oscPrimary: OscillatorNode | null = null;
  private oscSecondary: OscillatorNode | null = null;
  private oscTertiary: OscillatorNode | null = null;
  private pannerLeft: StereoPannerNode | null = null;
  private pannerRight: StereoPannerNode | null = null;
  private pulseGain: GainNode | null = null;
  private lfoOsc: OscillatorNode | null = null;

  private state: SoundEngineState = {
    isPlaying: false,
    frequency: 528,
    mode: 'sine',
    volume: 0.65,
    binauralDelta: 7.83,
    heartRateCoupled: true,
    targetBpm: 65,
  };

  private listeners: Set<(state: SoundEngineState) => void> = new Set();

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 1024;
      this.analyser.smoothingTimeConstant = 0.85;

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.state.volume, this.ctx.currentTime);
      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public subscribe(listener: (state: SoundEngineState) => void) {
    this.listeners.add(listener);
    listener({ ...this.state });
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    for (const listener of this.listeners) {
      listener({ ...this.state });
    }
  }

  public start(frequency = this.state.frequency, mode: SoundMode = this.state.mode, binauralDelta = this.state.binauralDelta) {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    this.stop(); // Stop any active oscillators first

    this.state.frequency = frequency;
    this.state.mode = mode;
    this.state.binauralDelta = binauralDelta;
    this.state.isPlaying = true;

    const now = this.ctx.currentTime;
    const freq = Math.max(20, Math.min(4000, frequency));

    if (mode === 'sine') {
      // Pure sine with gentle overtone
      this.oscPrimary = this.ctx.createOscillator();
      this.oscPrimary.type = 'sine';
      this.oscPrimary.frequency.setValueAtTime(freq, now);

      const subtleGain = this.ctx.createGain();
      subtleGain.gain.setValueAtTime(0.7, now);
      this.oscPrimary.connect(subtleGain);
      subtleGain.connect(this.masterGain);

      // Subtle octave harmonic (e.g. 528 * 2 = 1056 at 15% volume)
      this.oscSecondary = this.ctx.createOscillator();
      this.oscSecondary.type = 'sine';
      this.oscSecondary.frequency.setValueAtTime(freq * 2, now);
      const overtoneGain = this.ctx.createGain();
      overtoneGain.gain.setValueAtTime(0.12, now);
      this.oscSecondary.connect(overtoneGain);
      overtoneGain.connect(this.masterGain);

      this.oscPrimary.start(now);
      this.oscSecondary.start(now);
    } else if (mode === 'binaural') {
      // Left ear gets base freq, Right ear gets base freq + binaural delta
      const delta = binauralDelta || 7.83;
      this.pannerLeft = this.ctx.createStereoPanner();
      this.pannerRight = this.ctx.createStereoPanner();
      this.pannerLeft.pan.setValueAtTime(-1, now);
      this.pannerRight.pan.setValueAtTime(1, now);

      this.oscPrimary = this.ctx.createOscillator();
      this.oscPrimary.type = 'sine';
      this.oscPrimary.frequency.setValueAtTime(freq, now);
      this.oscPrimary.connect(this.pannerLeft);
      this.pannerLeft.connect(this.masterGain);

      this.oscSecondary = this.ctx.createOscillator();
      this.oscSecondary.type = 'sine';
      this.oscSecondary.frequency.setValueAtTime(freq + delta, now);
      this.oscSecondary.connect(this.pannerRight);
      this.pannerRight.connect(this.masterGain);

      this.oscPrimary.start(now);
      this.oscSecondary.start(now);
    } else if (mode === 'isochronic') {
      // Isochronic pulse: Amplitude modulation with LFO
      this.pulseGain = this.ctx.createGain();
      this.pulseGain.gain.setValueAtTime(0.5, now);

      this.oscPrimary = this.ctx.createOscillator();
      this.oscPrimary.type = 'sine';
      this.oscPrimary.frequency.setValueAtTime(freq, now);

      // LFO for pulse rate (e.g. 7.83 Hz or 10 Hz)
      const pulseRate = binauralDelta || 7.83;
      this.lfoOsc = this.ctx.createOscillator();
      this.lfoOsc.type = 'sine';
      this.lfoOsc.frequency.setValueAtTime(pulseRate, now);

      const lfoGain = this.ctx.createGain();
      lfoGain.gain.setValueAtTime(0.4, now);

      this.lfoOsc.connect(lfoGain);
      lfoGain.connect(this.pulseGain.gain);

      this.oscPrimary.connect(this.pulseGain);
      this.pulseGain.connect(this.masterGain);

      this.oscPrimary.start(now);
      this.lfoOsc.start(now);
    } else if (mode === 'harmonic_stack') {
      // Solfeggio / Trinity stack: Root + Perfect Fifth (1.5x) + Octave (2.0x)
      this.oscPrimary = this.ctx.createOscillator();
      this.oscPrimary.type = 'sine';
      this.oscPrimary.frequency.setValueAtTime(freq, now);

      this.oscSecondary = this.ctx.createOscillator();
      this.oscSecondary.type = 'sine';
      this.oscSecondary.frequency.setValueAtTime(freq * 1.5, now);

      this.oscTertiary = this.ctx.createOscillator();
      this.oscTertiary.type = 'sine';
      this.oscTertiary.frequency.setValueAtTime(freq * 2.0, now);

      const g1 = this.ctx.createGain();
      const g2 = this.ctx.createGain();
      const g3 = this.ctx.createGain();
      g1.gain.setValueAtTime(0.5, now);
      g2.gain.setValueAtTime(0.25, now);
      g3.gain.setValueAtTime(0.15, now);

      this.oscPrimary.connect(g1);
      this.oscSecondary.connect(g2);
      this.oscTertiary.connect(g3);

      g1.connect(this.masterGain);
      g2.connect(this.masterGain);
      g3.connect(this.masterGain);

      this.oscPrimary.start(now);
      this.oscSecondary.start(now);
      this.oscTertiary.start(now);
    }

    this.notify();
  }

  public stop() {
    if (this.ctx) {
      const now = this.ctx.currentTime;
      try {
        if (this.oscPrimary) {
          this.oscPrimary.stop(now);
          this.oscPrimary.disconnect();
          this.oscPrimary = null;
        }
        if (this.oscSecondary) {
          this.oscSecondary.stop(now);
          this.oscSecondary.disconnect();
          this.oscSecondary = null;
        }
        if (this.oscTertiary) {
          this.oscTertiary.stop(now);
          this.oscTertiary.disconnect();
          this.oscTertiary = null;
        }
        if (this.lfoOsc) {
          this.lfoOsc.stop(now);
          this.lfoOsc.disconnect();
          this.lfoOsc = null;
        }
      } catch {
        // Ignored if already stopped
      }
    }
    this.state.isPlaying = false;
    this.notify();
  }

  public setVolume(vol: number) {
    this.state.volume = Math.max(0, Math.min(1, vol));
    if (this.ctx && this.masterGain) {
      this.masterGain.gain.setTargetAtTime(this.state.volume, this.ctx.currentTime, 0.05);
    }
    this.notify();
  }

  public setFrequency(freq: number) {
    this.state.frequency = freq;
    if (this.state.isPlaying) {
      this.start(freq, this.state.mode, this.state.binauralDelta);
    } else {
      this.notify();
    }
  }

  public setMode(mode: SoundMode) {
    this.state.mode = mode;
    if (this.state.isPlaying) {
      this.start(this.state.frequency, mode, this.state.binauralDelta);
    } else {
      this.notify();
    }
  }

  public setHeartRateCoupled(coupled: boolean, currentBpm = 65) {
    this.state.heartRateCoupled = coupled;
    this.state.targetBpm = currentBpm;
    if (coupled && this.state.isPlaying && this.state.mode === 'binaural') {
      // Map elevated heart rate into entrainment:
      // When HR is higher (e.g. 90), target Theta (5.5 Hz) to pull autonomic down
      // When HR is balanced (60-70), target 7.83 Hz Schumann / 10 Hz Alpha
      const adaptiveDelta = currentBpm > 80 ? 6.0 : (currentBpm < 58 ? 12.0 : 7.83);
      this.state.binauralDelta = adaptiveDelta;
      this.start(this.state.frequency, this.state.mode, adaptiveDelta);
    } else {
      this.notify();
    }
  }

  public getVisualizerData(): { frequencyData: Uint8Array; timeData: Uint8Array } | null {
    if (!this.analyser) return null;
    const bufferLength = this.analyser.frequencyBinCount;
    const frequencyData = new Uint8Array(bufferLength);
    const timeData = new Uint8Array(bufferLength);
    this.analyser.getByteFrequencyData(frequencyData);
    this.analyser.getByteTimeDomainData(timeData);
    return { frequencyData, timeData };
  }

  public getState(): SoundEngineState {
    return { ...this.state };
  }
}

export const soundEngine = new ResonanceSoundEngine();
