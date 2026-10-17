'use client';

import React, { useEffect, useRef, useState } from 'react';
import { soundEngine, SoundMode, SoundEngineState } from '@/lib/soundEngine';
import { NeuralLink, RESOS_NEURAL_LINKS } from '@/lib/resonances';
import { LiveBiometricPacket } from '@/lib/wearableService';
import { 
  Play, 
  Square, 
  Volume2, 
  VolumeX, 
  Sliders, 
  Heart, 
  Zap, 
  Waves, 
  Headphones, 
  Sparkles,
  Clock,
  Save,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';

interface SessionVisualFeedbackProps {
  activeLink: NeuralLink;
  biometrics: LiveBiometricPacket;
  onSaveSession: (sessionData: {
    bodyPart: string;
    frequencyHz: number;
    durationSeconds: number;
    avgHeartRate: number;
    coherenceScore: number;
    notes: string;
  }) => Promise<void>;
}

export default function SessionVisualFeedback({
  activeLink,
  biometrics,
  onSaveSession,
}: SessionVisualFeedbackProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [engineState, setEngineState] = useState<SoundEngineState>(soundEngine.getState());
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionNotes, setSessionNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [breathingPhase, setBreathingPhase] = useState<'Inhale' | 'Hold' | 'Exhale'>('Inhale');

  const hrHistory = useRef<number[]>([]);

  // Subscribe to sound engine state
  useEffect(() => {
    const unsub = soundEngine.subscribe((state) => {
      setEngineState(state);
    });
    return () => {
      unsub();
    };
  }, []);

  // Update sound engine frequency when activeLink changes
  useEffect(() => {
    if (activeLink) {
      soundEngine.setFrequency(activeLink.primaryFrequencyHz);
      soundEngine.setMode(activeLink.waveType);
    }
  }, [activeLink]);

  // Session duration timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isSessionActive) {
      timer = setInterval(() => {
        setSessionSeconds((s) => s + 1);
        hrHistory.current.push(biometrics.heartRate);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isSessionActive, biometrics.heartRate]);

  // Breathing pacer cycle (4s inhale, 2s hold, 6s exhale = 12s cycle / 5 breaths per min)
  useEffect(() => {
    let phaseTimer: NodeJS.Timeout;
    let cycleCount = 0;
    const updateBreathing = () => {
      const mod = cycleCount % 12;
      if (mod < 4) {
        setBreathingPhase('Inhale');
      } else if (mod < 6) {
        setBreathingPhase('Hold');
      } else {
        setBreathingPhase('Exhale');
      }
      cycleCount++;
    };
    phaseTimer = setInterval(updateBreathing, 1000);
    return () => clearInterval(phaseTimer);
  }, []);

  // Real-Time Visual Feedback Canvas Loop (Cymatics interference & Lissajous)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let phase = 0;

    const render = () => {
      animId = requestAnimationFrame(render);
      phase += 0.03;

      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;

      // Dark background with gradient fade
      ctx.fillStyle = 'rgba(6, 9, 19, 0.25)';
      ctx.fillRect(0, 0, width, height);

      const visualizerData = soundEngine.getVisualizerData();
      const isPlaying = engineState.isPlaying;

      // 1. Draw Coherence Pulse Aura (Centered biofield circle)
      const hr = biometrics.heartRate || 68;
      const coh = biometrics.coherenceScore || 75;
      const pulseRadius = 75 + Math.sin(phase * (hr / 20)) * 12 + (coh * 0.4);

      const auraGrad = ctx.createRadialGradient(
        centerX, centerY, 10,
        centerX, centerY, pulseRadius * 1.5
      );
      auraGrad.addColorStop(0, `${activeLink.colorHex}55`);
      auraGrad.addColorStop(0.5, `${activeLink.colorHex}22`);
      auraGrad.addColorStop(1, 'transparent');

      ctx.beginPath();
      ctx.arc(centerX, centerY, pulseRadius * 1.5, 0, Math.PI * 2);
      ctx.fillStyle = auraGrad;
      ctx.fill();

      // 2. Draw Cymatic Resonance Flower / Lissajous Waveform
      const points = 180;
      const freqMultiplier = Math.max(1, Math.min(12, Math.round(activeLink.primaryFrequencyHz / 100)));

      ctx.beginPath();
      ctx.lineWidth = isPlaying ? 2.5 : 1.2;
      ctx.strokeStyle = isPlaying ? activeLink.colorHex : '#475569';

      for (let i = 0; i <= points; i++) {
        const theta = (i / points) * Math.PI * 2;
        let fftAmp = 0;
        if (visualizerData && visualizerData.frequencyData) {
          const index = Math.floor((i / points) * (visualizerData.frequencyData.length / 4));
          fftAmp = (visualizerData.frequencyData[index] || 0) * 0.25;
        }

        const r = pulseRadius + Math.sin(theta * freqMultiplier + phase) * (isPlaying ? 18 + fftAmp : 8);
        const x = centerX + Math.cos(theta) * r;
        const y = centerY + Math.sin(theta) * r;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();

      // 3. Inner Oscilloscope Wave Line
      if (visualizerData && visualizerData.timeData && isPlaying) {
        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#38bdf8';
        const sliceWidth = width / visualizerData.timeData.length;
        let x = 0;

        for (let i = 0; i < visualizerData.timeData.length; i += 2) {
          const v = visualizerData.timeData[i] / 128.0;
          const y = (v * height) / 2;

          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);

          x += sliceWidth * 2;
        }
        ctx.stroke();
      }

      // 4. Center Resonance Core Point
      ctx.beginPath();
      ctx.arc(centerX, centerY, 6 + Math.sin(phase * 4) * 2, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.shadowBlur = 15;
      ctx.shadowColor = activeLink.colorHex;
      ctx.fill();
      ctx.shadowBlur = 0;
    };

    render();

    return () => cancelAnimationFrame(animId);
  }, [engineState.isPlaying, activeLink, biometrics]);

  const handleTogglePlay = () => {
    if (engineState.isPlaying) {
      soundEngine.stop();
      setIsSessionActive(false);
    } else {
      soundEngine.start(activeLink.primaryFrequencyHz, activeLink.waveType, activeLink.targetBinauralDelta);
      setIsSessionActive(true);
      setSaveSuccess(false);
    }
  };

  const handleSave = async () => {
    if (sessionSeconds === 0) return;
    setIsSaving(true);
    try {
      const avgHR = hrHistory.current.length > 0
        ? Math.round(hrHistory.current.reduce((a, b) => a + b, 0) / hrHistory.current.length)
        : biometrics.heartRate;

      await onSaveSession({
        bodyPart: activeLink.bodyPart,
        frequencyHz: activeLink.primaryFrequencyHz,
        durationSeconds: sessionSeconds,
        avgHeartRate: avgHR,
        coherenceScore: biometrics.coherenceScore,
        notes: sessionNotes || `Session focused on ${activeLink.name} with ${activeLink.waveType} resonance at ${activeLink.primaryFrequencyHz} Hz.`,
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } finally {
      setIsSaving(false);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-5 text-white">
      {/* Header with active link details */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: activeLink.colorHex }}
            />
            <h3 className="font-bold text-lg text-slate-100">{activeLink.name}</h3>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
              {activeLink.code}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">{activeLink.bodyPart}</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-xs font-mono">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Session: {formatTime(sessionSeconds)}</span>
          </div>
          <button
            onClick={handleTogglePlay}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${
              engineState.isPlaying
                ? 'bg-rose-600 hover:bg-rose-500 text-white'
                : 'bg-gradient-to-r from-cyan-500 to-emerald-500 hover:opacity-95 text-slate-950'
            }`}
          >
            {engineState.isPlaying ? (
              <>
                <Square className="w-4 h-4 fill-current" />
                <span>Pause Tone</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Transmit Frequency</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Visual Feedback Loop Canvas + Pacer Box */}
      <div className="relative w-full h-52 bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={600}
          height={210}
          className="w-full h-full object-contain"
        />

        {/* Real-time Breathing & Resonance Pacer HUD */}
        <div className="absolute top-3 left-3 bg-slate-900/85 px-3 py-1.5 rounded-lg border border-slate-700/80 text-[11px] font-mono flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
          <span>Resonance Pacer: <strong className="text-cyan-300">{breathingPhase}</strong></span>
        </div>

        {/* Live Resonance Output Badge */}
        <div className="absolute top-3 right-3 bg-slate-900/85 px-3 py-1.5 rounded-lg border border-slate-700/80 text-[11px] font-mono flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>Output: <strong className="text-emerald-300">
            {engineState.isPlaying ? Math.round((biometrics.coherenceScore * 0.7) + 28) : 0}% Harmonic
          </strong></span>
        </div>

        {/* Center frequency display overlay */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-center pointer-events-none">
          <span className="text-2xl font-black font-mono tracking-wider text-slate-100">
            {engineState.frequency.toFixed(1)} <span className="text-xs text-cyan-400 font-normal">Hz</span>
          </span>
          <div className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">
            {activeLink.waveType.replace('_', ' ')} • {activeLink.brainwaveBand}
          </div>
        </div>
      </div>

      {/* Waveform & Harmonic Customization Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Waveform Selector */}
        <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl flex flex-col gap-2">
          <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Waves className="w-3.5 h-3.5 text-cyan-400" />
            Acoustic Delivery Mode
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {(['sine', 'binaural', 'isochronic', 'harmonic_stack'] as SoundMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => soundEngine.setMode(mode)}
                className={`py-1.5 px-2.5 rounded-lg font-medium capitalize text-left transition-all ${
                  engineState.mode === mode
                    ? 'bg-cyan-950 border border-cyan-500 text-cyan-200'
                    : 'bg-slate-800/60 border border-slate-700/60 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {mode.replace('_', ' ')}
              </button>
            ))}
          </div>
          {engineState.mode === 'binaural' && (
            <div className="text-[11px] text-cyan-300/80 bg-cyan-950/40 p-2 rounded border border-cyan-800/40 mt-1 flex items-center gap-2">
              <Headphones className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Headphones recommended. Delta entrainment: {activeLink.targetBinauralDelta} Hz.</span>
            </div>
          )}
        </div>

        {/* Biometric Coupling & Volume */}
        <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl flex flex-col justify-between gap-3">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-rose-400" />
                Heart-Rate Coupled Pacing
              </span>
              <button
                onClick={() => soundEngine.setHeartRateCoupled(!engineState.heartRateCoupled, biometrics.heartRate)}
                className={`text-[11px] font-mono px-2 py-0.5 rounded transition-all ${
                  engineState.heartRateCoupled
                    ? 'bg-rose-950 border border-rose-500 text-rose-300'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {engineState.heartRateCoupled ? 'ACTIVE' : 'OFF'}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Synchronizes modulation pace with your real-time heart rate ({biometrics.heartRate} BPM) for vagal entrainment.
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Volume</span>
              <span className="font-mono">{Math.round(engineState.volume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={engineState.volume}
              onChange={(e) => soundEngine.setVolume(parseFloat(e.target.value))}
              className="w-full accent-cyan-400 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Session Notes & Save to Bio-Chart */}
      <div className="pt-2 border-t border-slate-800 flex flex-col md:flex-row items-center gap-3">
        <input
          type="text"
          placeholder="Session reflections or therapist clinical observation..."
          value={sessionNotes}
          onChange={(e) => setSessionNotes(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
        />
        <button
          onClick={handleSave}
          disabled={sessionSeconds < 3 || isSaving}
          className="w-full md:w-auto shrink-0 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 px-4 py-2 rounded-xl text-xs font-medium text-slate-200 disabled:opacity-50 transition-all"
        >
          {isSaving ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Saving...</span>
            </>
          ) : saveSuccess ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-300">Saved to Cloud</span>
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5 text-cyan-400" />
              <span>Log Session ({formatTime(sessionSeconds)})</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
