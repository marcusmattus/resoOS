// Wearable Device Synchronisation Service for ResOS
// Supports both Web Bluetooth (Standard GATT Heart Rate 0x180D) and Physiological Streaming Simulator

export interface WearableDevice {
  id: string;
  name: string;
  type: 'ble_sensor' | 'apple_watch' | 'garmin' | 'oura' | 'whoop' | 'resos_patch';
  batteryLevel: number;
  isConnected: boolean;
  isRealBle: boolean;
}

export interface LiveBiometricPacket {
  heartRate: number; // BPM
  hrv: number; // RMSSD in ms
  respiratoryRate: number; // breaths/min
  stressIndex: number; // 0 - 100
  skinConductance: number; // microsiemens
  coherenceScore: number; // 0 - 100
  timestamp: string;
  deviceSource: string;
}

type BiometricSubscriber = (data: LiveBiometricPacket) => void;

class WearableManager {
  private activeDevice: WearableDevice = {
    id: 'sim-apple-watch',
    name: 'Apple Watch Ultra (HealthKit Bridge)',
    type: 'apple_watch',
    batteryLevel: 88,
    isConnected: true,
    isRealBle: false,
  };

  private subscribers: Set<BiometricSubscriber> = new Set();
  private intervalId: NodeJS.Timeout | null = null;
  private currentPacket: LiveBiometricPacket = {
    heartRate: 68,
    hrv: 54,
    respiratoryRate: 14,
    stressIndex: 28,
    skinConductance: 2.1,
    coherenceScore: 78,
    timestamp: new Date().toISOString(),
    deviceSource: 'Apple Watch Ultra',
  };

  private simulationScenario: 'baseline' | 'stressed' | 'coherent' | 'fatigued' = 'baseline';
  private bleServer: unknown = null;

  constructor() {
    this.startSimulationStream();
  }

  public subscribe(cb: BiometricSubscriber): () => void {
    this.subscribers.add(cb);
    cb({ ...this.currentPacket });
    return () => {
      this.subscribers.delete(cb);
    };
  }

  private notify() {
    for (const sub of this.subscribers) {
      sub({ ...this.currentPacket });
    }
  }

  public getActiveDevice(): WearableDevice {
    return { ...this.activeDevice };
  }

  public setScenario(scenario: 'baseline' | 'stressed' | 'coherent' | 'fatigued') {
    this.simulationScenario = scenario;
    if (scenario === 'stressed') {
      this.currentPacket.heartRate = 94;
      this.currentPacket.hrv = 22;
      this.currentPacket.stressIndex = 76;
      this.currentPacket.coherenceScore = 32;
    } else if (scenario === 'coherent') {
      this.currentPacket.heartRate = 62;
      this.currentPacket.hrv = 78;
      this.currentPacket.stressIndex = 14;
      this.currentPacket.coherenceScore = 92;
    } else if (scenario === 'fatigued') {
      this.currentPacket.heartRate = 54;
      this.currentPacket.hrv = 29;
      this.currentPacket.stressIndex = 58;
      this.currentPacket.coherenceScore = 44;
    } else {
      this.currentPacket.heartRate = 68;
      this.currentPacket.hrv = 54;
      this.currentPacket.stressIndex = 28;
      this.currentPacket.coherenceScore = 78;
    }
    this.notify();
  }

  public setDevice(device: Partial<WearableDevice>) {
    this.activeDevice = { ...this.activeDevice, ...device };
    this.currentPacket.deviceSource = this.activeDevice.name;
    this.notify();
  }

  private startSimulationStream() {
    if (this.intervalId) clearInterval(this.intervalId);

    let angle = 0;
    this.intervalId = setInterval(() => {
      if (this.activeDevice.isRealBle) return; // Bluetooth handles its own packets

      angle += 0.2;
      const breathingWave = Math.sin(angle) * 3; // Respiratory sinus arrhythmia
      const noise = (Math.random() - 0.5) * 1.5;

      let targetHR = 68;
      let targetHRV = 55;
      let targetStress = 25;
      let targetCoherence = 75;

      if (this.simulationScenario === 'stressed') {
        targetHR = 92;
        targetHRV = 24;
        targetStress = 72;
        targetCoherence = 35;
      } else if (this.simulationScenario === 'coherent') {
        targetHR = 60;
        targetHRV = 82;
        targetStress = 12;
        targetCoherence = 94;
      } else if (this.simulationScenario === 'fatigued') {
        targetHR = 55;
        targetHRV = 30;
        targetStress = 54;
        targetCoherence = 45;
      }

      const smoothedHR = Math.round(targetHR + breathingWave + noise);
      const smoothedHRV = Math.round(Math.max(15, targetHRV - breathingWave * 1.5 + noise));
      const smoothedStress = Math.round(Math.max(5, Math.min(99, targetStress + noise * 2)));
      const smoothedCoherence = Math.round(Math.max(10, Math.min(99, targetCoherence + Math.sin(angle * 0.5) * 4)));

      this.currentPacket = {
        heartRate: smoothedHR,
        hrv: smoothedHRV,
        respiratoryRate: Math.round(14 + Math.cos(angle * 0.3)),
        stressIndex: smoothedStress,
        skinConductance: parseFloat((2.0 + Math.abs(Math.sin(angle)) * 0.8).toFixed(2)),
        coherenceScore: smoothedCoherence,
        timestamp: new Date().toISOString(),
        deviceSource: this.activeDevice.name,
      };

      this.notify();
    }, 1000);
  }

  // Real Web Bluetooth GATT integration
  public async connectRealBleDevice(): Promise<{ success: boolean; message: string }> {
    if (typeof navigator === 'undefined' || !('bluetooth' in navigator)) {
      return {
        success: false,
        message: 'Web Bluetooth is not supported in this browser environment. Using high-fidelity wearable streaming.',
      };
    }

    try {
      // @ts-expect-error Web Bluetooth types
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: ['heart_rate'] }],
        optionalServices: ['battery_service'],
      });

      const server = await device.gatt.connect();
      this.bleServer = server;
      const hrService = await server.getPrimaryService('heart_rate');
      const hrChar = await hrService.getCharacteristic('heart_rate_measurement');

      await hrChar.startNotifications();
      hrChar.addEventListener('characteristicvaluechanged', (event: Event) => {
        // @ts-expect-error DataView access
        const value: DataView = event.target.value;
        const flags = value.getUint8(0);
        let hr = 0;
        if (flags & 0x01) {
          hr = value.getUint16(1, true); // 16-bit
        } else {
          hr = value.getUint8(1); // 8-bit
        }

        // Parse RR-intervals if present
        let rrIntervalMs = 800;
        if (flags & 0x10 && value.byteLength >= 4) {
          const rawRR = value.getUint16(2, true);
          rrIntervalMs = Math.round((rawRR / 1024) * 1000);
        }
        const estHRV = Math.round(Math.abs(rrIntervalMs - (60000 / hr)) * 0.7 + 40);

        this.currentPacket = {
          heartRate: hr,
          hrv: Math.min(120, Math.max(15, estHRV)),
          respiratoryRate: 14,
          stressIndex: hr > 85 ? 65 : 25,
          skinConductance: 2.4,
          coherenceScore: hr < 75 && estHRV > 45 ? 85 : 45,
          timestamp: new Date().toISOString(),
          deviceSource: device.name || 'Polar H10 BLE Sensor',
        };
        this.notify();
      });

      this.activeDevice = {
        id: device.id,
        name: device.name || 'Standard Heart Rate Sensor',
        type: 'ble_sensor',
        batteryLevel: 95,
        isConnected: true,
        isRealBle: true,
      };
      this.notify();

      return { success: true, message: `Connected to ${device.name || 'BLE Sensor'}` };
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'User cancelled or Bluetooth connection failed.',
      };
    }
  }

  public disconnect() {
    if (this.bleServer) {
      try {
        // @ts-expect-error GATT disconnect
        this.bleServer.disconnect();
      } catch {}
      this.bleServer = null;
    }
    this.activeDevice.isConnected = false;
    this.notify();
  }
}

export const wearableManager = new WearableManager();
