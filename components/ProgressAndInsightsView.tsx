'use client';

import React, { useState } from 'react';
import { LiveBiometricPacket } from '@/lib/wearableService';
import { 
  TrendingUp, 
  Sparkles, 
  Calendar, 
  Clock, 
  Heart, 
  Zap, 
  Activity, 
  BookMarked,
  CheckCircle2,
  RefreshCw,
  Sun,
  ShieldCheck
} from 'lucide-react';

export interface SavedHealingSession {
  id: string;
  bodyPart: string;
  frequencyHz: number;
  durationSeconds: number;
  avgHeartRate: number;
  coherenceScore: number;
  notes: string;
  completedAt: string;
}

export interface SavedDailyInsight {
  id: string;
  date: string;
  content: string;
  recommendedAction?: string;
  generatedAt: string;
}

interface ProgressAndInsightsViewProps {
  sessions: SavedHealingSession[];
  insights: SavedDailyInsight[];
  biometrics: LiveBiometricPacket;
  onGenerateDailyInsight: () => Promise<void>;
  isGeneratingInsight: boolean;
}

export default function ProgressAndInsightsView({
  sessions,
  insights,
  biometrics,
  onGenerateDailyInsight,
  isGeneratingInsight,
}: ProgressAndInsightsViewProps) {
  const [activeTab, setActiveTab] = useState<'insights' | 'sessions' | 'metrics'>('insights');

  // Compute stats
  const totalMinutes = Math.round(sessions.reduce((acc, s) => acc + s.durationSeconds, 0) / 60);
  const avgCoherence = sessions.length > 0
    ? Math.round(sessions.reduce((acc, s) => acc + s.coherenceScore, 0) / sessions.length)
    : biometrics.coherenceScore;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl text-white flex flex-col gap-5">
      {/* Header with Stats Summary */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-lg text-slate-100">
              Progress Tracking & Daily Wellness Insights
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Holistic bio-resonance telemetry history and AI-synthesized circadian guidance.
          </p>
        </div>

        <button
          onClick={onGenerateDailyInsight}
          disabled={isGeneratingInsight}
          className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white font-semibold text-xs px-4 py-2 rounded-xl shadow-md transition-all disabled:opacity-50"
        >
          {isGeneratingInsight ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Generating Insight...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              <span>Generate Today&apos;s AI Insight</span>
            </>
          )}
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl">
          <div className="text-[10px] text-slate-400 uppercase font-mono">Total Therapy Time</div>
          <div className="text-xl font-bold font-mono text-cyan-300 mt-1">
            {totalMinutes} <span className="text-xs text-slate-400 font-normal">mins</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">{sessions.length} recorded sessions</div>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl">
          <div className="text-[10px] text-slate-400 uppercase font-mono">Mean Coherence</div>
          <div className="text-xl font-bold font-mono text-emerald-300 mt-1">
            {avgCoherence}%
          </div>
          <div className="text-[10px] text-emerald-500 mt-1">Autonomic equilibrium</div>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl">
          <div className="text-[10px] text-slate-400 uppercase font-mono">Current HRV (RMSSD)</div>
          <div className="text-xl font-bold font-mono text-purple-300 mt-1">
            {biometrics.hrv} <span className="text-xs text-slate-400 font-normal">ms</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Healthy parasympathetic range</div>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl">
          <div className="text-[10px] text-slate-400 uppercase font-mono">Stress Index</div>
          <div className="text-xl font-bold font-mono text-amber-300 mt-1">
            {biometrics.stressIndex} <span className="text-xs text-slate-400 font-normal">/100</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Normal baseline</div>
        </div>
      </div>

      {/* View Switcher Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('insights')}
          className={`flex items-center gap-1.5 pb-2 -mb-2 border-b-2 transition-all ${
            activeTab === 'insights'
              ? 'border-cyan-400 text-cyan-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sun className="w-3.5 h-3.5" />
          <span>Personalised Daily Insights ({insights.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('sessions')}
          className={`flex items-center gap-1.5 pb-2 -mb-2 border-b-2 transition-all ml-3 ${
            activeTab === 'sessions'
              ? 'border-cyan-400 text-cyan-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Healing Session History ({sessions.length})</span>
        </button>
      </div>

      {/* Tab 1: Daily Insights Stream */}
      {activeTab === 'insights' && (
        <div className="space-y-3">
          {insights.length === 0 ? (
            <div className="text-center py-10 bg-slate-950/50 rounded-xl border border-dashed border-slate-800 text-slate-400 text-xs flex flex-col items-center gap-2">
              <Sun className="w-8 h-8 text-amber-400/60" />
              <span>No daily insights generated yet for today.</span>
              <button
                onClick={onGenerateDailyInsight}
                className="text-cyan-400 hover:underline font-medium"
              >
                Click here to generate your customized bio-harmonic insight
              </button>
            </div>
          ) : (
            insights.map((ins) => (
              <div
                key={ins.id}
                className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col gap-2 hover:border-slate-700 transition-all"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-cyan-300 flex items-center gap-1.5 font-mono">
                    <Calendar className="w-3.5 h-3.5" />
                    {ins.date}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Synthesized by Gemini
                  </span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {ins.content}
                </p>
                {ins.recommendedAction && (
                  <div className="mt-1 bg-cyan-950/40 border border-cyan-800/50 p-2.5 rounded-lg text-xs text-cyan-200 flex items-center gap-2 font-mono">
                    <Zap className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span><strong>Action:</strong> {ins.recommendedAction}</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Healing Session History */}
      {activeTab === 'sessions' && (
        <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
          {sessions.length === 0 ? (
            <div className="text-center py-10 bg-slate-950/50 rounded-xl border border-dashed border-slate-800 text-slate-400 text-xs">
              No healing sessions logged yet. Complete a frequency transmission above to record progress.
            </div>
          ) : (
            sessions.map((sess) => (
              <div
                key={sess.id}
                className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs hover:border-slate-700 transition-all"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-100">{sess.bodyPart}</span>
                    <span className="text-[11px] font-mono text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                      {sess.frequencyHz} Hz
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 line-clamp-1">{sess.notes}</div>
                </div>

                <div className="flex items-center gap-4 text-right font-mono text-[11px]">
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase">Duration</div>
                    <div className="text-slate-300 font-semibold">{Math.round(sess.durationSeconds / 60)}m {sess.durationSeconds % 60}s</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase">Avg Pulse</div>
                    <div className="text-rose-400 font-semibold">{sess.avgHeartRate} BPM</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase">Coherence</div>
                    <div className="text-emerald-400 font-semibold">{sess.coherenceScore}%</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
