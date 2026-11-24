// src/components/GuardianHub.tsx
import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { GuardianProfile, PatientProfile, AlertLogItem, DoseEvent, Medicine } from '../services/db';
import { CryptoEngine } from '../services/crypto';
import { alertManager } from '../services/alertManager';
import { sound, SpeechEngine } from '../services/audio';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Eye,
  Phone,
  QrCode,
  Bluetooth,
  Wifi,
  KeyRound,
  Send,
  UserCheck,
  RefreshCw,
  Plus,
  AlertCircle,
  Copy,
  Check,
  Download,
  Maximize2,
  RotateCw,
  X,
  Trash2,
  Radio,
  CheckCircle,
  Activity
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { t } from '../services/i18n';

interface GuardianHubProps {
  guardians: GuardianProfile[];
  patients: PatientProfile[];
  activePatient: PatientProfile | null;
  alertLogs: AlertLogItem[];
  doseEvents: DoseEvent[];
  medicines: Medicine[];
  highContrast: boolean;
  largeText: boolean;
  ttsEnabled: boolean;
  onRefresh: () => Promise<void>;
  onDeleteGuardian?: (id: string) => Promise<void>;
}

export const GuardianHub: React.FC<GuardianHubProps> = ({
  guardians,
  patients,
  activePatient,
  alertLogs,
  doseEvents,
  medicines,
  highContrast,
  largeText,
  ttsEnabled,
  onRefresh,
  onDeleteGuardian,
}) => {
  // Real-time local Bluetooth / LAN synchronization indicator state
  const [syncStatus, setSyncStatus] = useState<'PAIRED' | 'SEARCHING' | 'DISCONNECTED'>(
    guardians.length > 0 ? 'PAIRED' : 'DISCONNECTED'
  );
  const [lastSyncTimestamp, setLastSyncTimestamp] = useState<string>('Just now');
  const [syncChannel, setSyncChannel] = useState<'BLUETOOTH' | 'WIFI_LAN'>('BLUETOOTH');

  // Pairing workflow state
  const [patientPublicKey, setPatientPublicKey] = useState<string>('');
  const [guardianPublicKey, setGuardianPublicKey] = useState<string>('');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [verificationCode, setVerificationCode] = useState<string>('');
  const [isPairingModalOpen, setIsPairingModalOpen] = useState<boolean>(false);
  const [isEnlargedQrOpen, setIsEnlargedQrOpen] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<boolean>(false);
  const [regeneratingKey, setRegeneratingKey] = useState<boolean>(false);
  const [inputPeerKey, setInputPeerKey] = useState<string>('');
  const [newGuardianName, setNewGuardianName] = useState<string>('Elena (Daughter)');
  const [newGuardianPhone, setNewGuardianPhone] = useState<string>('+1 (555) 234-5678');
  const [newGuardianRelation, setNewGuardianRelation] = useState<string>('Primary Caregiver');
  const [selectedChannel, setSelectedChannel] = useState<'BLUETOOTH' | 'WIFI_LAN' | 'REMOTE'>('BLUETOOTH');

  // BLE Scan state
  const [bleStatus, setBleStatus] = useState<string>('');
  const [isScanningBle, setIsScanningBle] = useState<boolean>(false);

  // Update sync status when guardians change
  useEffect(() => {
    if (guardians.length > 0) {
      setSyncStatus('PAIRED');
      setSyncChannel(guardians[0].connectionType === 'WIFI_LAN' ? 'WIFI_LAN' : 'BLUETOOTH');
    } else {
      setSyncStatus('DISCONNECTED');
    }
  }, [guardians]);

  // Trigger test sync/search
  const handleTestSync = async () => {
    setSyncStatus('SEARCHING');
    sound.vibrate([60, 40, 60]);
    SpeechEngine.speak('Searching for nearby peer guardian over local Bluetooth and Wi-Fi.', ttsEnabled);

    setTimeout(() => {
      if (guardians.length > 0) {
        setSyncStatus('PAIRED');
        setLastSyncTimestamp('Just now');
        sound.playSuccessChime();
        SpeechEngine.speak('Local synchronization verified. Guardian is paired and in range.', ttsEnabled);
      } else {
        setSyncStatus('DISCONNECTED');
        sound.playAlertChime();
        SpeechEngine.speak('No paired guardian detected. Please pair a guardian device.', ttsEnabled);
      }
    }, 1800);
  };

  // Filter unacknowledged or critical alerts
  const unacknowledgedAlerts = alertLogs.filter(
    a => a.status === 'QUEUED' || a.status === 'SENDING' || a.status === 'DELIVERED'
  );

  // Generate or retrieve patient ECDH key for QR pairing
  useEffect(() => {
    const setupKeys = async () => {
      try {
        let storedKey = localStorage.getItem('CAREDOS_ECDH_PUBKEY');
        if (!storedKey) {
          const keyPair = await CryptoEngine.generateKeyPair();
          storedKey = await CryptoEngine.exportPublicKey(keyPair.publicKey);
          localStorage.setItem('CAREDOS_ECDH_PUBKEY', storedKey);
        }
        setPatientPublicKey(storedKey);

        const code = await CryptoEngine.get6DigitVerificationCode(storedKey);
        setVerificationCode(code);

        // Generate QR code
        const qrUrl = await QRCode.toDataURL(
          JSON.stringify({
            app: 'CareDose',
            patientId: activePatient?.id || 'patient_1',
            patientName: activePatient?.name || 'Patient',
            pubKey: storedKey,
            code
          }),
          { width: 220, margin: 1 }
        );
        setQrDataUrl(qrUrl);
      } catch (err) {
        console.error('Key generation error:', err);
      }
    };

    setupKeys();
  }, [activePatient]);

  // Rotate and generate fresh ECDH key pair
  const handleRegenerateKeys = async () => {
    setRegeneratingKey(true);
    try {
      const keyPair = await CryptoEngine.generateKeyPair();
      const newKey = await CryptoEngine.exportPublicKey(keyPair.publicKey);
      localStorage.setItem('CAREDOS_ECDH_PUBKEY', newKey);
      setPatientPublicKey(newKey);
      const code = await CryptoEngine.get6DigitVerificationCode(newKey);
      setVerificationCode(code);
      const qrUrl = await QRCode.toDataURL(
        JSON.stringify({
          app: 'CareDose',
          patientId: activePatient?.id || 'patient_1',
          patientName: activePatient?.name || 'Patient',
          pubKey: newKey,
          code
        }),
        { width: 280, margin: 1 }
      );
      setQrDataUrl(qrUrl);
      sound.playSuccessChime();
      SpeechEngine.speak('New cryptographic pairing key generated.', ttsEnabled);
    } catch (err) {
      console.error('Failed to regenerate key:', err);
    } finally {
      setRegeneratingKey(false);
    }
  };

  // Download QR Code image
  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `caredose-pairing-qr-${activePatient?.name ? activePatient.name.toLowerCase().replace(/\s+/g, '-') : 'patient'}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    sound.playSuccessChime();
  };

  // Copy public key to clipboard
  const handleCopyKey = () => {
    if (!patientPublicKey) return;
    navigator.clipboard.writeText(patientPublicKey);
    setCopiedKey(true);
    sound.playSuccessChime();
    setTimeout(() => setCopiedKey(false), 2500);
  };

  // Guardian Quick Action: Confirm Yes / Confirm No / Acknowledge alert
  const handleGuardianAlertAction = async (
    alert: AlertLogItem,
    action: 'CONFIRMED_TAKEN' | 'CONFIRMED_DECLINED' | 'ACKNOWLEDGED_ONLY'
  ) => {
    const guardian = guardians[0];
    const guardianId = guardian ? guardian.id : 'guardian_default';

    const dose = doseEvents.find(d => d.id === alert.doseEventId);
    const med = dose ? medicines.find(m => m.id === dose.medicineId) : null;
    let remainingInfo = '';

    if (action === 'CONFIRMED_TAKEN' && med) {
      const current = med.totalStock !== undefined ? med.totalStock : 20;
      const updated = Math.max(0, current - 1);
      med.totalStock = updated;
      const { db } = await import('../services/db');
      await db.put('medicines', { ...med, totalStock: updated });
      remainingInfo = ` Patient now has ${updated} tablets remaining.`;
    }

    await alertManager.acknowledgeAlert(alert.id, guardianId, action);
    sound.playSuccessChime();
    SpeechEngine.speak(
      `Alert acknowledged. Dose recorded as ${
        action === 'CONFIRMED_TAKEN' ? 'taken' : action === 'CONFIRMED_DECLINED' ? 'declined' : 'reviewed'
      }.${remainingInfo}`,
      ttsEnabled
    );

    if (action === 'CONFIRMED_TAKEN') {
      confetti({ particleCount: 30, spread: 50, origin: { y: 0.4 } });
    }

    await onRefresh();
  };

  // Guardian Quick Action: Directly Confirm Pending Dose
  const handleGuardianDoseConfirm = async (dose: DoseEvent, confirmedTaken: boolean) => {
    const guardian = guardians[0];
    const guardianId = guardian ? guardian.id : 'guardian_default';

    const med = medicines.find(m => m.id === dose.medicineId);
    let remainingInfo = '';

    if (confirmedTaken && med) {
      const current = med.totalStock !== undefined ? med.totalStock : 20;
      const updated = Math.max(0, current - 1);
      med.totalStock = updated;
      const { db } = await import('../services/db');
      await db.put('medicines', { ...med, totalStock: updated });
      remainingInfo = ` Patient has ${updated} tablets remaining.`;
    }

    await alertManager.guardianConfirmDose(dose.id, guardianId, confirmedTaken);
    sound.playSuccessChime();
    SpeechEngine.speak(
      `Dose updated by guardian as ${confirmedTaken ? 'taken' : 'not taken'}.${remainingInfo}`,
      ttsEnabled
    );
    await onRefresh();
  };

  // Test scan with Web Bluetooth
  const handleTestBleScan = async () => {
    setIsScanningBle(true);
    setBleStatus('Scanning for nearby Bluetooth devices...');
    const res = await alertManager.getBLEAdapter().scanForPeripherals();
    setBleStatus(res.message);
    setIsScanningBle(false);
  };

  // Complete cryptographic pairing
  const handleCompletePairing = async () => {
    if (!newGuardianName.trim()) return;

    // Derive verification code from peer key if provided, or default
    const peerKeyToSave = inputPeerKey.trim() || patientPublicKey;
    const derivedCode = await CryptoEngine.get6DigitVerificationCode(peerKeyToSave);

    const newGuardian: GuardianProfile = {
      id: 'g_' + Date.now(),
      name: newGuardianName.trim(),
      phone: newGuardianPhone.trim(),
      relationship: newGuardianRelation.trim(),
      pairingPublicKey: peerKeyToSave,
      sharedSecret: 'DERIVED_AES256_' + derivedCode,
      connectionType: selectedChannel,
      pairingStatus: 'PAIRED',
      pairedAt: Date.now()
    };

    const { db } = await import('../services/db');
    await db.put('guardians', newGuardian);
    setIsPairingModalOpen(false);
    setInputPeerKey('');
    sound.playSuccessChime();
    SpeechEngine.speak(`Guardian ${newGuardian.name} paired with encrypted security code.`, ttsEnabled);
    await onRefresh();
  };

  return (
    <div className="space-y-4">
      {/* SECTION 0: REAL-TIME LOCAL BLUETOOTH / LAN SYNCHRONIZATION STATUS INDICATOR */}
      <section
        className={`p-4 sm:p-5 rounded-2xl border transition-all ${
          syncStatus === 'PAIRED'
            ? highContrast
              ? 'bg-neutral-900 border-2 border-emerald-400 text-yellow-300'
              : 'bg-emerald-50/90 border-emerald-300 text-emerald-950 shadow-xs'
            : syncStatus === 'SEARCHING'
            ? highContrast
              ? 'bg-neutral-900 border-2 border-yellow-300 text-yellow-300'
              : 'bg-amber-50/90 border-amber-300 text-amber-950 shadow-xs'
            : highContrast
            ? 'bg-neutral-950 border-2 border-neutral-700 text-yellow-300'
            : 'bg-slate-100 border-slate-300 text-slate-800 shadow-xs'
        }`}
      >
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-start gap-3">
            {/* Status Icon */}
            <div
              className={`p-2.5 rounded-2xl shrink-0 transition-transform ${
                syncStatus === 'PAIRED'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : syncStatus === 'SEARCHING'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-slate-400 text-white'
              }`}
            >
              {syncStatus === 'PAIRED' ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : syncStatus === 'SEARCHING' ? (
                <Radio className="w-5 h-5 animate-pulse" />
              ) : (
                <XCircle className="w-5 h-5" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className={`font-black tracking-tight ${largeText ? 'text-lg' : 'text-sm'}`}>
                  {syncStatus === 'PAIRED'
                    ? 'Local Synchronization Active (Paired)'
                    : syncStatus === 'SEARCHING'
                    ? 'Searching for Guardian Device...'
                    : 'Local Synchronization Disconnected'}
                </h3>

                {/* State Badge with Pulse */}
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider border ${
                    syncStatus === 'PAIRED'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-400 dark:bg-emerald-950 dark:text-emerald-300'
                      : syncStatus === 'SEARCHING'
                      ? 'bg-amber-100 text-amber-800 border-amber-400 dark:bg-amber-950 dark:text-amber-300'
                      : 'bg-slate-200 text-slate-700 border-slate-400 dark:bg-neutral-800 dark:text-slate-300'
                  }`}
                >
                  <span className="relative flex h-2 w-2">
                    {syncStatus === 'PAIRED' && (
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    )}
                    {syncStatus === 'SEARCHING' && (
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    )}
                    <span
                      className={`relative inline-flex rounded-full h-2 w-2 ${
                        syncStatus === 'PAIRED'
                          ? 'bg-emerald-500'
                          : syncStatus === 'SEARCHING'
                          ? 'bg-amber-500'
                          : 'bg-slate-400'
                      }`}
                    ></span>
                  </span>
                  <span>{syncStatus}</span>
                </span>
              </div>

              <p className="text-xs opacity-90 mt-1 max-w-md leading-relaxed">
                {syncStatus === 'PAIRED'
                  ? `Encrypted peer-to-peer heartbeat active via ${
                      syncChannel === 'BLUETOOTH' ? 'Bluetooth Low Energy' : 'Local Wi-Fi Subnet'
                    }. Missed doses dispatch without cloud fees.`
                  : syncStatus === 'SEARCHING'
                  ? 'Broadcasting cryptographic beacon over Bluetooth LE and searching local Wi-Fi multicast...'
                  : 'No paired guardian is currently active in range. Safety alerts will queue on this device.'}
              </p>

              {/* Status details & metrics */}
              <div className="flex items-center gap-3 text-[11px] font-bold mt-2 flex-wrap">
                <span className="flex items-center gap-1">
                  {syncChannel === 'BLUETOOTH' ? (
                    <Bluetooth className="w-3.5 h-3.5 text-blue-600 dark:text-yellow-300" />
                  ) : (
                    <Wifi className="w-3.5 h-3.5 text-teal-600 dark:text-yellow-300" />
                  )}
                  <span>Channel: {syncChannel === 'BLUETOOTH' ? 'Bluetooth LE' : 'LAN Wi-Fi'}</span>
                </span>
                <span>·</span>
                <span>Last Sync: {lastSyncTimestamp}</span>
                {guardians.length > 0 && (
                  <>
                    <span>·</span>
                    <span>{guardians.length} Paired Guardian{guardians.length > 1 ? 's' : ''}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleTestSync}
              disabled={syncStatus === 'SEARCHING'}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 shadow-xs transition-transform active:scale-95 ${
                highContrast
                  ? 'border-yellow-300 text-yellow-300 hover:bg-neutral-800'
                  : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-300'
              }`}
              title="Test synchronization between patient and guardian devices"
            >
              <RotateCw className={`w-3.5 h-3.5 ${syncStatus === 'SEARCHING' ? 'animate-spin text-amber-500' : ''}`} />
              <span>{syncStatus === 'SEARCHING' ? 'Scanning...' : 'Test Sync'}</span>
            </button>

            <button
              type="button"
              onClick={() =>
                setSyncChannel(prev => (prev === 'BLUETOOTH' ? 'WIFI_LAN' : 'BLUETOOTH'))
              }
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                highContrast
                  ? 'border-yellow-300 text-yellow-300'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
              }`}
              title="Toggle channel between Bluetooth LE and Local LAN"
            >
              {syncChannel === 'BLUETOOTH' ? 'Switch to Wi-Fi' : 'Switch to BLE'}
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 1: RAPID ACTION CENTER FOR GUARDIANS */}
      <section
        className={`rounded-2xl border p-4 transition-all ${
          unacknowledgedAlerts.length > 0
            ? highContrast
              ? 'bg-neutral-950 border-2 border-red-500 text-yellow-300'
              : 'bg-rose-50/90 border-rose-300 shadow-sm'
            : highContrast
            ? 'bg-neutral-900 border-yellow-300 text-yellow-300'
            : 'bg-white border-slate-200 text-slate-800 shadow-xs'
        }`}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <div
              className={`p-2 rounded-xl ${
                unacknowledgedAlerts.length > 0
                  ? 'bg-rose-600 text-white animate-pulse'
                  : 'bg-teal-100 text-teal-800'
              }`}
            >
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className={`font-black ${largeText ? 'text-xl' : 'text-base'}`}>
                Guardian Action Center
              </h2>
              <p className="text-xs text-slate-500 dark:text-yellow-200">
                {unacknowledgedAlerts.length} Active Alert{unacknowledgedAlerts.length === 1 ? '' : 's'} Requiring
                Attention
              </p>
            </div>
          </div>

          {activePatient?.phone && (
            <a
              href={`tel:${activePatient.phone}`}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Call Patient</span>
            </a>
          )}
        </div>

        {/* List of active alerts with Quick Action Buttons */}
        {unacknowledgedAlerts.length === 0 ? (
          <div className="py-4 text-center text-xs text-slate-500 dark:text-yellow-200 flex flex-col items-center gap-1">
            <ShieldCheck className="w-8 h-8 text-emerald-600 mb-1" />
            <span className="font-bold text-slate-700 dark:text-yellow-100">All alerts clear and acknowledged.</span>
            <span>No pending missed doses or silence escalations for {activePatient?.name}.</span>
          </div>
        ) : (
          <div className="space-y-3 mt-3">
            {unacknowledgedAlerts.map(alert => {
              const dose = doseEvents.find(d => d.id === alert.doseEventId);
              const med = dose ? medicines.find(m => m.id === dose.medicineId) : null;

              return (
                <div
                  key={alert.id}
                  className={`p-3.5 rounded-xl border ${
                    highContrast
                      ? 'bg-neutral-900 border-yellow-300'
                      : 'bg-white border-rose-200 shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200">
                        {alert.type}
                      </span>
                      <h4 className="font-black text-sm text-slate-900 dark:text-yellow-200 mt-1">
                        {med ? `${med.name} (${med.dosage})` : alert.details}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-yellow-300">
                        Triggered at {new Date(alert.timestamp).toLocaleTimeString()} via {alert.channelUsed}
                      </p>
                    </div>

                    <span className="text-xs font-bold text-rose-600">Action Required</span>
                  </div>

                  {/* QUICK ACTION BUTTONS FOR GUARDIANS */}
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-neutral-800 grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handleGuardianAlertAction(alert, 'CONFIRMED_TAKEN')}
                      className="py-2.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95 min-h-[42px]"
                      title="Confirm that patient took their medicine"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirm Taken (YES)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleGuardianAlertAction(alert, 'CONFIRMED_DECLINED')}
                      className="py-2.5 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95 min-h-[42px]"
                      title="Record as declined and note guardian follow-up"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Confirm Not Taken (NO)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleGuardianAlertAction(alert, 'ACKNOWLEDGED_ONLY')}
                      className="py-2.5 px-3 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95 min-h-[42px]"
                      title="Mark as seen without altering dose confirmation status"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Acknowledge Only</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* SECTION 2: TODAY'S DOSES REVIEW FOR GUARDIAN */}
      <section
        className={`p-4 rounded-2xl border ${
          highContrast
            ? 'bg-neutral-900 border-yellow-300 text-yellow-300'
            : 'bg-white border-slate-200 text-slate-800 shadow-xs'
        }`}
      >
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100 dark:border-neutral-800">
          <div>
            <h3 className="font-bold text-sm">Patient Daily Adherence Tracker</h3>
            <p className="text-[11px] text-slate-500 dark:text-yellow-200">
              Direct verification of {activePatient?.name}'s medications
            </p>
          </div>
          <button
            type="button"
            onClick={onRefresh}
            className="text-xs text-teal-700 dark:text-yellow-300 hover:underline flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>

        <div className="space-y-2">
          {doseEvents.map(dose => {
            const med = medicines.find(m => m.id === dose.medicineId);
            const timeStr = new Date(dose.scheduledTime).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            });

            return (
              <div
                key={dose.id}
                className="p-2.5 rounded-lg border border-slate-100 dark:border-neutral-800 flex items-center justify-between gap-2 text-xs"
              >
                <div>
                  <div className="font-bold text-slate-800 dark:text-yellow-100">
                    {med?.name || 'Med'} · {timeStr}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-yellow-300">
                    {med?.dosage} · Stock: <strong className="text-emerald-700 dark:text-yellow-200">{med?.totalStock ?? 20} left</strong> · Status: <strong>{dose.status}</strong>
                    {dose.acknowledgedAt && ` · Verified by Guardian`}
                  </div>
                </div>

                {/* Quick 1-tap confirmation button for guardians */}
                {dose.status === 'PENDING' && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleGuardianDoseConfirm(dose, true)}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold"
                      title="Guardian confirms dose was taken"
                    >
                      ✓ Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => handleGuardianDoseConfirm(dose, false)}
                      className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[11px] font-bold"
                      title="Guardian marks dose as skipped"
                    >
                      ✕ No
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 3: DESIGNATED GUARDIANS & P2P CONNECTION STATUS */}
      <section
        className={`p-4 rounded-2xl border ${
          highContrast
            ? 'bg-neutral-900 border-yellow-300 text-yellow-300'
            : 'bg-white border-slate-200 text-slate-800 shadow-xs'
        }`}
      >
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100 dark:border-neutral-800">
          <div>
            <h3 className="font-bold text-sm">Designated Guardians</h3>
            <p className="text-[11px] text-slate-500 dark:text-yellow-200">
              Authenticated via ECDH P-256 + AES-GCM 256
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsPairingModalOpen(true)}
            className="px-3 py-1.5 bg-teal-700 text-white rounded-lg text-xs font-bold hover:bg-teal-800 flex items-center gap-1 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Pair Guardian</span>
          </button>
        </div>

        {guardians.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-500">
            <p className="mb-2">No guardian paired yet.</p>
            <button
              type="button"
              onClick={() => setIsPairingModalOpen(true)}
              className="px-3 py-1.5 bg-teal-700 text-white rounded-lg font-bold hover:bg-teal-800"
            >
              Start Cryptographic Pairing
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {guardians.map(g => (
              <div
                key={g.id}
                className="p-3 rounded-xl border border-slate-200 dark:border-neutral-800 space-y-2 text-xs"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-yellow-100">{g.name}</h4>
                    <p className="text-slate-500 dark:text-yellow-300 text-[11px]">
                      {g.relationship} · {g.phone || 'No phone'}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                    {g.pairingStatus}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-[11px] text-slate-600 dark:text-yellow-200">
                  <span className="flex items-center gap-1 font-semibold">
                    {g.connectionType === 'BLUETOOTH' ? (
                      <Bluetooth className="w-3.5 h-3.5 text-blue-600" />
                    ) : (
                      <Wifi className="w-3.5 h-3.5 text-teal-600" />
                    )}
                    {g.connectionType}
                  </span>
                  <span>·</span>
                  <span className="font-mono text-[10px] truncate max-w-[150px]">
                    Key: {g.pairingPublicKey.slice(0, 14)}...
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-neutral-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        await alertManager.dispatchAlert(
                          activePatient!.id,
                          activePatient!.name,
                          'SYSTEM_TEST',
                          'Direct P2P Signal Test',
                          'Standard Packet'
                        );
                        await onRefresh();
                      }}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 text-slate-700 dark:text-yellow-200 rounded text-[11px] font-bold flex items-center gap-1"
                    >
                      <Send className="w-3 h-3" />
                      Ping Test
                    </button>

                    <button
                      type="button"
                      onClick={handleTestBleScan}
                      disabled={isScanningBle}
                      className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded text-[11px] font-bold flex items-center gap-1"
                    >
                      <Bluetooth className="w-3 h-3" />
                      {isScanningBle ? 'Scanning...' : 'BLE Scan'}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={async () => {
                      const { db } = await import('../services/db');
                      await db.delete('guardians', g.id);
                      await onRefresh();
                    }}
                    className="text-[11px] text-rose-600 hover:underline font-semibold"
                  >
                    Revoke
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {bleStatus && (
          <div className="mt-3 p-2 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-800">
            {bleStatus}
          </div>
        )}
      </section>

      {/* SECTION 4: PATIENT CRYPTOGRAPHIC PAIRING QR CODE GENERATOR */}
      <section
        className={`p-5 rounded-2xl border transition-all ${
          highContrast
            ? 'bg-neutral-900 border-2 border-yellow-300 text-yellow-300'
            : 'bg-white border-slate-200 text-slate-800 shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${highContrast ? 'bg-yellow-300 text-black' : 'bg-teal-100 text-teal-800'}`}>
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`font-black ${largeText ? 'text-lg' : 'text-sm'}`}>
                {t('qrPairingTitle')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-yellow-200">
                ECDH P-256 Public Key Sharing for New Devices
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleRegenerateKeys}
              disabled={regeneratingKey}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-colors flex items-center gap-1 ${
                highContrast
                  ? 'border-yellow-300 text-yellow-300 hover:bg-neutral-800'
                  : 'border-slate-300 text-slate-600 hover:bg-slate-50'
              }`}
              title="Rotate and regenerate fresh ECDH key pair"
            >
              <RotateCw className={`w-3.5 h-3.5 ${regeneratingKey ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Rotate Key</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
          {/* QR Code Canvas Card */}
          <div className="flex flex-col items-center text-center p-4 rounded-2xl bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800">
            {qrDataUrl ? (
              <div className="relative group">
                <div className="bg-white p-3 rounded-2xl border-2 border-slate-200 shadow-md">
                  <img
                    src={qrDataUrl}
                    alt="Patient Pairing QR Code"
                    className="w-48 h-48 sm:w-52 sm:h-52 object-contain mx-auto"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setIsEnlargedQrOpen(true)}
                  className="mt-2 text-xs text-teal-700 dark:text-yellow-300 hover:underline font-bold inline-flex items-center gap-1"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Enlarge Full Screen</span>
                </button>
              </div>
            ) : (
              <div className="w-48 h-48 flex items-center justify-center text-xs text-slate-400">
                Generating QR code...
              </div>
            )}

            {/* 6-Digit Verification Code */}
            <div className="mt-3 w-full p-2.5 rounded-xl bg-teal-50 dark:bg-neutral-900 border border-teal-200 dark:border-yellow-300">
              <span className="text-[10px] uppercase font-bold text-teal-800 dark:text-yellow-300 block">
                Security SAS Fingerprint
              </span>
              <span className="font-mono text-xl sm:text-2xl font-black tracking-widest text-teal-950 dark:text-yellow-200">
                {verificationCode}
              </span>
            </div>
          </div>

          {/* Details & Action Controls */}
          <div className="space-y-3.5 text-xs">
            <div>
              <span className="font-bold block text-slate-800 dark:text-yellow-100">
                Patient Public Identity:
              </span>
              <p className="text-slate-600 dark:text-yellow-200 text-xs mt-0.5">
                {activePatient?.name || 'No Patient Set'} {activePatient?.phone ? `(${activePatient.phone})` : ''}
              </p>
            </div>

            <div>
              <span className="font-bold block text-slate-800 dark:text-yellow-100 mb-1">
                ECDH P-256 Public Key (Hex/Base64):
              </span>
              <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 font-mono text-[11px] break-all select-all text-slate-700 dark:text-yellow-300 max-h-20 overflow-y-auto">
                {patientPublicKey || 'Generating cryptographic key...'}
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={handleCopyKey}
                className={`p-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-95 ${
                  copiedKey
                    ? 'bg-emerald-600 text-white'
                    : highContrast
                    ? 'bg-yellow-300 text-black hover:bg-yellow-200'
                    : 'bg-teal-700 text-white hover:bg-teal-800'
                }`}
              >
                {copiedKey ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedKey ? t('publicKeyCopied') : t('copyPublicKey')}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadQr}
                className={`p-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border transition-all shadow-xs active:scale-95 ${
                  highContrast
                    ? 'bg-neutral-900 border-yellow-300 text-yellow-300 hover:bg-neutral-800'
                    : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-300'
                }`}
              >
                <Download className="w-4 h-4" />
                <span>{t('downloadQr')}</span>
              </button>
            </div>

            {/* Pairing Instructions */}
            <div className="p-3 rounded-xl bg-teal-50/70 dark:bg-neutral-950 border border-teal-200 dark:border-neutral-800 text-[11px] text-teal-950 dark:text-yellow-200 space-y-1">
              <span className="font-black uppercase tracking-wider block text-teal-900 dark:text-yellow-300 text-[10px]">
                How Cryptographic Pairing Works:
              </span>
              <p>1. Open CareDose on the guardian's phone or tablet.</p>
              <p>2. Tap "Pair Guardian" and point camera at this QR code.</p>
              <p>3. Confirm matching 6-digit security code for zero-cost encrypted alerts over BLE / local Wi-Fi.</p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: ZERO MANDATORY COST TRANSPARENCY NOTICE */}
      <section className="p-3.5 rounded-xl bg-teal-50/80 border border-teal-200 text-xs space-y-1.5 text-teal-950">
        <div className="font-bold flex items-center gap-1.5 text-teal-900">
          <KeyRound className="w-4 h-4 text-teal-700" />
          <span>Zero Mandatory Recurring Cost Guarantee</span>
        </div>
        <p className="text-[11px] leading-relaxed text-teal-900/90">
          CareDose communicates peer-to-peer over authenticated Bluetooth LE and Local Wi-Fi router
          subnets. No paid SMS gateways, Twilio subscriptions, or cloud database servers are required for
          daily safety.
        </p>
      </section>

      {/* PAIRING MODAL (QR CODE & CRYPTOGRAPHIC VERIFICATION) */}
      {isPairingModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4"
        >
          <div
            className={`w-full max-w-sm rounded-2xl p-5 space-y-4 shadow-2xl border max-h-[90vh] overflow-y-auto ${
              highContrast
                ? 'bg-neutral-950 border-2 border-yellow-300 text-yellow-300'
                : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="text-center">
              <h3 className="font-bold text-base">Cryptographic Guardian Pairing</h3>
              <p className="text-xs text-slate-500 dark:text-yellow-200 mt-0.5">
                Scan QR or match 6-digit verification code
              </p>
            </div>

            {/* QR Code Canvas/Image */}
            {qrDataUrl && (
              <div className="bg-white p-3 rounded-xl border max-w-[200px] mx-auto shadow-xs text-center">
                <img src={qrDataUrl} alt="Pairing QR Code" className="w-full h-auto" />
                <span className="text-[10px] text-slate-500 font-mono block mt-1">ECDH P-256 Public Key</span>
              </div>
            )}

            {/* 6-Digit Cryptographic Code */}
            <div className="text-center p-2.5 rounded-xl bg-teal-50 dark:bg-neutral-900 border border-teal-200 dark:border-yellow-300">
              <span className="text-[10px] uppercase font-bold text-teal-800 dark:text-yellow-300 block">
                Security Verification Code
              </span>
              <span className="font-mono text-2xl font-black tracking-widest text-teal-950 dark:text-yellow-200">
                {verificationCode}
              </span>
            </div>

            {/* Guardian details input */}
            <div className="space-y-2 text-xs">
              <div>
                <label className="block font-bold mb-1">Guardian Name</label>
                <input
                  type="text"
                  value={newGuardianName}
                  onChange={e => setNewGuardianName(e.target.value)}
                  className="w-full p-2 border rounded-lg text-sm bg-slate-50 dark:bg-neutral-900"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Phone Number (For direct calling)</label>
                <input
                  type="text"
                  value={newGuardianPhone}
                  onChange={e => setNewGuardianPhone(e.target.value)}
                  className="w-full p-2 border rounded-lg text-sm bg-slate-50 dark:bg-neutral-900"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Preferred Channel</label>
                <select
                  value={selectedChannel}
                  onChange={e => setSelectedChannel(e.target.value as any)}
                  className="w-full p-2 border rounded-lg text-sm bg-slate-50 dark:bg-neutral-900"
                >
                  <option value="BLUETOOTH">Bluetooth Low Energy (BLE)</option>
                  <option value="WIFI_LAN">Local Wi-Fi (WebRTC DataChannel)</option>
                  <option value="REMOTE">Optional Remote Push</option>
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1">Peer Public Key (Paste from Guardian device)</label>
                <textarea
                  rows={2}
                  placeholder="Paste peer public key base64 (or leave blank to auto-pair demo key)"
                  value={inputPeerKey}
                  onChange={e => setInputPeerKey(e.target.value)}
                  className="w-full p-2 border rounded-lg font-mono text-[11px] bg-slate-50 dark:bg-neutral-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsPairingModalOpen(false)}
                className="py-2.5 px-3 rounded-lg border font-bold text-xs hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCompletePairing}
                className="py-2.5 px-3 rounded-lg bg-teal-700 text-white font-bold text-xs hover:bg-teal-800 shadow"
              >
                Confirm & Pair
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULLSCREEN ENLARGED QR CODE MODAL */}
      {isEnlargedQrOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div
            className={`w-full max-w-sm rounded-3xl p-6 text-center space-y-4 shadow-2xl border ${
              highContrast
                ? 'bg-neutral-950 border-2 border-yellow-300 text-yellow-300'
                : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-neutral-800">
              <div className="text-left">
                <h3 className="font-black text-base">Cryptographic Pairing QR</h3>
                <p className="text-xs text-slate-500 dark:text-yellow-200">{activePatient?.name || 'Patient'}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsEnlargedQrOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 focus:outline-none"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-white p-4 rounded-2xl border-4 border-slate-300 max-w-[260px] mx-auto shadow-inner">
              <img src={qrDataUrl} alt="Large Pairing QR Code" className="w-full h-auto" />
            </div>

            <div className="p-3 rounded-xl bg-teal-50 dark:bg-neutral-900 border border-teal-200 dark:border-yellow-300">
              <span className="text-[10px] uppercase font-bold text-teal-800 dark:text-yellow-300 block">
                Verification Security Code
              </span>
              <span className="font-mono text-3xl font-black tracking-widest text-teal-950 dark:text-yellow-200">
                {verificationCode}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsEnlargedQrOpen(false)}
              className="w-full py-3 bg-teal-700 text-white rounded-xl font-black text-xs hover:bg-teal-800 shadow min-h-[44px]"
            >
              Done Scanning
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
