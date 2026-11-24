// src/App.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  db,
  PatientProfile,
  GuardianProfile,
  Medicine,
  DoseEvent,
  AlertLogItem
} from './services/db';
import { alertManager } from './services/alertManager';
import { EscalationWatchdog } from './services/escalation';
import { sound, SpeechEngine } from './services/audio';
import { AccessibilityService, AccessibilitySettings } from './services/accessibility';
import { I18nService, SupportedLanguage, t } from './services/i18n';

import { Header } from './components/Header';
import { SilenceBanner } from './components/SilenceBanner';
import { ScheduleTab } from './components/ScheduleTab';
import { MedicinesTab } from './components/MedicinesTab';
import { GuardianHub } from './components/GuardianHub';
import { HistoryTab } from './components/HistoryTab';
import { SimulationHarness } from './components/SimulationHarness';
import { MedicineModal } from './components/MedicineModal';
import { DueDoseModal } from './components/DueDoseModal';
import { AuditGuideModal } from './components/AuditGuideModal';
import { FloatingAccessibilityButton } from './components/FloatingAccessibilityButton';
import { AccessibilitySettingsModal } from './components/AccessibilitySettingsModal';
import { AccessibilityOnboardingModal } from './components/AccessibilityOnboardingModal';
import { AddChoiceModal } from './components/AddChoiceModal';
import { PatientModal } from './components/PatientModal';
import { GuardianModal } from './components/GuardianModal';
import { HelpTab } from './components/HelpTab';

import {
  CalendarDays,
  Pill,
  ShieldCheck,
  History,
  FlaskConical,
  Plus,
  BellRing,
  HelpCircle
} from 'lucide-react';

export default function App() {
  // App Role & Navigation State
  const [appMode, setAppMode] = useState<'PATIENT' | 'GUARDIAN' | 'DUAL'>('DUAL');
  const [activeTab, setActiveTab] = useState<'SCHEDULE' | 'MEDS' | 'GUARDIANS' | 'HISTORY' | 'SIMULATION' | 'HELP'>('SCHEDULE');

  // Master Accessibility Settings State
  const [settings, setSettings] = useState<AccessibilitySettings>(() => AccessibilityService.getSettings());

  // Core Data
  const [patients, setPatients] = useState<PatientProfile[]>([]);
  const [activePatient, setActivePatient] = useState<PatientProfile | null>(null);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [doseEvents, setDoseEvents] = useState<DoseEvent[]>([]);
  const [alertLogs, setAlertLogs] = useState<AlertLogItem[]>([]);
  const [guardians, setGuardians] = useState<GuardianProfile[]>([]);

  // Modals
  const [activePromptDose, setActivePromptDose] = useState<{ dose: DoseEvent; med: Medicine } | null>(null);
  const [isAddChoiceModalOpen, setIsAddChoiceModalOpen] = useState<boolean>(false);
  const [isPatientModalOpen, setIsPatientModalOpen] = useState<boolean>(false);
  const [isGuardianModalOpen, setIsGuardianModalOpen] = useState<boolean>(false);
  const [isMedModalOpen, setIsMedModalOpen] = useState<boolean>(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState<boolean>(false);
  const [isAccessibilityModalOpen, setIsAccessibilityModalOpen] = useState<boolean>(false);
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState<boolean>(false);

  // Subscribe to accessibility updates
  useEffect(() => {
    const unsub = AccessibilityService.subscribe(newSettings => {
      setSettings(newSettings);
    });
    return () => unsub();
  }, []);

  // Request browser notification permission once politely on mount
  useEffect(() => {
    alertManager.requestNotificationPermission();
  }, []);

  // Refresh all state from IndexedDB
  const refreshAllData = useCallback(async (patientId?: string) => {
    const allPatients = await db.getAll<PatientProfile>('patients');
    setPatients(allPatients);

    const allGuardians = await db.getAll<GuardianProfile>('guardians');
    setGuardians(allGuardians);

    const allAlerts = await db.getAll<AlertLogItem>('alerts');
    setAlertLogs([...allAlerts].sort((a, b) => b.timestamp - a.timestamp));

    const pid = patientId || activePatient?.id || (allPatients.length > 0 ? allPatients[0].id : null);
    if (!pid) {
      setActivePatient(null);
      setMedicines([]);
      setDoseEvents([]);
      return;
    }

    const patient = await db.get<PatientProfile>('patients', pid);
    if (patient) setActivePatient(patient);

    const allMeds = await db.getAll<Medicine>('medicines');
    const patientMeds = allMeds.filter(m => m.patientId === pid && m.isActive);
    setMedicines(patientMeds);

    const allDoses = await db.getAll<DoseEvent>('doses');
    const patientDoses = allDoses.filter(d => d.patientId === pid);
    setDoseEvents(patientDoses);
  }, [activePatient?.id]);

  // Bootstrap initial dataset: Starts EMPTY for every user so they can add patient & guardian info
  const bootstrapData = useCallback(async () => {
    await db.init();
    const pts = await db.getAll<PatientProfile>('patients');
    setPatients(pts);

    // If patients already exist, set active patient; otherwise start completely clean and empty
    if (pts.length > 0) {
      setActivePatient(pts[0]);
      await refreshAllData(pts[0].id);
    } else {
      setActivePatient(null);
      await refreshAllData();
    }
  }, [refreshAllData]);

  // Load sample demo patient (Maria Silva) if the user clicks "Load Sample Demo"
  const handleLoadDemoData = async () => {
    const defaultPatient: PatientProfile = {
      id: 'patient_maria',
      name: 'Maria Silva',
      dob: '1952-04-12',
      phone: '+1 (555) 789-0123',
      preferredLanguage: settings.language || 'en',
      highContrast: false,
      largeFont: false,
      screenReaderVoice: true,
      vibrationAlert: true,
      lastQualifyingCheckIn: Date.now() - 4 * 60 * 60 * 1000,
      createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000
    };
    await db.put('patients', defaultPatient);

    // Seed standard medications
    const med1: Medicine = {
      id: 'med_lisinopril',
      patientId: defaultPatient.id,
      name: 'Red Tablet (Lisinopril)',
      dosage: '10mg (Blood Pressure)',
      instructions: 'Take 1 tablet in the morning with a full glass of water.',
      scheduledTimes: ['08:00'],
      startDate: '2026-01-01',
      pillColor: 'Red',
      isActive: true,
      remind30MinBefore: true,
      remind5MinBefore: true,
      alertAfter5MinMissed: true,
      totalStock: 20, // 20 tablets present (user's example)
      lowStockThreshold: 5,
      unitType: 'tablets'
    };

    const med2: Medicine = {
      id: 'med_metformin',
      patientId: defaultPatient.id,
      name: 'Metformin',
      dosage: '500mg (Blood Sugar)',
      instructions: 'Take with midday lunch to prevent stomach upset.',
      scheduledTimes: ['13:00'],
      startDate: '2026-01-01',
      pillColor: 'White',
      isActive: true,
      remind30MinBefore: true,
      remind5MinBefore: true,
      alertAfter5MinMissed: true,
      totalStock: 30,
      lowStockThreshold: 5,
      unitType: 'tablets'
    };

    const med3: Medicine = {
      id: 'med_calcium',
      patientId: defaultPatient.id,
      name: 'Calcium + Vitamin D3',
      dosage: '600mg (Bone Health)',
      instructions: 'Take with evening meal.',
      scheduledTimes: ['20:00'],
      startDate: '2026-01-01',
      pillColor: 'Yellow',
      isActive: true,
      remind30MinBefore: true,
      remind5MinBefore: true,
      alertAfter5MinMissed: true,
      totalStock: 15,
      lowStockThreshold: 5,
      unitType: 'tablets'
    };

    await db.put('medicines', med1);
    await db.put('medicines', med2);
    await db.put('medicines', med3);

    // Seed paired guardian
    const sampleGuardian: GuardianProfile = {
      id: 'g_elena',
      name: 'Elena Silva (Daughter)',
      phone: '+1 (555) 234-5678',
      relationship: 'Daughter & Primary Caregiver',
      pairingPublicKey: 'BNk0fS1rT3bZ7m9oX4vL8wP2qA6cE1yH5jK9uI3tO7rY',
      sharedSecret: 'DERIVED_AES256_384912',
      connectionType: 'BLUETOOTH',
      pairingStatus: 'PAIRED',
      pairedAt: Date.now() - 7 * 24 * 60 * 60 * 1000
    };
    await db.put('guardians', sampleGuardian);

    // Seed doses for today
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const morningDoseTime = new Date().setHours(8, 0, 0, 0);
    const noonDoseTime = new Date().setHours(13, 0, 0, 0);
    const nightDoseTime = new Date().setHours(20, 0, 0, 0);

    // Morning dose already taken
    await db.put('doses', {
      id: `dose_${med1.id}_${todayStr}_08:00`,
      medicineId: med1.id,
      patientId: defaultPatient.id,
      scheduledTime: morningDoseTime,
      status: 'CONFIRMED_YES',
      confirmedAt: morningDoseTime + 5 * 60 * 1000,
      alertStatus: 'LOCAL_ONLY',
      deliveryAttemptCount: 0
    });

    // Midday dose pending
    await db.put('doses', {
      id: `dose_${med2.id}_${todayStr}_13:00`,
      medicineId: med2.id,
      patientId: defaultPatient.id,
      scheduledTime: noonDoseTime,
      status: 'PENDING',
      alertStatus: 'NOT_APPLICABLE',
      deliveryAttemptCount: 0
    });

    // Night dose pending
    await db.put('doses', {
      id: `dose_${med3.id}_${todayStr}_20:00`,
      medicineId: med3.id,
      patientId: defaultPatient.id,
      scheduledTime: nightDoseTime,
      status: 'PENDING',
      alertStatus: 'NOT_APPLICABLE',
      deliveryAttemptCount: 0
    });

    setPatients([defaultPatient]);
    setActivePatient(defaultPatient);
    sound.playSuccessChime();
    SpeechEngine.speak('Sample demo patient profile loaded.', settings.ttsEnabled);
    await refreshAllData(defaultPatient.id);
  };

  // Save New Guardian
  const handleSaveGuardian = async (newGuardian: GuardianProfile) => {
    await db.put('guardians', newGuardian);
    setGuardians(prev => [...prev, newGuardian]);
    sound.playSuccessChime();
    SpeechEngine.speak(
      `Guardian ${newGuardian.name} linked.`,
      settings.ttsEnabled,
      I18nService.getLanguageInfo(settings.language).speechLangCode
    );
    await refreshAllData();
  };

  // Initial load
  useEffect(() => {
    bootstrapData();
  }, [bootstrapData]);

  // Listen to alertManager background broadcasts
  useEffect(() => {
    const unsubscribe = alertManager.subscribe(() => {
      refreshAllData();
    });
    return () => unsubscribe();
  }, [refreshAllData]);

  // Scheduler Evaluation Loop: runs every 10 seconds to check due reminders
  useEffect(() => {
    const runScheduler = async () => {
      if (!activePatient) return;
      const now = Date.now();
      const todayStr = new Date().toISOString().split('T')[0];

      const patientMeds = await db.getAll<Medicine>('medicines');
      const activeMeds = patientMeds.filter(m => m.patientId === activePatient.id && m.isActive);

      for (const med of activeMeds) {
        for (const timeStr of med.scheduledTimes) {
          const [hr, min] = timeStr.split(':').map(Number);
          const scheduledTime = new Date().setHours(hr, min, 0, 0);
          const doseId = `dose_${med.id}_${todayStr}_${timeStr}`;

          let dose = await db.get<DoseEvent>('doses', doseId);
          if (!dose) {
            dose = {
              id: doseId,
              medicineId: med.id,
              patientId: activePatient.id,
              scheduledTime,
              status: 'PENDING',
              alertStatus: 'NOT_APPLICABLE',
              deliveryAttemptCount: 0
            };
            await db.put('doses', dose);
          }

          const diffMs = now - scheduledTime;

          // Due Prompt Window
          if (diffMs >= 0 && diffMs <= 5 * 60 * 1000 && dose.status === 'PENDING') {
            if (!activePromptDose || activePromptDose.dose.id !== dose.id) {
              setActivePromptDose({ dose, med });
            }
          }

          // Automatic Missed-Dose Threshold (+5 minutes without reply)
          if (diffMs > 5 * 60 * 1000 && dose.status === 'PENDING' && med.alertAfter5MinMissed) {
            dose.status = 'MISSED';
            dose.alertStatus = 'QUEUED';
            dose.deliveryAttemptCount = 1;
            dose.lastAttemptLog = '5-minute no-response threshold elapsed. Alert queued.';
            await db.put('doses', dose);

            await alertManager.dispatchAlert(
              activePatient.id,
              activePatient.name,
              'MISSED_DOSE',
              med.name,
              med.dosage,
              dose.id
            );
            await refreshAllData();
          }
        }
      }
    };

    const interval = setInterval(runScheduler, 10000);
    return () => clearInterval(interval);
  }, [activePatient, activePromptDose, refreshAllData]);

  // Handle Patient Confirming or Declining Dose
  const handleConfirmDose = async (dose: DoseEvent, med: Medicine, confirmed: boolean) => {
    if (!activePatient) return;

    dose.confirmedAt = Date.now();
    if (confirmed) {
      dose.status = 'CONFIRMED_YES';
      dose.alertStatus = 'LOCAL_ONLY';
      await EscalationWatchdog.recordQualifyingCheckIn(activePatient.id);

      // Deduct 1 tablet from medicine stock inventory
      const currentStock = med.totalStock !== undefined ? med.totalStock : 20;
      const newStock = Math.max(0, currentStock - 1);
      med.totalStock = newStock;
      await db.put('medicines', { ...med, totalStock: newStock });
    } else {
      dose.status = 'CONFIRMED_NO';
      dose.alertStatus = 'QUEUED';
      await alertManager.dispatchAlert(
        activePatient.id,
        activePatient.name,
        'DOSE_DECLINED',
        med.name,
        med.dosage,
        dose.id
      );
    }

    await db.put('doses', dose);
    await refreshAllData();
  };

  // Refill / Adjust Medicine Inventory Tablets
  const handleRefillMedicine = async (medId: string, addedCount: number) => {
    const med = await db.get<Medicine>('medicines', medId);
    if (!med) return;
    const currentStock = med.totalStock ?? 0;
    const newStock = Math.max(0, currentStock + addedCount);
    const updatedMed = { ...med, totalStock: newStock };
    await db.put('medicines', updatedMed);
    sound.playSuccessChime();
    const spoken = settings.language === 'hi'
      ? `${med.name} में ${addedCount} गोलियां जोड़ी गईं। अब कुल ${newStock} गोलियां मौजूद हैं।`
      : `Added ${addedCount} tablets to ${med.name}. Total is now ${newStock} tablets available.`;
    SpeechEngine.speak(
      spoken,
      settings.ttsEnabled,
      I18nService.getLanguageInfo(settings.language).speechLangCode
    );
    await refreshAllData();
  };

  // Add / Save Medicine
  const handleSaveMedicine = async (medData: Partial<Medicine>) => {
    if (!activePatient) return;

    const newMed: Medicine = {
      id: 'med_' + Date.now(),
      patientId: activePatient.id,
      name: medData.name || 'Medication',
      dosage: medData.dosage || '1 Tablet',
      instructions: medData.instructions || '',
      scheduledTimes: medData.scheduledTimes || ['08:00'],
      startDate: medData.startDate || new Date().toISOString().split('T')[0],
      photoBlobUri: medData.photoBlobUri,
      pillColor: medData.pillColor || 'Red',
      isActive: true,
      remind30MinBefore: medData.remind30MinBefore ?? true,
      remind5MinBefore: medData.remind5MinBefore ?? true,
      alertAfter5MinMissed: medData.alertAfter5MinMissed ?? true,
      totalStock: medData.totalStock !== undefined ? medData.totalStock : 20,
      lowStockThreshold: medData.lowStockThreshold ?? 5,
      unitType: medData.unitType || 'tablets'
    };

    await db.put('medicines', newMed);

    // Create today's dose events for this medicine
    const todayStr = new Date().toISOString().split('T')[0];
    for (const timeStr of newMed.scheduledTimes) {
      const [hr, min] = timeStr.split(':').map(Number);
      const scheduledTime = new Date().setHours(hr, min, 0, 0);
      const doseId = `dose_${newMed.id}_${todayStr}_${timeStr}`;

      const dose: DoseEvent = {
        id: doseId,
        medicineId: newMed.id,
        patientId: activePatient.id,
        scheduledTime,
        status: 'PENDING',
        alertStatus: 'NOT_APPLICABLE',
        deliveryAttemptCount: 0
      };
      await db.put('doses', dose);
    }

    sound.playSuccessChime();
    SpeechEngine.speak(
      `Medication ${newMed.name} saved.`,
      settings.ttsEnabled,
      I18nService.getLanguageInfo(settings.language).speechLangCode
    );
    await refreshAllData();
  };

  // Save New Patient
  const handleSavePatient = async (newPatient: PatientProfile) => {
    await db.put('patients', newPatient);
    setPatients(prev => [...prev, newPatient]);
    setActivePatient(newPatient);
    const lang = (newPatient.preferredLanguage as SupportedLanguage) || settings.language;
    if (newPatient.preferredLanguage) {
      AccessibilityService.updateSettings({ language: lang });
    }
    sound.playSuccessChime();
    SpeechEngine.speak(
      `Patient ${newPatient.name} profile saved.`,
      settings.ttsEnabled,
      I18nService.getLanguageInfo(lang).speechLangCode
    );
    await refreshAllData(newPatient.id);
  };

  // Switch Active Patient
  const handleSelectPatient = async (p: PatientProfile) => {
    setActivePatient(p);
    if (p.preferredLanguage) {
      AccessibilityService.updateSettings({ language: p.preferredLanguage as SupportedLanguage });
    }
    await refreshAllData(p.id);
  };

  // Delete Medicine
  const handleDeleteMedicine = async (id: string) => {
    await db.delete('medicines', id);
    await refreshAllData();
  };

  // Delete Patient
  const handleDeletePatient = async (id: string) => {
    const patientToDelete = patients.find(p => p.id === id);
    const name = patientToDelete ? patientToDelete.name : 'Patient';
    await db.delete('patients', id);

    // Clean up doses for this patient
    const allDoses = await db.getAll<DoseEvent>('doses');
    for (const d of allDoses) {
      if (d.patientId === id) {
        await db.delete('doses', d.id);
      }
    }

    // Clean up medicines for this patient
    const allMeds = await db.getAll<Medicine>('medicines');
    for (const m of allMeds) {
      if (m.patientId === id) {
        await db.delete('medicines', m.id);
      }
    }

    sound.playAlertChime();
    SpeechEngine.speak(`Patient ${name} profile and regimens removed.`, settings.ttsEnabled);

    const remaining = patients.filter(p => p.id !== id);
    setPatients(remaining);
    const nextPatient = remaining.length > 0 ? remaining[0] : null;
    setActivePatient(nextPatient);
    await refreshAllData(nextPatient?.id);
  };

  // Delete Guardian
  const handleDeleteGuardian = async (id: string) => {
    const guardianToDelete = guardians.find(g => g.id === id);
    const name = guardianToDelete ? guardianToDelete.name : 'Guardian';
    await db.delete('guardians', id);
    sound.playAlertChime();
    SpeechEngine.speak(`Guardian ${name} removed.`, settings.ttsEnabled);
    await refreshAllData();
  };

  // Unacknowledged alerts count
  const unacknowledgedAlertsCount = alertLogs.filter(
    a => a.status === 'QUEUED' || a.status === 'SENDING' || a.status === 'DELIVERED'
  ).length;

  const isExtraLarge = settings.fontSize === 'EXTRA_LARGE';
  const isLarge = settings.fontSize === 'LARGE' || isExtraLarge;

  return (
    <div
      className={`min-h-screen transition-colors ${
        settings.highContrast ? 'bg-neutral-950 text-yellow-300' : 'bg-slate-50 text-slate-900'
      } ${isExtraLarge ? 'text-lg' : isLarge ? 'text-base' : 'text-sm'} font-sans pb-32 selection:bg-teal-500 selection:text-white`}
    >
      {/* Top Header */}
      <Header
        settings={settings}
        appMode={appMode}
        setAppMode={setAppMode}
        activePatient={activePatient}
        patients={patients}
        onSelectPatient={handleSelectPatient}
        onOpenAddPatient={() => setIsPatientModalOpen(true)}
        onOpenAuditGuide={() => setIsAuditModalOpen(true)}
        onOpenAccessibilitySettings={() => setIsAccessibilityModalOpen(true)}
        onToggleTts={() => AccessibilityService.updateSettings({ ttsEnabled: !settings.ttsEnabled })}
        onToggleHighContrast={() =>
          AccessibilityService.updateSettings({ highContrast: !settings.highContrast })
        }
        onOpenHelp={() => setActiveTab('HELP')}
      />

      {/* Main Content Area */}
      <main className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Active Alert Urgent Banner */}
        {unacknowledgedAlertsCount > 0 && activeTab !== 'GUARDIANS' && (
          <div
            onClick={() => setActiveTab('GUARDIANS')}
            role="button"
            tabIndex={0}
            className="p-3.5 rounded-2xl bg-rose-600 text-white flex items-center justify-between cursor-pointer shadow-md hover:bg-rose-700 transition-all animate-pulse"
          >
            <div className="flex items-center gap-2.5">
              <BellRing className="w-5 h-5 shrink-0" />
              <div>
                <span className="font-black text-xs uppercase tracking-wider block">
                  {unacknowledgedAlertsCount} {t('unresolvedAlerts')}
                </span>
                <span className="text-[11px] opacity-90">
                  Tap to open Guardian Action Center and confirm doses.
                </span>
              </div>
            </div>
            <span className="text-xs font-bold underline shrink-0">&rarr;</span>
          </div>
        )}

        {/* 48-Hour Silence Escalation Watchdog Widget */}
        <SilenceBanner
          patient={activePatient}
          settings={settings}
          onCheckInConfirmed={refreshAllData}
        />

        {/* TAB 1: SCHEDULE VIEW */}
        {activeTab === 'SCHEDULE' && (
          <ScheduleTab
            doseEvents={doseEvents}
            medicines={medicines}
            patient={activePatient}
            guardians={guardians}
            settings={settings}
            onConfirmDose={handleConfirmDose}
            onOpenAddMedModal={() => setIsAddChoiceModalOpen(true)}
            onOpenAddPatientModal={() => setIsPatientModalOpen(true)}
            onOpenAddGuardianModal={() => setIsGuardianModalOpen(true)}
            onLoadDemoData={handleLoadDemoData}
            onDeletePatient={handleDeletePatient}
            onDeleteGuardian={handleDeleteGuardian}
          />
        )}

        {/* TAB 2: MEDICINES CABINET */}
        {activeTab === 'MEDS' && (
          <MedicinesTab
            medicines={medicines}
            highContrast={settings.highContrast}
            largeText={isLarge}
            onOpenAddModal={() => setIsAddChoiceModalOpen(true)}
            onDeleteMedicine={handleDeleteMedicine}
            onRefillMedicine={handleRefillMedicine}
            onTriggerTestPrompt={med => {
              const testDose: DoseEvent = {
                id: 'dose_test_' + Date.now(),
                medicineId: med.id,
                patientId: activePatient?.id || 'demo',
                scheduledTime: Date.now(),
                status: 'PENDING',
                alertStatus: 'NOT_APPLICABLE',
                deliveryAttemptCount: 0
              };
              setActivePromptDose({ dose: testDose, med });
            }}
          />
        )}

        {/* TAB 3: GUARDIAN HUB & RAPID ACTION CENTER */}
        {activeTab === 'GUARDIANS' && (
          <GuardianHub
            guardians={guardians}
            patients={patients}
            activePatient={activePatient}
            alertLogs={alertLogs}
            doseEvents={doseEvents}
            medicines={medicines}
            highContrast={settings.highContrast}
            largeText={isLarge}
            ttsEnabled={settings.ttsEnabled}
            onRefresh={refreshAllData}
            onDeleteGuardian={handleDeleteGuardian}
          />
        )}

        {/* TAB 4: AUDIT HISTORY */}
        {activeTab === 'HISTORY' && (
          <HistoryTab
            alertLogs={alertLogs}
            doseEvents={doseEvents}
            highContrast={settings.highContrast}
            largeText={isLarge}
          />
        )}

        {/* TAB 5: SIMULATION & EDGE TESTING */}
        {activeTab === 'SIMULATION' && (
          <SimulationHarness
            activePatient={activePatient}
            medicines={medicines}
            highContrast={settings.highContrast}
            largeText={isLarge}
            ttsEnabled={settings.ttsEnabled}
            onRefresh={refreshAllData}
            onTriggerPrompt={(dose, med) => setActivePromptDose({ dose, med })}
          />
        )}

        {/* TAB 6: HELP & USER PROBLEMS / SUGGESTIONS */}
        {activeTab === 'HELP' && (
          <HelpTab
            activePatient={activePatient}
            highContrast={settings.highContrast}
            largeText={isLarge}
            ttsEnabled={settings.ttsEnabled}
          />
        )}
      </main>

      {/* Floating Center Action Button - Opens 2-Choice Action Menu (1. Add Patient, 2. Add Medication) */}
      {!settings.simplifiedMode && (
        <div className="fixed bottom-16 inset-x-0 flex justify-center pointer-events-none z-20">
          <button
            type="button"
            onClick={() => setIsAddChoiceModalOpen(true)}
            aria-label={t('whatWouldYouLikeToAdd')}
            title={t('whatWouldYouLikeToAdd')}
            style={{
              width: settings.largeButtonMode ? '68px' : '56px',
              height: settings.largeButtonMode ? '68px' : '56px'
            }}
            className={`pointer-events-auto rounded-full flex items-center justify-center text-3xl font-light shadow-xl transition-transform active:scale-90 ${
              settings.highContrast
                ? 'bg-yellow-300 text-black border-4 border-neutral-900 hover:bg-yellow-200'
                : 'bg-teal-700 hover:bg-teal-800 text-white border-4 border-white'
            }`}
          >
            <Plus className="w-7 h-7" />
          </button>
        </div>
      )}

      {/* PERSISTENT DRAGGABLE FLOATING ACCESSIBILITY BUTTON */}
      <FloatingAccessibilityButton
        settings={settings}
        onOpenPanel={() => setIsAccessibilityModalOpen(true)}
        isUrgentModalOpen={!!activePromptDose}
      />

      {/* Mobile-First Bottom Navigation Bar */}
      <footer
        className={`fixed bottom-0 inset-x-0 z-10 border-t transition-colors ${
          settings.highContrast
            ? 'bg-neutral-950 border-neutral-800 text-yellow-300'
            : 'bg-white border-slate-200 text-slate-600 shadow-lg'
        }`}
      >
        <nav
          aria-label="Bottom Navigation"
          className="max-w-2xl mx-auto grid grid-cols-6 text-center text-[10px] font-bold py-1.5"
        >
          {/* Tab 1: Schedule */}
          <button
            type="button"
            onClick={() => setActiveTab('SCHEDULE')}
            className={`py-1 flex flex-col items-center justify-center gap-0.5 min-h-[44px] ${
              activeTab === 'SCHEDULE'
                ? settings.highContrast
                  ? 'text-yellow-300'
                  : 'text-teal-700'
                : 'opacity-70 hover:opacity-100'
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            <span>{t('schedule')}</span>
          </button>

          {/* Tab 2: Meds */}
          <button
            type="button"
            onClick={() => setActiveTab('MEDS')}
            className={`py-1 flex flex-col items-center justify-center gap-0.5 min-h-[44px] ${
              activeTab === 'MEDS'
                ? settings.highContrast
                  ? 'text-yellow-300'
                  : 'text-teal-700'
                : 'opacity-70 hover:opacity-100'
            }`}
          >
            <Pill className="w-4 h-4" />
            <span>{t('medicines')}</span>
          </button>

          {/* Tab 3: Guardians */}
          <button
            type="button"
            onClick={() => setActiveTab('GUARDIANS')}
            className={`relative py-1 flex flex-col items-center justify-center gap-0.5 min-h-[44px] ${
              activeTab === 'GUARDIANS'
                ? settings.highContrast
                  ? 'text-yellow-300'
                  : 'text-teal-700'
                : 'opacity-70 hover:opacity-100'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{t('guardians')}</span>
            {unacknowledgedAlertsCount > 0 && (
              <span className="absolute top-1 right-2 w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] flex items-center justify-center font-bold">
                {unacknowledgedAlertsCount}
              </span>
            )}
          </button>

          {/* Tab 4: History */}
          <button
            type="button"
            onClick={() => setActiveTab('HISTORY')}
            className={`py-1 flex flex-col items-center justify-center gap-0.5 min-h-[44px] ${
              activeTab === 'HISTORY'
                ? settings.highContrast
                  ? 'text-yellow-300'
                  : 'text-teal-700'
                : 'opacity-70 hover:opacity-100'
            }`}
          >
            <History className="w-4 h-4" />
            <span>{t('history')}</span>
          </button>

          {/* Tab 5: Simulation / Test */}
          <button
            type="button"
            onClick={() => setActiveTab('SIMULATION')}
            className={`py-1 flex flex-col items-center justify-center gap-0.5 min-h-[44px] ${
              activeTab === 'SIMULATION'
                ? settings.highContrast
                  ? 'text-yellow-300'
                  : 'text-teal-700'
                : 'opacity-70 hover:opacity-100'
            }`}
          >
            <FlaskConical className="w-4 h-4" />
            <span>{t('testing')}</span>
          </button>

          {/* Tab 6: Help & Suggestions */}
          <button
            type="button"
            onClick={() => setActiveTab('HELP')}
            className={`py-1 flex flex-col items-center justify-center gap-0.5 min-h-[44px] ${
              activeTab === 'HELP'
                ? settings.highContrast
                  ? 'text-yellow-300'
                  : 'text-teal-700'
                : 'opacity-70 hover:opacity-100'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>{t('helpTab')}</span>
          </button>
        </nav>
      </footer>

      {/* Due Dose Active Modal Popup (when scheduled dose is due) */}
      {activePromptDose && (
        <DueDoseModal
          dose={activePromptDose.dose}
          med={activePromptDose.med}
          settings={settings}
          onConfirm={confirmed =>
            handleConfirmDose(activePromptDose.dose, activePromptDose.med, confirmed)
          }
          onDismiss={() => setActivePromptDose(null)}
        />
      )}

      {/* Schedule Medication Modal */}
      {isMedModalOpen && (
        <MedicineModal
          isOpen={isMedModalOpen}
          onClose={() => setIsMedModalOpen(false)}
          onSave={handleSaveMedicine}
          patientId={activePatient?.id || 'patient_maria'}
          highContrast={settings.highContrast}
          largeText={isLarge}
        />
      )}

      {/* Accessibility Settings Panel Modal */}
      {isAccessibilityModalOpen && (
        <AccessibilitySettingsModal
          isOpen={isAccessibilityModalOpen}
          onClose={() => setIsAccessibilityModalOpen(false)}
          settings={settings}
          onUpdateSettings={partial => AccessibilityService.updateSettings(partial)}
          onReopenOnboarding={() => {
            setIsAccessibilityModalOpen(false);
            setIsOnboardingModalOpen(true);
          }}
        />
      )}

      {/* Accessibility Onboarding / Setup Wizard Modal */}
      {isOnboardingModalOpen && (
        <AccessibilityOnboardingModal
          isOpen={isOnboardingModalOpen}
          onClose={() => setIsOnboardingModalOpen(false)}
          currentSettings={settings}
          onSaveSettings={partial => AccessibilityService.updateSettings(partial)}
        />
      )}

      {/* Zero Cost Specs & Android Guide Modal */}
      {isAuditModalOpen && (
        <AuditGuideModal
          isOpen={isAuditModalOpen}
          onClose={() => setIsAuditModalOpen(false)}
          highContrast={settings.highContrast}
        />
      )}

      {/* 3-Option Add Choice Modal (1. Add New Patient, 2. Add Designated Guardian, 3. New Medication) */}
      {isAddChoiceModalOpen && (
        <AddChoiceModal
          isOpen={isAddChoiceModalOpen}
          onClose={() => setIsAddChoiceModalOpen(false)}
          onSelectAddPatient={() => setIsPatientModalOpen(true)}
          onSelectAddGuardian={() => setIsGuardianModalOpen(true)}
          onSelectAddMedication={() => setIsMedModalOpen(true)}
          settings={settings}
        />
      )}

      {/* Add New Patient Profile Modal */}
      {isPatientModalOpen && (
        <PatientModal
          isOpen={isPatientModalOpen}
          onClose={() => setIsPatientModalOpen(false)}
          onSavePatient={handleSavePatient}
          settings={settings}
        />
      )}

      {/* Add / Link Guardian Modal */}
      {isGuardianModalOpen && (
        <GuardianModal
          isOpen={isGuardianModalOpen}
          onClose={() => setIsGuardianModalOpen(false)}
          onSaveGuardian={handleSaveGuardian}
          settings={settings}
          patientPublicKey={localStorage.getItem('CAREDOS_ECDH_PUBKEY') || undefined}
        />
      )}
    </div>
  );
}
