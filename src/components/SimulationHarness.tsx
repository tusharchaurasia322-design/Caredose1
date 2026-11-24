// src/components/SimulationHarness.tsx
import React, { useState } from 'react';
import { db, DoseEvent, Medicine, PatientProfile } from '../services/db';
import { alertManager } from '../services/alertManager';
import { EscalationWatchdog } from '../services/escalation';
import { sound, SpeechEngine } from '../services/audio';
import { CryptoEngine } from '../services/crypto';
import {
  FlaskConical,
  Play,
  Volume2,
  AlertTriangle,
  ShieldAlert,
  KeyRound,
  RotateCcw,
  CheckCircle,
  Sparkles,
  Bluetooth
} from 'lucide-react';

interface SimulationHarnessProps {
  activePatient: PatientProfile | null;
  medicines: Medicine[];
  highContrast: boolean;
  largeText: boolean;
  ttsEnabled: boolean;
  onRefresh: () => Promise<void>;
  onTriggerPrompt: (dose: DoseEvent, med: Medicine) => void;
}

export const SimulationHarness: React.FC<SimulationHarnessProps> = ({
  activePatient,
  medicines,
  highContrast,
  largeText,
  ttsEnabled,
  onRefresh,
  onTriggerPrompt,
}) => {
  const [cryptoTestOutput, setCryptoTestOutput] = useState<string>('');
  const [runningTest, setRunningTest] = useState<string | null>(null);

  // 1. Trigger Immediate Due Dose Reminder
  const handleImmediateDoseReminder = async () => {
    if (!activePatient) return;
    setRunningTest('reminder');

    const sampleMed = medicines[0] || {
      id: 'med_test_1',
      patientId: activePatient.id,
      name: 'Lisinopril Test',
      dosage: '10mg',
      instructions: 'Take with a glass of water after food',
      scheduledTimes: ['08:00'],
      startDate: new Date().toISOString().split('T')[0],
      isActive: true,
      remind30MinBefore: true,
      remind5MinBefore: true,
      alertAfter5MinMissed: true,
      totalStock: 20,
      lowStockThreshold: 5,
      unitType: 'tablets'
    };

    const simulatedDose: DoseEvent = {
      id: 'dose_sim_' + Date.now(),
      medicineId: sampleMed.id,
      patientId: activePatient.id,
      scheduledTime: Date.now(),
      status: 'PENDING',
      alertStatus: 'NOT_APPLICABLE',
      deliveryAttemptCount: 0
    };

    await db.put('doses', simulatedDose);
    onTriggerPrompt(simulatedDose, sampleMed);
    setRunningTest(null);
  };

  // 2. Simulate Missed Dose Escalation (+5m threshold reached)
  const handleSimulateMissedDose = async () => {
    if (!activePatient) return;
    setRunningTest('missed');

    const sampleMed = medicines[0] || {
      id: 'med_test_1',
      patientId: activePatient.id,
      name: 'Metformin',
      dosage: '500mg',
      instructions: 'Take with lunch',
      scheduledTimes: ['13:00'],
      startDate: '2026-01-01',
      isActive: true,
      remind30MinBefore: true,
      remind5MinBefore: true,
      alertAfter5MinMissed: true
    };

    const doseId = 'dose_missed_' + Date.now();
    const missedDose: DoseEvent = {
      id: doseId,
      medicineId: sampleMed.id,
      patientId: activePatient.id,
      scheduledTime: Date.now() - 10 * 60 * 1000, // 10 minutes ago
      status: 'MISSED',
      alertStatus: 'QUEUED',
      deliveryAttemptCount: 1,
      lastAttemptLog: 'Missed threshold (+5m) breached. Queued for guardian transmission.'
    };

    await db.put('doses', missedDose);
    await alertManager.dispatchAlert(
      activePatient.id,
      activePatient.name,
      'MISSED_DOSE',
      sampleMed.name,
      sampleMed.dosage,
      doseId
    );

    SpeechEngine.speak(
      `Simulation: Missed dose threshold reached for ${sampleMed.name}. Guardian alert queued.`,
      ttsEnabled
    );

    await onRefresh();
    setRunningTest(null);
  };

  // 3. Simulate 48-Hour Silence Escalation
  const handleSimulateSilenceViolation = async () => {
    if (!activePatient) return;
    setRunningTest('silence');

    // Roll back last qualifying check-in to 49 hours ago
    activePatient.lastQualifyingCheckIn = Date.now() - 49 * 60 * 60 * 1000;
    await db.put('patients', activePatient);

    const res = await EscalationWatchdog.evaluateSilence(activePatient.id);
    SpeechEngine.speak(
      `Simulation: 48-hour silence watchdog violated. Emergency alert dispatched to guardians.`,
      ttsEnabled
    );

    await onRefresh();
    setRunningTest(null);
  };

  // 4. Test Web Crypto ECDH & AES-GCM
  const handleTestCryptoRoundtrip = async () => {
    setRunningTest('crypto');
    try {
      const patientKeys = await CryptoEngine.generateKeyPair();
      const guardianKeys = await CryptoEngine.generateKeyPair();

      const patientPubStr = await CryptoEngine.exportPublicKey(patientKeys.publicKey);
      const guardianPubStr = await CryptoEngine.exportPublicKey(guardianKeys.publicKey);

      const patientCode = await CryptoEngine.get6DigitVerificationCode(patientPubStr);
      const patientSecret = await CryptoEngine.deriveSharedSecret(patientKeys.privateKey, guardianKeys.publicKey);
      const guardianSecret = await CryptoEngine.deriveSharedSecret(guardianKeys.privateKey, patientKeys.publicKey);

      const secretPayload = {
        action: 'DOSE_ALERT',
        patient: 'Maria Silva',
        med: 'Lisinopril 10mg',
        status: 'MISSED',
        timestamp: Date.now()
      };

      const encrypted = await CryptoEngine.encryptPayload(patientSecret, secretPayload);
      const decrypted = await CryptoEngine.decryptPayload(guardianSecret, encrypted.iv, encrypted.cipher);

      setCryptoTestOutput(
        `SUCCESS: ECDH P-256 Shared Key Derived!\n` +
        `• 6-Digit Code: ${patientCode}\n` +
        `• AES-GCM 256-bit IV: ${encrypted.iv}\n` +
        `• Decrypted Packet: ${JSON.stringify(decrypted)}`
      );
      sound.playSuccessChime();
    } catch (err: any) {
      setCryptoTestOutput(`Error in crypto test: ${err?.message}`);
    } finally {
      setRunningTest(null);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className={`font-bold ${largeText ? 'text-xl' : 'text-base'} flex items-center gap-2`}>
          <FlaskConical className="w-5 h-5 text-teal-600" />
          <span>Verification & Edge Simulation Harness</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-yellow-200">
          Simulate offline edge scenarios locally without incurring SMS gateway fees or external cloud billing.
        </p>
      </div>

      <div className="space-y-3">
        {/* Scenario 1 */}
        <div
          className={`p-4 rounded-xl border ${
            highContrast
              ? 'bg-neutral-900 border-yellow-300'
              : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-bold text-sm">1. Immediate Due Dose Prompt (Voice &amp; Touch)</h3>
              <p className="text-xs text-slate-500 dark:text-yellow-200 mt-0.5">
                Spawns the reminder modal and activates the voice listener. Say <strong className="text-teal-700 dark:text-yellow-300">"CareDose, I took my medicine"</strong> to test hands-free confirmation.
              </p>
            </div>

            <button
              type="button"
              onClick={handleImmediateDoseReminder}
              disabled={runningTest === 'reminder'}
              className="px-3 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-bold shrink-0 flex items-center gap-1 shadow-xs"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Trigger Now</span>
            </button>
          </div>
        </div>

        {/* Scenario 2 */}
        <div
          className={`p-4 rounded-xl border ${
            highContrast
              ? 'bg-neutral-900 border-yellow-300'
              : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-bold text-sm text-rose-700 dark:text-rose-400">
                2. Missed Dose Threshold (+5m No Response)
              </h3>
              <p className="text-xs text-slate-500 dark:text-yellow-200 mt-0.5">
                Simulates an expired reminder window. Marks dose as MISSED, logs into the audit trail, and queues alert for Bluetooth/Wi-Fi delivery.
              </p>
            </div>

            <button
              type="button"
              onClick={handleSimulateMissedDose}
              disabled={runningTest === 'missed'}
              className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shrink-0 flex items-center gap-1 shadow-xs"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Simulate Missed</span>
            </button>
          </div>
        </div>

        {/* Scenario 3 */}
        <div
          className={`p-4 rounded-xl border ${
            highContrast
              ? 'bg-neutral-900 border-yellow-300'
              : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-bold text-sm text-purple-700 dark:text-purple-400">
                3. 48-Hour Silence Escalation Violation
              </h3>
              <p className="text-xs text-slate-500 dark:text-yellow-200 mt-0.5">
                Rolls back the conscious check-in timestamp to 49 hours ago. Watchdog detects absence of conscious human interaction and triggers guardian alert.
              </p>
            </div>

            <button
              type="button"
              onClick={handleSimulateSilenceViolation}
              disabled={runningTest === 'silence'}
              className="px-3 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-bold shrink-0 flex items-center gap-1 shadow-xs"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Simulate 49h Silence</span>
            </button>
          </div>
        </div>

        {/* Audio Synthesizer Test */}
        <div
          className={`p-4 rounded-xl border ${
            highContrast
              ? 'bg-neutral-900 border-yellow-300'
              : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <h3 className="font-bold text-sm mb-1">4. Zero-Cost Offline Sound Synthesizer</h3>
          <p className="text-xs text-slate-500 dark:text-yellow-200 mb-3">
            Pure Web Audio API oscillator synthesis. Operates 100% offline without external MP3/WAV downloads.
          </p>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => sound.playReminderChime()}
              className="py-2 px-2 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-lg text-xs font-bold flex items-center justify-center gap-1 border border-teal-200"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Reminder Chime</span>
            </button>

            <button
              type="button"
              onClick={() => sound.playAlertChime()}
              className="py-2 px-2 bg-rose-50 hover:bg-rose-100 text-rose-800 rounded-lg text-xs font-bold flex items-center justify-center gap-1 border border-rose-200"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Urgent Alert</span>
            </button>

            <button
              type="button"
              onClick={() => sound.playSuccessChime()}
              className="py-2 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold flex items-center justify-center gap-1 border border-emerald-200"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Safe / Success</span>
            </button>
          </div>
        </div>

        {/* Cryptographic Key Verification */}
        <div
          className={`p-4 rounded-xl border ${
            highContrast
              ? 'bg-neutral-900 border-yellow-300'
              : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-bold text-sm">5. Cryptographic Engine Test (ECDH + AES-GCM)</h3>
              <p className="text-xs text-slate-500 dark:text-yellow-200 mt-0.5">
                Generates in-memory P-256 key pairs, derives shared key, encrypts test medication packet, and decrypts.
              </p>
            </div>

            <button
              type="button"
              onClick={handleTestCryptoRoundtrip}
              disabled={runningTest === 'crypto'}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold shrink-0 flex items-center gap-1 shadow-xs"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Run Crypto Test</span>
            </button>
          </div>

          {cryptoTestOutput && (
            <pre className="mt-3 p-3 rounded-lg bg-slate-900 text-emerald-400 font-mono text-[11px] overflow-x-auto whitespace-pre-wrap">
              {cryptoTestOutput}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
};
