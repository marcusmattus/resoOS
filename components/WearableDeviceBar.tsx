'use client';

import React, { useState } from 'react';
import { wearableManager, WearableDevice, LiveBiometricPacket } from '@/lib/wearableService';
import { 
  Watch, 
  Bluetooth, 
  Battery, 
  Activity, 
  Zap, 
  RefreshCw, 
  CheckCircle2, 
  SlidersHorizontal,
  Wifi,
  WifiOff
} from 'lucide-react';

interface WearableDeviceBarProps {
  device: WearableDevice;
  biometrics: LiveBiometricPacket;
  onScanClick: () => void;
  isScanning: boolean;
  onSyncToCloud: () => Promise<void>;
}

export default function WearableDeviceBar({
  device,
  biometrics,
  onScanClick,
  isScanning,
  onSyncToCloud,
}: WearableDeviceBarProps) {
  const [isConnectingBle, setIsConnectingBle] = useState(false);
  const [bleStatusMsg, setBleStatusMsg] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [showScenarioMenu, setShowScenarioMenu] = useState(false);

  const handleConnectBle = async () => {
    setIsConnectingBle(true);
    setBleStatusMsg(null);
    try {
      const result = await wearableManager.connectRealBleDevice();
      setBleStatusMsg(result.message);
      setTimeout(() => setBleStatusMsg(null), 5000);
    } finally {
      setIsConnectingBle(false);
    }
  };

  const handleSyncLog = async () => {
    setIsSyncing(true);
    try {
      await onSyncToCloud();
      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 3000);
    } catch {
      // Handled
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl text-white">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Device Info & Status */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-cyan-400">
            <Watch className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-100">{device.name}</span>
              <span className={`flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full ${
                device.isConnected
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                  : 'bg-rose-950/80 text-rose-300 border border-rose-800/60'
              }`}>
                {device.isConnected ? <Wifi className="w-2.5 h-2.5" /> : <WifiOff className="w-2.5 h-2.5" />}
                {device.isConnected ? 'LIVE SYNC' : 'DISCONNECTED'}
              </span>
              {device.isRealBle && (
                <span className="text-[10px] font-mono bg-blue-950 text-blue-300 px-2 py-0.5 rounded border border-blue-800">
                  BLE GATT
                </span>
              )}
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-400 font-mono mt-0.5">
              <span className="flex items-center gap-1">
                <Battery className="w-3.5 h-3.5 text-slate-400" />
                {device.batteryLevel}%
              </span>
              <span>•</span>
              <span className="text-slate-300">
                SpO2: <strong className="text-cyan-300">98%</strong>
              </span>
              <span>•</span>
              <span className="text-slate-300">
                GSR: <strong className="text-cyan-300">{biometrics.skinConductance} µS</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons: Connect Bluetooth, Test Scenarios, EM Scan, Sync */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Real BLE Button */}
          <button
            onClick={handleConnectBle}
            disabled={isConnectingBle}
            className="flex items-center gap-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 px-3 py-2 rounded-xl text-xs font-medium text-slate-200 transition-all"
            title="Connect Bluetooth Heart Rate Monitor (Polar, Garmin, etc.)"
          >
            <Bluetooth className="w-3.5 h-3.5 text-cyan-400" />
            <span>{isConnectingBle ? 'Searching...' : 'Pair BLE Device'}</span>
          </button>

          {/* Physiological Simulation Scenario Selector */}
          <div className="relative">
            <button
              onClick={() => setShowScenarioMenu(!showScenarioMenu)}
              className="flex items-center gap-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 px-3 py-2 rounded-xl text-xs font-medium text-slate-200 transition-all"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-purple-400" />
              <span>Simulate State</span>
            </button>

            {showScenarioMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-slate-950 border border-slate-800 rounded-xl p-1.5 shadow-2xl z-30 text-xs">
                <div className="text-[10px] font-mono text-slate-400 px-2 py-1 uppercase">
                  Biometric Scenarios
                </div>
                {[
                  { id: 'baseline', label: 'Baseline Rest (68 BPM / 54 HRV)' },
                  { id: 'stressed', label: 'Sympathetic Stress (94 BPM / 22 HRV)' },
                  { id: 'coherent', label: 'Deep Coherence (60 BPM / 82 HRV)' },
                  { id: 'fatigued', label: 'Fatigued / Low Vagal (54 BPM / 29 HRV)' },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      wearableManager.setScenario(s.id as 'baseline' | 'stressed' | 'coherent' | 'fatigued');
                      setShowScenarioMenu(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-300 transition-colors"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sync to Firestore */}
          <button
            onClick={handleSyncLog}
            disabled={isSyncing}
            className="flex items-center gap-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 px-3 py-2 rounded-xl text-xs font-medium text-slate-200 transition-all"
          >
            {isSyncing ? (
              <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
            ) : syncSuccess ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Zap className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span>{syncSuccess ? 'Synced' : 'Log Biometrics'}</span>
          </button>

          {/* Trigger 3D EM Field Scan */}
          <button
            onClick={onScanClick}
            disabled={isScanning}
            className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs shadow-lg transition-all"
          >
            <Activity className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'Scanning Biofield...' : 'Scan EM Field'}</span>
          </button>
        </div>
      </div>

      {bleStatusMsg && (
        <div className="mt-2 text-xs font-mono text-cyan-300 bg-cyan-950/50 border border-cyan-800/60 p-2 rounded-lg">
          {bleStatusMsg}
        </div>
      )}
    </div>
  );
}
