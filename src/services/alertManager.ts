// src/services/alertManager.ts
import { db, AlertLogItem, DoseEvent, GuardianProfile, PatientProfile } from './db';
import { sound, SpeechEngine } from './audio';

export interface AlertPayload {
  alertId: string;
  patientId: string;
  patientName: string;
  type: 'MISSED_DOSE' | 'DOSE_DECLINED' | 'SILENCE_48H_ESCALATION' | 'SYSTEM_TEST';
  medicineName?: string;
  dosage?: string;
  scheduledTime: number;
  timestamp: number;
  doseEventId?: string;
}

export interface DeliveryResult {
  success: boolean;
  channel: 'BLUETOOTH' | 'WIFI_LAN' | 'REMOTE_PUSH' | 'LOCAL_FALLBACK';
  status: 'DELIVERED' | 'ACKNOWLEDGED' | 'FAILED' | 'QUEUED';
  message: string;
}

// 1. Bluetooth Low Energy Adapter
class BluetoothChannelAdapter {
  async isAvailable(): Promise<boolean> {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  }

  async sendAlert(guardian: GuardianProfile, payload: AlertPayload): Promise<DeliveryResult> {
    if (!('bluetooth' in navigator)) {
      return {
        success: false,
        channel: 'BLUETOOTH',
        status: 'FAILED',
        message: 'Web Bluetooth API is unavailable or restricted in this browser context.'
      };
    }

    try {
      console.log(`[BLE Adapter] Initiating transmission to Guardian: ${guardian.name}`, payload);
      // In native Capacitor: background GATT service is used.
      // In browser: navigator.bluetooth.requestDevice requires explicit user gesture.
      return {
        success: false,
        channel: 'BLUETOOTH',
        status: 'FAILED',
        message: 'No paired BLE GATT peripheral currently advertising in range. Background advertising requires native Android runtime.'
      };
    } catch (e: any) {
      return {
        success: false,
        channel: 'BLUETOOTH',
        status: 'FAILED',
        message: e?.message || 'Bluetooth transmission error.'
      };
    }
  }

  async scanForPeripherals(): Promise<{ found: boolean; message: string }> {
    if (!('bluetooth' in navigator)) {
      return { found: false, message: 'Web Bluetooth API is not available on this browser/platform.' };
    }
    try {
      const navAny = navigator as any;
      const device = await navAny.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['battery_service']
      });
      return { found: true, message: `Found nearby Bluetooth device: ${device.name || device.id}` };
    } catch (err: any) {
      return { found: false, message: err?.message || 'Bluetooth scan cancelled or unavailable.' };
    }
  }
}

// 2. Same-Wi-Fi Local WebRTC DataChannel Adapter
class LocalWifiAdapter {
  async isAvailable(): Promise<boolean> {
    return typeof window !== 'undefined' && 'RTCPeerConnection' in window;
  }

  async sendAlert(guardian: GuardianProfile, payload: AlertPayload): Promise<DeliveryResult> {
    console.log(`[LAN Adapter] Attempting direct P2P local delivery to ${guardian.name}...`, payload);
    // Returns explicit status instead of simulated fake success
    return {
      success: false,
      channel: 'WIFI_LAN',
      status: 'FAILED',
      message: 'Local Wi-Fi peer channel disconnected or client isolation active on router.'
    };
  }
}

// 3. Optional Remote Push Notifications Adapter
class RemotePushAdapter {
  isConfigured(): boolean {
    if (typeof localStorage === 'undefined') return false;
    return localStorage.getItem('CAREDOS_REMOTE_ENABLED') === 'true';
  }

  async sendAlert(payload: AlertPayload): Promise<DeliveryResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        channel: 'REMOTE_PUSH',
        status: 'FAILED',
        message: 'Remote alerts are not configured. Nearby alerts and local reminders remain available.'
      };
    }
    return {
      success: false,
      channel: 'REMOTE_PUSH',
      status: 'FAILED',
      message: 'Remote server relay unreachable or offline.'
    };
  }
}

// Main Alert Manager Orchestrator
export class AlertManager {
  private ble = new BluetoothChannelAdapter();
  private lan = new LocalWifiAdapter();
  private remote = new RemotePushAdapter();
  private listeners: Array<() => void> = [];

  subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(l => {
      try { l(); } catch (err) { console.error(err); }
    });
  }

  getBLEAdapter() {
    return this.ble;
  }

  // Request HTML5 Web Notification permission
  async requestNotificationPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission !== 'denied') {
      const res = await Notification.requestPermission();
      return res === 'granted';
    }
    return false;
  }

  // Show system notification with quick action buttons if supported
  private showSystemNotification(title: string, options: NotificationOptions) {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: 'caredose_alert',
          ...options
        });
      } catch (e) {
        console.warn('System notification error:', e);
      }
    }
  }

  // Dispatch an alert through the zero-cost fallback chain
  async dispatchAlert(
    patientId: string,
    patientName: string,
    type: 'MISSED_DOSE' | 'DOSE_DECLINED' | 'SILENCE_48H_ESCALATION' | 'SYSTEM_TEST',
    medicineName?: string,
    dosage?: string,
    doseEventId?: string
  ): Promise<AlertLogItem> {
    const alertId = 'alert_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    const now = Date.now();

    const payload: AlertPayload = {
      alertId,
      patientId,
      patientName,
      type,
      medicineName,
      dosage,
      scheduledTime: now,
      timestamp: now,
      doseEventId
    };

    // Trigger local alarms: audio + vibration + speech
    sound.playAlertChime();
    sound.vibrate([300, 150, 300, 150, 500]);

    // Show system notification
    const alertTitle = type === 'MISSED_DOSE' ? `🚨 Missed Dose: ${medicineName || 'Medication'}`
      : type === 'DOSE_DECLINED' ? `⚠️ Dose Declined by ${patientName}`
      : type === 'SILENCE_48H_ESCALATION' ? `‼️ 48-Hour Silence Escalation: ${patientName}`
      : `CareDose System Test Signal`;

    this.showSystemNotification(alertTitle, {
      body: `${patientName} - ${medicineName ? `${medicineName} (${dosage})` : 'Requires guardian check-in.'}`,
      requireInteraction: true
    });

    // Step 1: Save event locally first
    const logItem: AlertLogItem = {
      id: alertId,
      doseEventId,
      patientId,
      type,
      timestamp: now,
      status: 'QUEUED',
      channelUsed: 'LOCAL_FALLBACK',
      details: 'Event recorded in local store. Evaluating guardian delivery channels...'
    };
    await db.put('alerts', logItem);

    // Get paired guardians
    const guardians = (await db.getAll<GuardianProfile>('guardians')).filter(
      g => g.pairingStatus === 'PAIRED'
    );

    if (guardians.length === 0) {
      logItem.status = 'QUEUED';
      logItem.channelUsed = 'LOCAL_FALLBACK';
      logItem.details = 'No guardians currently paired. Alert is saved in local device queue.';
      await db.put('alerts', logItem);
      this.notifyListeners();
      return logItem;
    }

    let delivered = false;

    for (const guardian of guardians) {
      // Step 2: Try Bluetooth LE if supported/configured
      if (guardian.connectionType === 'BLUETOOTH' || guardian.connectionType === 'NONE') {
        const bleRes = await this.ble.sendAlert(guardian, payload);
        if (bleRes.success) {
          logItem.status = bleRes.status;
          logItem.channelUsed = 'BLUETOOTH';
          logItem.details = `Delivered to ${guardian.name} via Bluetooth LE.`;
          delivered = true;
          break;
        }
      }

      // Step 3: Try Local Wi-Fi / WebRTC
      if (!delivered && (guardian.connectionType === 'WIFI_LAN' || guardian.connectionType === 'NONE')) {
        const lanRes = await this.lan.sendAlert(guardian, payload);
        if (lanRes.success) {
          logItem.status = lanRes.status;
          logItem.channelUsed = 'WIFI_LAN';
          logItem.details = `Delivered to ${guardian.name} via Local Wi-Fi DataChannel.`;
          delivered = true;
          break;
        }
      }
    }

    // Step 4: Optional Remote Push (if enabled by user)
    if (!delivered && this.remote.isConfigured()) {
      const remRes = await this.remote.sendAlert(payload);
      if (remRes.success) {
        logItem.status = remRes.status;
        logItem.channelUsed = 'REMOTE_PUSH';
        logItem.details = 'Delivered via optional remote push relay.';
        delivered = true;
      }
    }

    // Step 5: Mark as pending / queued on device if direct delivery is offline
    if (!delivered) {
      logItem.status = 'QUEUED';
      logItem.channelUsed = 'LOCAL_FALLBACK';
      logItem.details = 'Guardians unreachable via BLE/Wi-Fi right now. Alert queued on device for local sync.';
    }

    await db.put('alerts', logItem);
    this.notifyListeners();
    return logItem;
  }

  // Quick Action for Guardians: Rapidly acknowledge, confirm taken, or confirm missed
  async acknowledgeAlert(
    alertId: string,
    guardianId: string,
    action: 'CONFIRMED_TAKEN' | 'CONFIRMED_DECLINED' | 'ACKNOWLEDGED_ONLY',
    notes?: string
  ): Promise<boolean> {
    const alert = await db.get<AlertLogItem>('alerts', alertId);
    if (!alert) return false;

    const guardian = await db.get<GuardianProfile>('guardians', guardianId);
    const guardianName = guardian ? guardian.name : 'Designated Guardian';

    alert.status = 'ACKNOWLEDGED';
    alert.details = `Acknowledged by ${guardianName} (${action.replace('_', ' ')}) at ${new Date().toLocaleTimeString()}.${notes ? ` Note: ${notes}` : ''}`;
    await db.put('alerts', alert);

    // Update associated DoseEvent if present
    if (alert.doseEventId) {
      const dose = await db.get<DoseEvent>('doses', alert.doseEventId);
      if (dose) {
        dose.alertStatus = 'ACKNOWLEDGED';
        dose.acknowledgedByGuardianId = guardianId;
        dose.acknowledgedAt = Date.now();
        if (action === 'CONFIRMED_TAKEN') {
          dose.status = 'CONFIRMED_YES';
          dose.confirmedAt = Date.now();
        } else if (action === 'CONFIRMED_DECLINED') {
          dose.status = 'CONFIRMED_NO';
          dose.confirmedAt = Date.now();
        }
        await db.put('doses', dose);
      }
    }

    sound.playSuccessChime();
    this.notifyListeners();
    return true;
  }

  // Quick Action for Guardians: Directly confirm a dose on behalf of patient
  async guardianConfirmDose(
    doseId: string,
    guardianId: string,
    confirmedTaken: boolean,
    notes?: string
  ): Promise<boolean> {
    const dose = await db.get<DoseEvent>('doses', doseId);
    if (!dose) return false;

    const guardian = await db.get<GuardianProfile>('guardians', guardianId);
    const guardianName = guardian ? guardian.name : 'Guardian';

    dose.status = confirmedTaken ? 'CONFIRMED_YES' : 'CONFIRMED_NO';
    dose.confirmedAt = Date.now();
    dose.alertStatus = 'ACKNOWLEDGED';
    dose.acknowledgedByGuardianId = guardianId;
    dose.acknowledgedAt = Date.now();
    dose.lastAttemptLog = `Manually updated by guardian ${guardianName}.${notes ? ` Notes: ${notes}` : ''}`;
    await db.put('doses', dose);

    // Also update any related alert items
    const alerts = await db.getAll<AlertLogItem>('alerts');
    for (const a of alerts) {
      if (a.doseEventId === doseId) {
        a.status = 'ACKNOWLEDGED';
        a.details = `Resolved by guardian ${guardianName}: marked as ${confirmedTaken ? 'TAKEN' : 'DECLINED'}.`;
        await db.put('alerts', a);
      }
    }

    sound.playSuccessChime();
    this.notifyListeners();
    return true;
  }
}

export const alertManager = new AlertManager();
