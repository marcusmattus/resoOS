'use client';

import React, { useState } from 'react';
import { RESOS_NEURAL_LINKS, NeuralLink } from '@/lib/resonances';
import { LiveBiometricPacket } from '@/lib/wearableService';
import { 
  Activity, 
  Sparkles, 
  Play, 
  BookOpen, 
  Check, 
  AlertTriangle, 
  Volume2, 
  Save, 
  ExternalLink,
  ChevronRight,
  Filter
} from 'lucide-react';

interface NeuralLinkBioChartProps {
  selectedLink: NeuralLink;
  onSelectLink: (link: NeuralLink) => void;
  biometrics: LiveBiometricPacket;
  imbalancedIds?: string[];
  onSaveBioChart?: (chart: {
    title: string;
    overallResonance: number;
    primaryImbalance: string;
    recommendedFrequencyHz: number;
    soundWaveType: string;
    neuralLinksData: string;
  }) => Promise<void>;
}

export default function NeuralLinkBioChart({
  selectedLink,
  onSelectLink,
  biometrics,
  imbalancedIds = ['link-3', 'link-4', 'link-8'],
  onSaveBioChart,
}: NeuralLinkBioChartProps) {
  const [filterRegion, setFilterRegion] = useState<string>('all');
  const [isSavingChart, setIsSavingChart] = useState(false);
  const [saveChartSuccess, setSaveChartSuccess] = useState(false);

  // Compute dynamic harmonic resonance score for each link based on biometrics
  const getLinkResonance = (link: NeuralLink) => {
    const isImbalanced = imbalancedIds.includes(link.id);
    if (isImbalanced) {
      // Lower score if flagged by scan or heart rate extremes
      return Math.max(38, Math.round(biometrics.coherenceScore * 0.65));
    }
    const delta = Math.abs(link.primaryFrequencyHz - 528);
    const score = Math.min(98, Math.max(50, Math.round(biometrics.coherenceScore + (100 - delta / 10) * 0.15)));
    return score;
  };

  const overallResonanceScore = Math.round(
    RESOS_NEURAL_LINKS.reduce((acc, l) => acc + getLinkResonance(l), 0) / RESOS_NEURAL_LINKS.length
  );

  const handleBuildAndSaveChart = async () => {
    if (!onSaveBioChart) return;
    setIsSavingChart(true);
    try {
      const summaryData = RESOS_NEURAL_LINKS.map((l) => ({
        id: l.id,
        name: l.name,
        frequencyHz: l.primaryFrequencyHz,
        score: getLinkResonance(l),
        status: imbalancedIds.includes(l.id) ? 'Imbalance' : 'Coherent',
      }));

      await onSaveBioChart({
        title: `ResOS Full Bio-Resonance Chart (${new Date().toLocaleDateString()})`,
        overallResonance: overallResonanceScore,
        primaryImbalance: selectedLink.name,
        recommendedFrequencyHz: selectedLink.primaryFrequencyHz,
        soundWaveType: selectedLink.waveType,
        neuralLinksData: JSON.stringify(summaryData),
      });

      setSaveChartSuccess(true);
      setTimeout(() => setSaveChartSuccess(false), 4000);
    } finally {
      setIsSavingChart(false);
    }
  };

  const filteredLinks = RESOS_NEURAL_LINKS.filter((l) => {
    if (filterRegion === 'cranial') return l.number <= 2;
    if (filterRegion === 'thoracic') return l.number >= 3 && l.number <= 5;
    if (filterRegion === 'abdominal') return l.number >= 6 && l.number <= 9;
    if (filterRegion === 'somatic') return l.number >= 10;
    return true;
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl text-white flex flex-col gap-5">
      {/* Bio Chart Header & Action */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-slate-100">
              ResOS Bio-Chart: 12 Neural Links
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
              Biometric Synchronized
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Harmonic resonance frequency mapping for every body part, organ cluster, and neural plexus.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800 flex items-center gap-3">
            <div>
              <div className="text-[10px] text-slate-400 font-mono uppercase">Overall Bio-Resonance</div>
              <div className="text-base font-black font-mono text-cyan-300">{overallResonanceScore}%</div>
            </div>
          </div>

          <button
            onClick={handleBuildAndSaveChart}
            disabled={isSavingChart}
            className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-md transition-all disabled:opacity-50"
          >
            {isSavingChart ? (
              <span>Saving Chart...</span>
            ) : saveChartSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                <span>Chart Saved!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Bio-Chart</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-medium">
        <span className="text-slate-400 flex items-center gap-1 text-[11px] mr-1">
          <Filter className="w-3 h-3" /> Filter:
        </span>
        {[
          { id: 'all', label: 'All 12 Links' },
          { id: 'cranial', label: 'Cranial & Optic' },
          { id: 'thoracic', label: 'Thoracic & Heart' },
          { id: 'abdominal', label: 'Abdominal & Enteric' },
          { id: 'somatic', label: 'Somatic & Biofield' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterRegion(tab.id)}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
              filterRegion === tab.id
                ? 'bg-slate-800 text-cyan-400 border border-cyan-500/40'
                : 'bg-slate-950/60 text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 12 Neural Links Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredLinks.map((link) => {
          const isSelected = selectedLink.id === link.id;
          const isImbalanced = imbalancedIds.includes(link.id);
          const score = getLinkResonance(link);

          return (
            <div
              key={link.id}
              onClick={() => onSelectLink(link)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between gap-2.5 ${
                isSelected
                  ? 'bg-slate-800/90 border-cyan-400 ring-1 ring-cyan-400 shadow-lg'
                  : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
              }`}
            >
              {/* Active glow side stripe */}
              <div
                className="absolute left-0 top-0 bottom-0 w-1.5"
                style={{ backgroundColor: link.colorHex }}
              />

              <div className="pl-1.5">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[11px] font-mono text-slate-400">{link.code}</span>
                  {isImbalanced ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-800/60 font-mono flex items-center gap-1">
                      <AlertTriangle className="w-2.5 h-2.5" /> Imbalance
                    </span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 font-mono">
                      Coherent
                    </span>
                  )}
                </div>

                <h4 className="font-bold text-sm text-slate-100 mt-1 line-clamp-1">{link.name}</h4>
                <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{link.bodyPart}</p>
              </div>

              {/* Frequency & Resonance Score Bar */}
              <div className="pl-1.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Frequency</span>
                  <span className="font-bold font-mono text-cyan-300">
                    {link.primaryFrequencyHz} <span className="text-[10px] font-normal text-slate-400">Hz</span>
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Resonance</span>
                  <span className={`font-mono font-bold ${score > 75 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {score}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed Clinical Inspector Card for Selected Neural Link */}
      <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className="w-3.5 h-3.5 rounded-full"
              style={{ backgroundColor: selectedLink.colorHex }}
            />
            <h3 className="font-bold text-base text-slate-100">
              {selectedLink.name} — Clinical Bio-Resonance Blueprint
            </h3>
          </div>
          <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/50 px-2.5 py-1 rounded-md">
            Delivery: {selectedLink.waveType.toUpperCase()} @ {selectedLink.primaryFrequencyHz} Hz
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs mt-1">
          <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800/80">
            <span className="text-[10px] text-slate-400 font-mono uppercase block mb-1">Target Anatomy & Organs</span>
            <div className="flex flex-wrap gap-1">
              {selectedLink.organs.map((org) => (
                <span key={org} className="bg-slate-800 text-slate-200 px-2 py-0.5 rounded text-[11px]">
                  {org}
                </span>
              ))}
            </div>
            <p className="text-[11px] text-slate-300 mt-2">{selectedLink.description}</p>
          </div>

          <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800/80">
            <span className="text-[10px] text-slate-400 font-mono uppercase block mb-1">Harmonic & Entrainment Specs</span>
            <div className="space-y-1 font-mono text-[11px]">
              <div>Harmonics: <span className="text-cyan-300">{selectedLink.harmonicsHz.join(', ')} Hz</span></div>
              {selectedLink.solfeggioHz && <div>Solfeggio Key: <span className="text-emerald-300">{selectedLink.solfeggioHz} Hz</span></div>}
              {selectedLink.nogierBand && <div>Nogier Band: <span className="text-amber-300">{selectedLink.nogierBand}</span></div>}
              <div>Brainwave Coupling: <span className="text-purple-300">{selectedLink.brainwaveBand}</span></div>
            </div>
          </div>

          <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800/80 flex flex-col justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-mono uppercase block mb-1">Biomedical Mechanism & Evidence</span>
              <p className="text-[11px] text-slate-300 leading-relaxed">{selectedLink.biomedicalMechanism}</p>
            </div>
            {selectedLink.doiCitation && (
              <div className="mt-2 text-[10px] font-mono text-cyan-400/90 bg-cyan-950/40 p-1.5 rounded flex items-center justify-between">
                <span className="truncate">{selectedLink.doiCitation}</span>
                <BookOpen className="w-3 h-3 shrink-0 ml-1" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
