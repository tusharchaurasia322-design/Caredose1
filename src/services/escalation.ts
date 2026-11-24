// src/services/escalation.ts
import { db, PatientProfile } from './db';
import { alertManager } from './alertManager';

export const SILENCE_THRESHOLD_MS = 48 * 60 * 60 * 1000; // 48 Hours

export class EscalationWatchdog {
  // Record a conscious user action: YES on dose or tapping "I am Safe"
  static async recordQualifyingCheckIn(patientId: string): Promise<void> {
    const patient = await db.get<PatientProfile>('patients', patientId);
    if (!patient) return;

    patient.lastQualifyingCheckIn = Date.now();
    await db.put('patients', patient);
    console.log(
      `[Watchdog] Qualifying conscious check-in logged for ${patient.name} at ${new Date(
        patient.lastQualifyingCheckIn
      ).toISOString()}`
    );
  }

  // Evaluate 48-hour silence rule
  static async evaluateSilence(
    patientId: string,
    testIntervalMs?: number
  ): Promise<{
    isViolated: boolean;
    elapsedMs: number;
    hoursRemaining: number;
    percentRemaining: number;
    lastCheckInTime: number;
  }> {
    const patient = await db.get<PatientProfile>('patients', patientId);
    if (!patient) throw new Error('Patient not found');

    const threshold = testIntervalMs || SILENCE_THRESHOLD_MS;
    const now = Date.now();
    const lastCheckIn = patient.lastQualifyingCheckIn || patient.createdAt;
    const elapsed = now - lastCheckIn;
    const isViolated = elapsed >= threshold;
    const remainingMs = Math.max(0, threshold - elapsed);
    const hoursRemaining = +(remainingMs / (1000 * 60 * 60)).toFixed(1);
    const percentRemaining = Math.max(0, Math.min(100, Math.round((remainingMs / threshold) * 100)));

    if (isViolated) {
      console.warn(`[Watchdog] 48-Hour Silence Escalation triggered for ${patient.name}`);
      await alertManager.dispatchAlert(
        patient.id,
        patient.name,
        'SILENCE_48H_ESCALATION',
        undefined,
        undefined
      );
    }

    return {
      isViolated,
      elapsedMs: elapsed,
      hoursRemaining,
      percentRemaining,
      lastCheckInTime: lastCheckIn
    };
  }
}
