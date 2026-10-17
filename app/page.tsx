'use client';

import React, { useState, useEffect } from 'react';
import { 
  auth, 
  db, 
  googleProvider, 
  handleFirestoreError, 
  OperationType, 
  testConnection 
} from '@/lib/firebase';
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User as FirebaseUser 
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import { RESOS_NEURAL_LINKS, NeuralLink, calculateCoherence } from '@/lib/resonances';
import { wearableManager, LiveBiometricPacket, WearableDevice } from '@/lib/wearableService';
import { soundEngine } from '@/lib/soundEngine';

import BiofieldScanner3D from '@/components/BiofieldScanner3D';
import SessionVisualFeedback from '@/components/SessionVisualFeedback';
import NeuralLinkBioChart from '@/components/NeuralLinkBioChart';
import WearableDeviceBar from '@/components/WearableDeviceBar';
import TherapistSuite, { ClientProfile } from '@/components/TherapistSuite';
import LiveVoiceCompanion from '@/components/LiveVoiceCompanion';
import ScienceLiteratureView from '@/components/ScienceLiteratureView';
import ProgressAndInsightsView, { SavedHealingSession, SavedDailyInsight } from '@/components/ProgressAndInsightsView';

import { 
  Activity, 
  Waves, 
  Brain, 
  Radio, 
  Sparkles, 
  UserCheck, 
  LogIn, 
  LogOut, 
  Shield, 
  Stethoscope, 
  User, 
  HeartHandshake, 
  BookOpen, 
  Clock, 
  Sliders,
  CheckCircle2
} from 'lucide-react';

export default function ResOSApp() {
  // Authentication & Role
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userRole, setUserRole] = useState<'individual' | 'therapist'>('individual');
  const [authLoading, setAuthLoading] = useState(true);

  // Active State & Selection
  const [activeLink, setActiveLink] = useState<NeuralLink>(RESOS_NEURAL_LINKS[3]); // Default Cardiac 528Hz
  const [activeViewTab, setActiveViewTab] = useState<'hologram' | 'chart' | 'voice' | 'science' | 'progress'>('hologram');
  
  // Biometrics & Wearable
  const [device, setDevice] = useState<WearableDevice>(wearableManager.getActiveDevice());
  const [biometrics, setBiometrics] = useState<LiveBiometricPacket>({
    heartRate: 68,
    hrv: 54,
    respiratoryRate: 14,
    stressIndex: 28,
    skinConductance: 2.1,
    coherenceScore: 78,
    timestamp: new Date().toISOString(),
    deviceSource: 'Apple Watch Ultra',
  });
  const [isScanning, setIsScanning] = useState(false);
  const [imbalancedIds, setImbalancedIds] = useState<string[]>(['link-3', 'link-4', 'link-8']);

  // Persisted Records
  const [sessions, setSessions] = useState<SavedHealingSession[]>([]);
  const [insights, setInsights] = useState<SavedDailyInsight[]>([]);
  const [clients, setClients] = useState<ClientProfile[]>([
    {
      id: 'client-1',
      clientName: 'Elena Rostova',
      status: 'active',
      targetBodyParts: 'Thorax & Vagus Nerve (Cardiac Plexus)',
      prescribedFrequencies: '528 Hz Cardiac DNA + 741 Hz Vagus Cleansing (15 mins)',
      lastSessionDate: '2026-10-16',
      notes: 'Client exhibits elevated sympathetic tone post-workout; responded well to 528 Hz sine wave.',
    },
    {
      id: 'client-2',
      clientName: 'Marcus Vance',
      status: 'active',
      targetBodyParts: 'Axial Spine & Sacral Pelvis',
      prescribedFrequencies: '136.1 Hz Somatic Om + 285 Hz Tissue Restructuring (20 mins)',
      lastSessionDate: '2026-10-15',
      notes: 'Lower lumbar tension mitigated by 136.1 Hz subharmonic entrainment.',
    },
    {
      id: 'client-3',
      clientName: 'Sophia Lin',
      status: 'maintenance',
      targetBodyParts: 'Prefrontal Cortex & Pineal Gland',
      prescribedFrequencies: '852 Hz Intuitive Focus + 963 Hz Crown Gamma (10 mins)',
      lastSessionDate: '2026-10-12',
      notes: 'Reported profound mental clarity after 40 Hz binaural gamma beat integration.',
    },
  ]);
  const [isGeneratingInsight, setIsGeneratingInsight] = useState(false);

  const loadUserData = React.useCallback(async (uid: string) => {
    try {
      // Load sessions
      const sessCol = collection(db, 'users', uid, 'sessions');
      const sessSnap = await getDocs(query(sessCol, orderBy('completedAt', 'desc'), limit(15)));
      const loadedSessions: SavedHealingSession[] = [];
      sessSnap.forEach((d) => {
        const item = d.data() as SavedHealingSession;
        loadedSessions.push({ ...item, id: d.id });
      });
      if (loadedSessions.length > 0) setSessions(loadedSessions);

      // Load insights
      const insCol = collection(db, 'users', uid, 'dailyInsights');
      const insSnap = await getDocs(query(insCol, orderBy('generatedAt', 'desc'), limit(10)));
      const loadedInsights: SavedDailyInsight[] = [];
      insSnap.forEach((d) => {
        const item = d.data() as SavedDailyInsight;
        loadedInsights.push({ ...item, id: d.id });
      });
      if (loadedInsights.length > 0) setInsights(loadedInsights);
    } catch (error) {
      console.warn('Failed to load user subcollections from Firestore (using local cache):', error);
    }
  }, []);

  // Initialize and test Firebase connection
  useEffect(() => {
    testConnection();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          // Load or initialize user profile in Firestore
          const userDocRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userDocRef);
          if (userSnap.exists()) {
            const data = userSnap.data();
            if (data.role) setUserRole(data.role);
          } else {
            await setDoc(userDocRef, {
              userId: user.uid,
              email: user.email || 'user@resos.internal',
              displayName: user.displayName || 'ResOS User',
              role: 'individual',
              heartRateBaseline: 68,
              hrvBaseline: 55,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
          }
          await loadUserData(user.uid);
        } catch (err) {
          console.error('User profile sync error:', err);
        }
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, [loadUserData]);

  // Subscribe to live wearable streaming
  useEffect(() => {
    const unsub = wearableManager.subscribe((packet) => {
      setBiometrics(packet);
      setDevice(wearableManager.getActiveDevice());
    });
    return () => unsub();
  }, []);

  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error('Sign-in error:', err);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
    } catch (err) {
      console.error('Sign-out error:', err);
    }
  };

  // Trigger 3D EM Scan
  const handleTriggerScan = () => {
    setIsScanning(true);
  };

  const handleScanComplete = (detectedImbalances: string[]) => {
    setIsScanning(false);
    setImbalancedIds(detectedImbalances);
    // Find primary imbalanced link
    const primary = RESOS_NEURAL_LINKS.find((l) => l.id === detectedImbalances[0]);
    if (primary) {
      setActiveLink(primary);
      soundEngine.setFrequency(primary.primaryFrequencyHz);
    }
  };

  // Save healing session
  const handleSaveSession = async (sessionData: {
    bodyPart: string;
    frequencyHz: number;
    durationSeconds: number;
    avgHeartRate: number;
    coherenceScore: number;
    notes: string;
  }) => {
    const newSession: SavedHealingSession = {
      id: `sess-${Date.now()}`,
      ...sessionData,
      completedAt: new Date().toISOString(),
    };

    setSessions((prev) => [newSession, ...prev]);

    if (currentUser) {
      try {
        const path = `users/${currentUser.uid}/sessions`;
        await addDoc(collection(db, 'users', currentUser.uid, 'sessions'), {
          ...newSession,
          userId: currentUser.uid,
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `users/${currentUser.uid}/sessions`);
      }
    }
  };

  // Save Bio-Chart
  const handleSaveBioChart = async (chart: {
    title: string;
    overallResonance: number;
    primaryImbalance: string;
    recommendedFrequencyHz: number;
    soundWaveType: string;
    neuralLinksData: string;
  }) => {
    if (currentUser) {
      try {
        const chartId = `chart-${Date.now()}`;
        const path = `users/${currentUser.uid}/bioCharts/${chartId}`;
        await setDoc(doc(db, 'users', currentUser.uid, 'bioCharts', chartId), {
          id: chartId,
          userId: currentUser.uid,
          ...chart,
          createdAt: new Date().toISOString(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `users/${currentUser.uid}/bioCharts`);
      }
    }
  };

  // Sync Biometric Reading
  const handleSyncBiometrics = async () => {
    if (currentUser) {
      try {
        const logId = `bio-${Date.now()}`;
        await setDoc(doc(db, 'users', currentUser.uid, 'biometricLogs', logId), {
          id: logId,
          userId: currentUser.uid,
          deviceSource: biometrics.deviceSource,
          heartRate: biometrics.heartRate,
          hrv: biometrics.hrv,
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `users/${currentUser.uid}/biometricLogs`);
      }
    }
  };

  // Generate Personalized Daily Insight using Gemini AI
  const handleGenerateDailyInsight = async () => {
    setIsGeneratingInsight(true);
    try {
      const prompt = `Generate a personalized daily wellness and bio-resonance insight for a client with the following metrics:
- Heart Rate: ${biometrics.heartRate} BPM
- HRV (RMSSD): ${biometrics.hrv} ms
- Coherence Score: ${biometrics.coherenceScore}/100
- Active Imbalances: ${imbalancedIds.map((id) => RESOS_NEURAL_LINKS.find((l) => l.id === id)?.name).join(', ')}

Provide:
1. Daily Bio-Harmonic status summary (2-3 sentences).
2. Recommended sound frequency to play today and why.
3. Specific breathing/lifestyle micro-habit for today.`;

      const res = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          model: 'gemini-3.8-flash',
          systemInstruction: 'You are the ResOS Personalized Bio-Harmonic Advisor. Write with calm clarity and scientific inspiration.',
        }),
      });

      const data = await res.json();
      const content = data.text || 'Today, prioritize parasympathetic restoration at 528 Hz to balance autonomic nervous system tone.';

      const newInsight: SavedDailyInsight = {
        id: `ins-${Date.now()}`,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        content,
        recommendedAction: `Listen to ${activeLink.primaryFrequencyHz} Hz (${activeLink.name}) for 12 minutes during evening cooldown.`,
        generatedAt: new Date().toISOString(),
      };

      setInsights((prev) => [newInsight, ...prev]);

      if (currentUser) {
        try {
          await setDoc(doc(db, 'users', currentUser.uid, 'dailyInsights', newInsight.id), {
            ...newInsight,
            userId: currentUser.uid,
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, `users/${currentUser.uid}/dailyInsights`);
        }
      }
    } catch (err) {
      console.error('Error generating insight:', err);
    } finally {
      setIsGeneratingInsight(false);
    }
  };

  // Add Client (Therapist mode)
  const handleAddClient = async (newC: Omit<ClientProfile, 'id'>) => {
    const fullClient: ClientProfile = {
      id: `client-${Date.now()}`,
      ...newC,
    };
    setClients((prev) => [fullClient, ...prev]);

    if (currentUser) {
      try {
        await setDoc(doc(db, 'therapistClients', fullClient.id), {
          ...fullClient,
          therapistId: currentUser.uid,
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `therapistClients/${fullClient.id}`);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Top Application Navbar */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          {/* Logo & Branding */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-slate-950 shadow-md">
              <Waves className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg tracking-tight bg-gradient-to-r from-white via-cyan-100 to-cyan-400 bg-clip-text text-transparent">
                  ResOS
                </span>
                <span className="text-[10px] font-mono uppercase bg-cyan-950 text-cyan-300 border border-cyan-800/60 px-2 py-0.5 rounded-full">
                  v3.8 Origin
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Resonate Origin System • Biofield & Neural Link Therapy
              </p>
            </div>
          </div>

          {/* Mode Selector (Individual vs Therapist) & Auth Profile */}
          <div className="flex items-center gap-3">
            {/* Dual Mode Switcher */}
            <div className="bg-slate-900 border border-slate-800 p-1 rounded-xl flex items-center text-xs">
              <button
                onClick={() => setUserRole('individual')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                  userRole === 'individual'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Individual</span>
              </button>
              <button
                onClick={() => setUserRole('therapist')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                  userRole === 'therapist'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Stethoscope className="w-3.5 h-3.5" />
                <span>Therapist</span>
              </button>
            </div>

            {/* Auth State */}
            {currentUser ? (
              <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-xs">
                <div className="w-6 h-6 rounded-full bg-cyan-600 flex items-center justify-center font-bold text-white text-[11px]">
                  {currentUser.displayName ? currentUser.displayName[0] : 'U'}
                </div>
                <span className="hidden sm:inline text-slate-300 font-medium truncate max-w-[120px]">
                  {currentUser.displayName || currentUser.email}
                </span>
                <button
                  onClick={handleSignOut}
                  className="text-slate-400 hover:text-rose-400 p-1 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleSignIn}
                className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-200 transition-all shadow-sm"
              >
                <LogIn className="w-3.5 h-3.5 text-cyan-400" />
                <span>Sign in with Google</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8 flex flex-col gap-6">
        {/* Wearable Biometric Synchronization Bar */}
        <WearableDeviceBar
          device={device}
          biometrics={biometrics}
          onScanClick={handleTriggerScan}
          isScanning={isScanning}
          onSyncToCloud={handleSyncBiometrics}
        />

        {/* Primary View Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800/90 pb-2 text-xs font-semibold overflow-x-auto">
          {[
            { id: 'hologram', label: '3D Biofield Scanner & Acoustic Room', icon: Waves },
            { id: 'chart', label: 'ResOS 12 Neural Links Bio-Chart', icon: Activity },
            { id: 'voice', label: 'Live Voice Companion (Gemini 3.8)', icon: Radio },
            { id: 'science', label: 'Bioscience Research & Evidence', icon: BookOpen },
            { id: 'progress', label: 'Progress & Daily Insights', icon: Clock },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeViewTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveViewTab(tab.id as typeof activeViewTab)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-slate-800 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: 3D Hologram Biofield & Real-Time Acoustic Visual Feedback Session */}
        {activeViewTab === 'hologram' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* 3D Biofield Hologram Canvas (7 cols on lg) */}
            <div className="lg:col-span-7 flex flex-col gap-3">
              <BiofieldScanner3D
                activeLink={activeLink}
                onSelectLink={(link) => {
                  setActiveLink(link);
                  soundEngine.setFrequency(link.primaryFrequencyHz);
                }}
                isScanning={isScanning}
                onScanComplete={handleScanComplete}
                heartRate={biometrics.heartRate}
                coherenceScore={biometrics.coherenceScore}
              />
            </div>

            {/* Sound Engine & Real-Time Visual Feedback Loop (5 cols on lg) */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <SessionVisualFeedback
                activeLink={activeLink}
                biometrics={biometrics}
                onSaveSession={handleSaveSession}
              />
            </div>
          </div>
        )}

        {/* Tab 2: Full 12 Neural Links Bio-Chart Matrix */}
        {activeViewTab === 'chart' && (
          <NeuralLinkBioChart
            selectedLink={activeLink}
            onSelectLink={(link) => {
              setActiveLink(link);
              soundEngine.setFrequency(link.primaryFrequencyHz);
              soundEngine.setMode(link.waveType);
            }}
            biometrics={biometrics}
            imbalancedIds={imbalancedIds}
            onSaveBioChart={handleSaveBioChart}
          />
        )}

        {/* Tab 3: Gemini 3.8 Live Voice Companion */}
        {activeViewTab === 'voice' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7">
              <LiveVoiceCompanion
                activeLink={activeLink}
                biometrics={biometrics}
              />
            </div>
            <div className="lg:col-span-5">
              <SessionVisualFeedback
                activeLink={activeLink}
                biometrics={biometrics}
                onSaveSession={handleSaveSession}
              />
            </div>
          </div>
        )}

        {/* Tab 4: Bioscience Literature & Research Studies */}
        {activeViewTab === 'science' && (
          <ScienceLiteratureView />
        )}

        {/* Tab 5: Progress Tracking & Personalized Insights */}
        {activeViewTab === 'progress' && (
          <ProgressAndInsightsView
            sessions={sessions}
            insights={insights}
            biometrics={biometrics}
            onGenerateDailyInsight={handleGenerateDailyInsight}
            isGeneratingInsight={isGeneratingInsight}
          />
        )}

        {/* If Therapist Mode is enabled, render the Therapist Clinical Command Suite */}
        {userRole === 'therapist' && (
          <div className="mt-4 pt-6 border-t border-slate-800">
            <TherapistSuite
              biometrics={biometrics}
              clients={clients}
              onAddClient={handleAddClient}
              onSelectFrequencyPreset={(freq, mode) => {
                soundEngine.setFrequency(freq);
                soundEngine.setMode(mode);
                const match = RESOS_NEURAL_LINKS.find((l) => l.primaryFrequencyHz === freq);
                if (match) setActiveLink(match);
                setActiveViewTab('hologram');
              }}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 px-4 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            ResOS (Resonate Origin System) • Bio-Harmonic Cellular Entrainment Platform
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>PubMed Grounded</span>
            <span>•</span>
            <span>Three.js PBR Studio</span>
            <span>•</span>
            <span>Gemini 4 Argon & 3.8 Live</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
