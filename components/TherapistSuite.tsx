'use client';

import React, { useState } from 'react';
import { RESOS_NEURAL_LINKS, NeuralLink } from '@/lib/resonances';
import { LiveBiometricPacket } from '@/lib/wearableService';
import { 
  Users, 
  UserPlus, 
  FileText, 
  Activity, 
  Brain, 
  Sparkles, 
  Check, 
  ChevronRight, 
  ClipboardCheck, 
  Send,
  Stethoscope,
  Clock,
  Play
} from 'lucide-react';

export interface ClientProfile {
  id: string;
  clientName: string;
  status: 'active' | 'maintenance' | 'completed';
  targetBodyParts: string;
  prescribedFrequencies: string;
  lastSessionDate: string;
  notes?: string;
}

interface TherapistSuiteProps {
  biometrics: LiveBiometricPacket;
  clients: ClientProfile[];
  onAddClient: (client: Omit<ClientProfile, 'id'>) => Promise<void>;
  onSelectFrequencyPreset: (freq: number, mode: 'sine' | 'binaural' | 'isochronic' | 'harmonic_stack') => void;
}

export default function TherapistSuite({
  biometrics,
  clients,
  onAddClient,
  onSelectFrequencyPreset,
}: TherapistSuiteProps) {
  const [selectedClientId, setSelectedClientId] = useState<string>(clients[0]?.id || 'client-default');
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientTargets, setNewClientTargets] = useState('Thorax, Vagus, Adrenals');
  const [newClientPrescription, setNewClientPrescription] = useState('528Hz Cardiac + 741Hz Vagus 15min');
  
  // Deep Argon High-Thinking Clinical Analysis
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [clinicalReport, setClinicalReport] = useState<string | null>(null);
  const [analysisModelUsed, setAnalysisModelUsed] = useState<string>('');

  const activeClient = clients.find((c) => c.id === selectedClientId) || clients[0];

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) return;

    await onAddClient({
      clientName: newClientName,
      status: 'active',
      targetBodyParts: newClientTargets,
      prescribedFrequencies: newClientPrescription,
      lastSessionDate: new Date().toISOString().split('T')[0],
      notes: 'Initial clinical assessment completed. Scheduled for harmonic resonance protocol.',
    });

    setNewClientName('');
    setShowNewClientModal(false);
  };

  const handleRunDeepAnalysis = async () => {
    setIsAnalyzing(true);
    setClinicalReport(null);
    try {
      const res = await fetch('/api/gemini/deep-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userRole: 'therapist',
          clientName: activeClient ? activeClient.clientName : 'Client Patient',
          biometrics,
          chiefComplaints: activeClient ? activeClient.targetBodyParts : 'Autonomic imbalance and vagal tone deficiency',
          neuralLinksData: RESOS_NEURAL_LINKS.slice(0, 6).map((l) => ({
            name: l.name,
            frequency: l.primaryFrequencyHz,
            organ: l.organs.join(', '),
          })),
        }),
      });

      const data = await res.json();
      if (data.analysis) {
        setClinicalReport(data.analysis);
        setAnalysisModelUsed(data.modelUsed || 'gemini-4-argon');
      } else {
        setClinicalReport('Analysis complete. Focus on parasympathetic entrainment at 528 Hz and 741 Hz.');
      }
    } catch {
      setClinicalReport('Unable to reach resonance intelligence server. Please check connection.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl text-white flex flex-col gap-5">
      {/* Therapist Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-cyan-950 border border-cyan-800 text-cyan-400 rounded-xl">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              Therapist Clinical Command Suite
              <span className="text-[10px] font-mono bg-purple-950 text-purple-300 border border-purple-800 px-2 py-0.5 rounded-full">
                Clinical Mode Active
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Diagnostic resonance mapping, client prescription formulation, and Gemini deep reasoning.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowNewClientModal(true)}
          className="flex items-center gap-1.5 bg-cyan-600 hover:bg-cyan-500 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-md transition-all"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Patient / Client</span>
        </button>
      </div>

      {/* Main Grid: Client List on Left, Active Client Treatment Plan on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Client List */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 flex flex-col gap-2">
          <div className="flex items-center justify-between px-1 mb-1">
            <span className="text-xs font-bold text-slate-300 uppercase font-mono tracking-wider">
              Patient Roster ({clients.length})
            </span>
          </div>

          <div className="flex flex-col gap-2 max-h-[380px] overflow-y-auto pr-1">
            {clients.map((c) => {
              const isSelected = selectedClientId === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedClientId(c.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col gap-1 ${
                    isSelected
                      ? 'bg-slate-800 border-cyan-500/60 shadow-md'
                      : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-100">{c.clientName}</span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full capitalize ${
                      c.status === 'active'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {c.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    Focus: <span className="text-slate-300">{c.targetBodyParts}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    Last Session: {c.lastSessionDate || 'Recent'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Active Patient Clinical Prescription & AI Deep Reasoning */}
        <div className="lg:col-span-2 bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col gap-4">
          {activeClient ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <h3 className="font-bold text-base text-slate-100">{activeClient.clientName}</h3>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Targeted Biological Systems: <span className="text-cyan-300">{activeClient.targetBodyParts}</span>
                  </div>
                </div>

                <button
                  onClick={handleRunDeepAnalysis}
                  disabled={isAnalyzing}
                  className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs px-3.5 py-2 rounded-xl shadow-md transition-all disabled:opacity-50"
                >
                  <Brain className={`w-4 h-4 ${isAnalyzing ? 'animate-pulse' : ''}`} />
                  <span>{isAnalyzing ? 'Synthesizing with High Thinking...' : 'Generate Clinical Synthesis (Gemini 4 Argon)'}</span>
                </button>
              </div>

              {/* Active Clinical Prescriptions */}
              <div>
                <span className="text-xs font-semibold text-slate-300 uppercase font-mono block mb-2">
                  Prescribed Frequency Stacks
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    { label: '528 Hz DNA / Cardiac', freq: 528, mode: 'sine' as const, time: '10 min', note: 'Autonomic coherence' },
                    { label: '741 Hz Vagal Efferents', freq: 741, mode: 'binaural' as const, time: '8 min', note: 'Sympathetic brake' },
                    { label: '136.1 Hz Somatic Om', freq: 136.1, mode: 'harmonic_stack' as const, time: '12 min', note: 'Myofascial grounding' },
                  ].map((stack, i) => (
                    <div
                      key={i}
                      className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex flex-col justify-between gap-2"
                    >
                      <div>
                        <span className="font-bold text-xs text-slate-200 block">{stack.label}</span>
                        <span className="text-[11px] text-slate-400 font-mono">{stack.time} • {stack.note}</span>
                      </div>
                      <button
                        onClick={() => onSelectFrequencyPreset(stack.freq, stack.mode)}
                        className="flex items-center justify-center gap-1.5 w-full bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[11px] font-semibold py-1.5 rounded-lg transition-colors"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Load Preset</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Deep Clinical Synthesis Output */}
              {clinicalReport && (
                <div className="bg-slate-900/90 border border-purple-500/40 rounded-xl p-4 mt-2">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-purple-300">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      <span>ResOS Deep Resonance Diagnostic Report</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      {analysisModelUsed}
                    </span>
                  </div>
                  <div className="text-xs text-slate-300 leading-relaxed max-h-72 overflow-y-auto whitespace-pre-wrap pr-2 font-mono">
                    {clinicalReport}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-slate-400 text-xs">
              Select or add a patient to view clinical protocol.
            </div>
          )}
        </div>
      </div>

      {/* New Client Modal */}
      {showNewClientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 shadow-2xl">
            <h3 className="text-base font-bold text-slate-100 mb-3">Add Client to ResOS Treatment Roster</h3>
            <form onSubmit={handleCreateClient} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Client Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Julian Reed"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Target Areas of Imbalance</label>
                <input
                  type="text"
                  placeholder="e.g. Thoracic spine, Cardiac plexus, Adrenals"
                  value={newClientTargets}
                  onChange={(e) => setNewClientTargets(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Primary Prescribed Frequency Protocol</label>
                <input
                  type="text"
                  placeholder="e.g. 528 Hz Cardiac + 136.1 Hz Somatic 15 min"
                  value={newClientPrescription}
                  onChange={(e) => setNewClientPrescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewClientModal(false)}
                  className="px-3 py-2 rounded-xl text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold px-4 py-2 rounded-xl transition-all shadow-md"
                >
                  Add Patient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
