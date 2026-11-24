// src/components/ScheduleTab.tsx
import React, { useState, useEffect } from 'react';
import { DoseEvent, Medicine, PatientProfile, GuardianProfile } from '../services/db';
import { sound, SpeechEngine } from '../services/audio';
import { AccessibilitySettings } from '../services/accessibility';
import { I18nService, t } from '../services/i18n';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Volume2,
  AlertTriangle,
  Pill,
  Plus,
  ShieldCheck,
  Check,
  AlertCircle,
  Mic,
  Sparkles,
  UserPlus,
  User,
  Phone,
  HeartPulse,
  QrCode,
  Trash2
} from 'lucide-react';
import { VoiceCommandService, VoiceListenerStatus } from '../services/voiceListener';

interface ScheduleTabProps {
  doseEvents: DoseEvent[];
  medicines: Medicine[];
  patient: PatientProfile | null;
  guardians?: GuardianProfile[];
  settings: AccessibilitySettings;
  onConfirmDose: (dose: DoseEvent, med: Medicine, confirmed: boolean) => void;
  onOpenAddMedModal: () => void;
  onOpenAddPatientModal?: () => void;
  onOpenAddGuardianModal?: () => void;
  onLoadDemoData?: () => void;
  onDeletePatient?: (id: string) => Promise<void>;
  onDeleteGuardian?: (id: string) => Promise<void>;
}

export const ScheduleTab: React.FC<ScheduleTabProps> = ({
  doseEvents,
  medicines,
  patient,
  guardians = [],
  settings,
  onConfirmDose,
  onOpenAddMedModal,
  onOpenAddPatientModal,
  onOpenAddGuardianModal,
  onLoadDemoData,
  onDeletePatient,
  onDeleteGuardian,
}) => {
  const [pendingTremorId, setPendingTremorId] = useState<string | null>(null);
  const [lastConfirmationReceipt, setLastConfirmationReceipt] = useState<{
    type: 'YES' | 'NO';
    medName: string;
    time: string;
    details: string;
  } | null>(null);

  // Hands-free Voice Command Listener state
  const [voiceStatus, setVoiceStatus] = useState<VoiceListenerStatus>('idle');
  const [voiceTranscript, setVoiceTranscript] = useState<string>('');

  const sortedDoses = [...doseEvents].sort((a, b) => a.scheduledTime - b.scheduledTime);
  const takenCount = sortedDoses.filter(d => d.status === 'CONFIRMED_YES').length;
  const missedCount = sortedDoses.filter(d => d.status === 'MISSED' || d.status === 'CONFIRMED_NO').length;
  const pendingCount = sortedDoses.filter(d => d.status === 'PENDING').length;
  const totalTodayDoses = sortedDoses.length;
  const progressPercent = totalTodayDoses > 0 ? Math.round((takenCount / totalTodayDoses) * 100) : 0;

  const isExtraLarge = settings.fontSize === 'EXTRA_LARGE';
  const isLarge = settings.fontSize === 'LARGE' || isExtraLarge;

  const handleCardYes = (dose: DoseEvent, med: Medicine, isVoiceTrigger: boolean = false) => {
    const key = `${dose.id}_YES`;
    if (!isVoiceTrigger && settings.confirmationSafeguard && pendingTremorId !== key) {
      setPendingTremorId(key);
      sound.vibrate([100]);
      SpeechEngine.speak(t('tapAgainToConfirm'), settings.ttsEnabled, undefined, 0.82);
      return;
    }
    setPendingTremorId(null);

    const currentStock = med.totalStock !== undefined ? med.totalStock : 20;
    const newStock = Math.max(0, currentStock - 1);

    sound.playSuccessChime();
    const langInfo = I18nService.getLanguageInfo(settings.language);
    let spoken = '';
    const voicePrefix = isVoiceTrigger
      ? (settings.language === 'hi' ? 'वॉयस कमांड स्वीकृत! ' : 'Voice command confirmed! ')
      : '';

    if (settings.language === 'hi') {
      spoken = `${voicePrefix}पुष्टि हुई! आपकी ${med.name} दवाई सुरक्षित दर्ज कर ली गई है। अब आपके पास ${newStock} गोलियां शेष हैं।`;
      if (newStock <= (med.lowStockThreshold || 5)) {
        spoken += ` ध्यान दें: केवल ${newStock} गोलियां बाकी हैं।`;
      }
    } else {
      spoken = `${voicePrefix}Confirmed! Your dose of ${med.name} has been safely recorded as taken. You now have ${newStock} tablets remaining.`;
      if (newStock <= (med.lowStockThreshold || 5)) {
        spoken += ` Notice: Low stock alert. Only ${newStock} tablets left.`;
      }
    }
    SpeechEngine.speak(spoken, settings.ttsEnabled, langInfo.speechLangCode, 0.80);

    setLastConfirmationReceipt({
      type: 'YES',
      medName: med.name,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      details: `${t('doseConfirmedSub')} · ${newStock} tablets remaining${isVoiceTrigger ? ' · Confirmed hands-free via voice' : ''}`
    });

    onConfirmDose(dose, med, true);
  };

  // Hands-free Voice Listener: allows saying "CareDose, I took my medicine" to confirm next pending dose
  useEffect(() => {
    if (pendingCount === 0 || settings.voiceCommandsEnabled === false) {
      return;
    }

    const cleanup = VoiceCommandService.startListening({
      language: settings.language,
      continuous: true,
      autoRestart: true,
      onStatusChange: (status) => setVoiceStatus(status),
      onTranscript: (txt) => setVoiceTranscript(txt),
      onMatch: () => {
        const nextPending = sortedDoses.find(d => d.status === 'PENDING');
        if (nextPending) {
          const med = medicines.find(m => m.id === nextPending.medicineId);
          if (med) {
            handleCardYes(nextPending, med, true);
          }
        }
      }
    });

    return () => {
      cleanup();
    };
  }, [pendingCount, settings.voiceCommandsEnabled, settings.language, sortedDoses, medicines]);

  const handleCardNo = (dose: DoseEvent, med: Medicine) => {
    const key = `${dose.id}_NO`;
    if (settings.confirmationSafeguard && pendingTremorId !== key) {
      setPendingTremorId(key);
      sound.vibrate([100]);
      SpeechEngine.speak(t('tapAgainToConfirm'), settings.ttsEnabled, undefined, 0.82);
      return;
    }
    setPendingTremorId(null);

    const currentStock = med.totalStock !== undefined ? med.totalStock : 20;
    sound.playAlertChime();
    const langInfo = I18nService.getLanguageInfo(settings.language);
    const spoken = settings.language === 'hi'
      ? `दवाई नहीं ली गई दर्ज किया गया। आपके पास अभी भी ${currentStock} गोलियां मौजूद हैं। आपके अभिभावक को सूचित कर दिया गया है।`
      : `Recorded as not taken. You still have ${currentStock} tablets available. Designated guardian has been notified.`;
    SpeechEngine.speak(spoken, settings.ttsEnabled, langInfo.speechLangCode, 0.80);

    setLastConfirmationReceipt({
      type: 'NO',
      medName: med.name,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      details: `${t('doseDeclinedSub')} · ${currentStock} tablets available (unchanged)`
    });

    onConfirmDose(dose, med, false);
  };

  return (
    <div className="space-y-4">
      {/* SECTION 0: PATIENT & GUARDIAN PROFILE CARD */}
      {!patient ? (
        /* EMPTY STATE: Every new user starts here with empty patient & guardian info */
        <div
          className={`p-5 rounded-3xl border-2 transition-all ${
            settings.highContrast
              ? 'bg-neutral-950 border-yellow-300 text-yellow-300'
              : 'bg-gradient-to-br from-white via-teal-50/50 to-slate-50 border-teal-200 text-slate-800 shadow-sm'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3.5">
              <div
                className={`p-3 rounded-2xl shrink-0 ${
                  settings.highContrast ? 'bg-yellow-300 text-black' : 'bg-teal-700 text-white shadow-sm'
                }`}
              >
                <UserPlus className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className={`font-black tracking-tight ${isExtraLarge ? 'text-2xl' : isLarge ? 'text-xl' : 'text-base'}`}>
                    {t('patientAndGuardianProfile')}
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 dark:bg-yellow-300 dark:text-black">
                    Empty · Setup Required
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-yellow-200 mt-1 max-w-md leading-relaxed">
                  {t('patientInfoEmptyDesc')}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons to Add Patient & Guardian */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-4 pt-3 border-t border-slate-200 dark:border-neutral-800">
            <button
              type="button"
              onClick={onOpenAddPatientModal}
              className={`p-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-xs transition-transform active:scale-95 min-h-[44px] ${
                settings.highContrast
                  ? 'bg-yellow-300 text-black hover:bg-yellow-200'
                  : 'bg-teal-700 text-white hover:bg-teal-800'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>+ {t('addPatientInfo')}</span>
            </button>

            <button
              type="button"
              onClick={onOpenAddGuardianModal}
              className={`p-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 border transition-transform active:scale-95 min-h-[44px] ${
                settings.highContrast
                  ? 'bg-neutral-900 border-yellow-300 text-yellow-300 hover:bg-neutral-800'
                  : 'bg-white hover:bg-teal-50 text-teal-800 border-teal-300 shadow-xs'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-teal-600 dark:text-yellow-300" />
              <span>+ {t('addGuardianInfo')}</span>
            </button>
          </div>

          {onLoadDemoData && (
            <div className="text-center mt-3 pt-2 border-t border-dashed border-slate-200 dark:border-neutral-800">
              <button
                type="button"
                onClick={onLoadDemoData}
                className="text-[11px] text-teal-700 dark:text-yellow-300 hover:underline font-bold inline-flex items-center gap-1.5 py-1 px-2 rounded-lg hover:bg-teal-50/50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{t('loadDemoProfile')}</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        /* CONFIGURED STATE: Displays Patient & Guardian details on Home Tab */
        <div
          className={`p-4 rounded-2xl border transition-colors ${
            settings.highContrast
              ? 'bg-neutral-900 border-yellow-300 text-yellow-300'
              : 'bg-white border-slate-200 text-slate-800 shadow-xs'
          }`}
        >
          <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-neutral-800">
            <div className="flex items-center gap-3">
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-lg shrink-0 ${
                  settings.highContrast
                    ? 'bg-yellow-300 text-black'
                    : 'bg-teal-700 text-white shadow-xs'
                }`}
              >
                {patient.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className={`font-black ${isExtraLarge ? 'text-2xl' : isLarge ? 'text-xl' : 'text-base'}`}>
                    {patient.name}
                  </h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-100 text-teal-800 dark:bg-neutral-800 dark:text-yellow-300 border border-teal-300 dark:border-yellow-300">
                    Patient Profile
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-yellow-200 mt-0.5 flex-wrap">
                  {patient.dob && (
                    <span>DOB: {patient.dob}</span>
                  )}
                  {patient.phone && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {patient.phone}
                      </span>
                    </>
                  )}
                  <span aria-hidden="true">·</span>
                  <span className="uppercase text-[10px] font-bold tracking-wider">
                    Lang: {patient.preferredLanguage || 'en'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={onOpenAddPatientModal}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                  settings.highContrast
                    ? 'border-yellow-300 text-yellow-300 hover:bg-neutral-800'
                    : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {t('editPatient')}
              </button>

              {onDeletePatient && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(t('confirmDeletePatient'))) {
                      onDeletePatient(patient.id);
                    }
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-neutral-800 transition-colors"
                  title={t('deletePatient')}
                  aria-label={t('deletePatient')}
                >
                  <Trash2 className="w-4 h-4 text-rose-500" />
                </button>
              )}
            </div>
          </div>

          {/* Linked Guardians Section */}
          <div className="mt-3 pt-1 text-xs">
            {guardians.length === 0 ? (
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 text-slate-500 dark:text-yellow-200 italic">
                  <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{t('noGuardianLinked')}</span>
                </div>
                <button
                  type="button"
                  onClick={onOpenAddGuardianModal}
                  className={`text-xs font-black underline shrink-0 ${
                    settings.highContrast ? 'text-yellow-300' : 'text-teal-700'
                  }`}
                >
                  + {t('addGuardianInfo')}
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-600 dark:text-yellow-200 text-[11px] uppercase tracking-wider">
                    Linked Guardians ({guardians.length}):
                  </span>
                  <button
                    type="button"
                    onClick={onOpenAddGuardianModal}
                    className={`text-[11px] font-black underline ${
                      settings.highContrast ? 'text-yellow-300' : 'text-teal-700'
                    }`}
                  >
                    + Pair Another
                  </button>
                </div>

                <div className="space-y-1.5">
                  {guardians.map(g => (
                    <div
                      key={g.id}
                      className="p-2 rounded-xl bg-slate-50 dark:bg-neutral-950 border border-slate-100 dark:border-neutral-800 flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <ShieldCheck className="w-3.5 h-3.5 text-teal-600 dark:text-yellow-300 shrink-0" />
                        <div className="truncate">
                          <span className="font-bold text-slate-800 dark:text-yellow-100">
                            {g.name}
                          </span>
                          <span className="text-slate-500 dark:text-yellow-200 text-[10px] ml-1">
                            ({g.relationship}) · {g.connectionType}
                          </span>
                        </div>
                      </div>

                      {onDeleteGuardian && (
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(t('confirmDeleteGuardian'))) {
                              onDeleteGuardian(g.id);
                            }
                          }}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
                          title={t('deleteGuardian')}
                          aria-label={`Delete guardian ${g.name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Regimen Summary Bar with Confirmation Progress Bar */}
      <div
        className={`p-4 sm:p-5 rounded-2xl border transition-colors ${
          settings.highContrast
            ? 'bg-neutral-900 border-yellow-300 text-yellow-300'
            : 'bg-white border-slate-200 text-slate-800 shadow-xs'
        }`}
      >
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className={`font-black ${isExtraLarge ? 'text-2xl' : isLarge ? 'text-xl' : 'text-base'}`}>
                {t('todaysRegimen')}
              </h2>
              {totalTodayDoses > 0 && (
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-black ${
                    progressPercent === 100
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : settings.highContrast
                      ? 'bg-neutral-800 text-yellow-300 border border-yellow-300'
                      : 'bg-teal-50 text-teal-800 border border-teal-200'
                  }`}
                >
                  {progressPercent}% {t('dosesConfirmedPercent')}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-yellow-200 mt-0.5">
              <span>{takenCount} {t('dosesTaken')}</span>
              <span aria-hidden="true">·</span>
              <span>{pendingCount} {t('dosesPending')}</span>
              {missedCount > 0 && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-rose-600 font-semibold">{missedCount} {t('dosesMissed')}</span>
                </>
              )}
            </div>
          </div>

          {!settings.simplifiedMode && (
            <button
              type="button"
              onClick={onOpenAddMedModal}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs active:scale-95 min-h-[44px] ${
                settings.highContrast
                  ? 'bg-yellow-300 text-black hover:bg-yellow-200'
                  : 'bg-teal-700 text-white hover:bg-teal-800'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>{t('addMedicine')}</span>
            </button>
          )}
        </div>

        {/* VISUAL CONFIRMATION PROGRESS BAR */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="flex items-center gap-1.5">
              <span>{t('dailyProgress')}</span>
              {progressPercent === 100 && totalTodayDoses > 0 && (
                <span className="text-emerald-600 dark:text-yellow-300 font-black">✓ Complete</span>
              )}
            </span>
            <span className="font-mono text-[11px] opacity-90">
              {takenCount} / {totalTodayDoses} doses ({progressPercent}%)
            </span>
          </div>

          {/* Progress Track */}
          <div
            role="progressbar"
            aria-valuenow={progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${progressPercent}% of today's medication doses confirmed`}
            className={`w-full h-3 rounded-full overflow-hidden border ${
              settings.highContrast
                ? 'bg-neutral-950 border-yellow-300'
                : 'bg-slate-100 border-slate-200 shadow-inner'
            }`}
          >
            <div
              className={`h-full transition-all duration-700 ease-out rounded-full ${
                settings.highContrast
                  ? 'bg-yellow-300'
                  : progressPercent === 100
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                  : 'bg-gradient-to-r from-teal-600 to-cyan-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
            />
          </div>

          {/* Progress Status Message */}
          <div className="text-[11px] flex items-center justify-between text-slate-500 dark:text-yellow-200">
            {totalTodayDoses === 0 ? (
              <span>No medications scheduled for today.</span>
            ) : progressPercent === 100 ? (
              <span className="text-emerald-700 dark:text-yellow-300 font-bold flex items-center gap-1">
                <Check className="w-3.5 h-3.5 inline" />
                {t('allDosesCompleted')}
              </span>
            ) : (
              <span>
                {pendingCount} dose{pendingCount === 1 ? '' : 's'} {t('dosesRemainingToday')}
              </span>
            )}
            {pendingCount > 0 && settings.voiceCommandsEnabled !== false && (
              <span className="hidden sm:inline font-medium italic opacity-80">
                Tip: Say "CareDose, I took my medicine" to confirm
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Hands-Free Voice Command Listener Banner (when pending doses exist) */}
      {pendingCount > 0 && settings.voiceCommandsEnabled !== false && (
        <div
          className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-2 shadow-xs ${
            settings.highContrast
              ? 'bg-neutral-900 border-2 border-yellow-300 text-yellow-300'
              : voiceStatus === 'hearing'
              ? 'bg-teal-50 border-2 border-teal-500 text-teal-950 ring-2 ring-teal-200'
              : 'bg-gradient-to-r from-teal-50/90 to-cyan-50/90 border border-teal-200 text-teal-950'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`p-2 rounded-xl flex items-center justify-center shrink-0 ${
                voiceStatus === 'hearing'
                  ? 'bg-teal-600 text-white animate-pulse'
                  : voiceStatus === 'listening'
                  ? 'bg-teal-700 text-white'
                  : 'bg-slate-200 text-slate-700 dark:bg-neutral-800 dark:text-yellow-300'
              }`}
            >
              <Mic className="w-4 h-4 shrink-0" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-black uppercase tracking-wider block">
                  {t('voiceCommandActive')}
                </span>
                {voiceStatus === 'listening' && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                    Listening
                  </span>
                )}
                {voiceStatus === 'hearing' && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-teal-200 text-teal-900">
                    Hearing...
                  </span>
                )}
              </div>
              <p className="text-xs font-medium mt-0.5 leading-snug">
                Say: <strong className="font-black text-teal-800 dark:text-yellow-200 underline decoration-teal-500 decoration-2">"CareDose, I took my medicine"</strong> to confirm hands-free.
              </p>
              {voiceTranscript && (
                <div className="mt-1 text-[11px] font-mono italic opacity-85 truncate max-w-[280px]">
                  Heard: "{voiceTranscript}"
                </div>
              )}
            </div>
          </div>

          {/* Test Voice Simulation Button */}
          <button
            type="button"
            onClick={() => {
              VoiceCommandService.simulatePhrase('CareDose, I took my medicine');
            }}
            title="Tap to test hands-free voice trigger"
            aria-label="Test voice trigger: CareDose, I took my medicine"
            className={`shrink-0 px-2.5 py-1.5 rounded-xl text-[11px] font-black border transition-transform active:scale-95 flex items-center gap-1 ${
              settings.highContrast
                ? 'bg-yellow-300 text-black border-white hover:bg-yellow-200'
                : 'bg-white hover:bg-teal-100 text-teal-800 border-teal-300 shadow-xs'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-teal-600 dark:text-yellow-950" />
            <span>Test Voice</span>
          </button>
        </div>
      )}

      {/* Immediate Taker Confirmation Receipt Banner */}
      {lastConfirmationReceipt && (
        <div
          role="status"
          aria-live="polite"
          className={`p-4 rounded-2xl border flex items-start justify-between gap-3 shadow-md animate-in slide-in-from-top-2 duration-300 ${
            lastConfirmationReceipt.type === 'YES'
              ? 'bg-emerald-50 border-2 border-emerald-400 text-emerald-950 dark:bg-neutral-900 dark:border-yellow-300 dark:text-yellow-300'
              : 'bg-rose-50 border-2 border-rose-400 text-rose-950 dark:bg-neutral-900 dark:border-red-400 dark:text-yellow-200'
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                lastConfirmationReceipt.type === 'YES'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-rose-600 text-white'
              }`}
            >
              {lastConfirmationReceipt.type === 'YES' ? (
                <CheckCircle2 className="w-6 h-6" />
              ) : (
                <AlertTriangle className="w-6 h-6" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-black text-sm uppercase tracking-wide">
                  {lastConfirmationReceipt.type === 'YES'
                    ? t('doseConfirmedTitle')
                    : t('doseDeclinedTitle')}
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-black/10 dark:bg-neutral-800">
                  {lastConfirmationReceipt.time}
                </span>
              </div>
              <p className="text-xs font-bold mt-0.5">
                {lastConfirmationReceipt.medName}
              </p>
              <p className="text-[11px] opacity-85 mt-0.5 leading-snug">
                {lastConfirmationReceipt.details}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setLastConfirmationReceipt(null)}
            className="text-xs font-black p-1 hover:opacity-70 shrink-0"
            aria-label="Dismiss receipt"
          >
            ✕
          </button>
        </div>
      )}

      {/* Doses List */}
      {sortedDoses.length === 0 ? (
        <div
          className={`text-center py-12 px-6 rounded-2xl border-2 border-dashed ${
            settings.highContrast
              ? 'bg-neutral-950 border-yellow-300 text-yellow-300'
              : 'bg-white border-slate-200 text-slate-600'
          }`}
        >
          <div className="w-12 h-12 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center mx-auto mb-3">
            <Pill className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-base mb-1">{t('noDosesToday')}</h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto mb-4">
            Add your daily medications to enable offline reminders and 48-hour guardian safety escalation.
          </p>
          <button
            type="button"
            onClick={onOpenAddMedModal}
            className="px-5 py-3 bg-teal-700 text-white rounded-xl text-xs font-black shadow hover:bg-teal-800 min-h-[48px]"
          >
            + {t('addMedicine')}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedDoses.map(dose => {
            const med = medicines.find(m => m.id === dose.medicineId);
            const timeDate = new Date(dose.scheduledTime);
            const timeStr = timeDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            const isPending = dose.status === 'PENDING';
            const isTaken = dose.status === 'CONFIRMED_YES';
            const isDeclined = dose.status === 'CONFIRMED_NO';
            const isMissed = dose.status === 'MISSED';

            // In simplified mode, hide completed doses to reduce cognitive clutter if pending doses remain
            if (settings.simplifiedMode && isTaken && pendingCount > 0) {
              return null;
            }

            return (
              <div
                key={dose.id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                  settings.highContrast
                    ? isTaken
                      ? 'bg-neutral-950 border-2 border-yellow-300 text-yellow-300'
                      : isMissed || isDeclined
                      ? 'bg-neutral-950 border-2 border-red-500 text-yellow-300'
                      : 'bg-neutral-900 border border-yellow-300 text-yellow-300'
                    : isTaken
                    ? 'bg-emerald-50/60 border-emerald-300 text-slate-800'
                    : isDeclined
                    ? 'bg-amber-50/70 border-amber-300 text-slate-800'
                    : isMissed
                    ? 'bg-rose-50/70 border-rose-300 text-slate-800'
                    : 'bg-white border-slate-200 text-slate-800 shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* Photo or Pill Icon */}
                    {med?.photoBlobUri ? (
                      <img
                        src={med.photoBlobUri}
                        alt={med.name}
                        className="w-16 h-16 rounded-xl object-cover border border-slate-300 shrink-0"
                      />
                    ) : (
                      <div
                        className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${
                          settings.highContrast
                            ? 'bg-yellow-300 text-black'
                            : isTaken
                            ? 'bg-emerald-100 text-emerald-800'
                            : isMissed
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-teal-100 text-teal-800'
                        }`}
                      >
                        <Pill className="w-7 h-7" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-black ${isExtraLarge ? 'text-2xl' : isLarge ? 'text-xl' : 'text-base'}`}>
                          {med?.name || 'Medication'}
                        </span>
                        <span
                          className={`text-xs font-black px-2.5 py-0.5 rounded-md ${
                            settings.highContrast
                              ? 'bg-neutral-900 border border-yellow-300'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {timeStr}
                        </span>
                      </div>

                      <div className={`font-bold mt-0.5 ${isExtraLarge ? 'text-base' : 'text-xs'} text-slate-600 dark:text-yellow-200`}>
                        {med?.dosage}
                      </div>

                      {/* Remaining Tablets Stock Indicator */}
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold border ${
                            (med?.totalStock ?? 20) <= (med?.lowStockThreshold || 5)
                              ? 'bg-amber-100 border-amber-300 text-amber-900 animate-pulse'
                              : settings.highContrast
                              ? 'bg-neutral-900 border-yellow-300 text-yellow-300'
                              : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                          }`}
                        >
                          <Pill className="w-3 h-3 shrink-0" />
                          <span>
                            {(med?.totalStock ?? 20) <= (med?.lowStockThreshold || 5) ? '⚠️ Low Stock: ' : 'Stock: '}
                            <strong>{med?.totalStock ?? 20}</strong> Tablets Left
                          </span>
                        </span>
                      </div>

                      {med?.instructions && (
                        <p className={`mt-1 leading-snug ${isExtraLarge ? 'text-sm' : 'text-xs'} text-slate-500 dark:text-yellow-300`}>
                          {med.instructions}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Status Indicator & Read Aloud */}
                  <div className="flex flex-col items-end shrink-0 gap-1.5">
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1 ${
                        isTaken
                          ? settings.highContrast
                            ? 'bg-yellow-300 text-black'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : isDeclined
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : isMissed
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {isTaken && <Check className="w-3 h-3" />}
                      {isMissed && <AlertTriangle className="w-3 h-3" />}
                      <span>
                        {isTaken
                          ? t('dosesTaken')
                          : isDeclined
                          ? 'DECLINED'
                          : isMissed
                          ? 'MISSED'
                          : t('dosesPending')}
                      </span>
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        const langInfo = I18nService.getLanguageInfo(settings.language);
                        SpeechEngine.speak(
                          `${med?.name || 'Medicine'}, ${med?.dosage || ''}. ${timeStr}. ${med?.instructions || ''}`,
                          true,
                          langInfo.speechLangCode
                        );
                      }}
                      className="p-2 text-slate-400 hover:text-teal-700 dark:hover:text-yellow-200 rounded-lg"
                      title={t('readAloud')}
                      aria-label={`${t('readAloud')} ${med?.name}`}
                    >
                      <Volume2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* If Pending: Prominent Large YES / NO Touch Buttons */}
                {isPending && (
                  <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-neutral-800 space-y-2">
                    {pendingTremorId && (
                      <div className="p-2 rounded-lg bg-amber-100 text-amber-900 text-xs font-bold text-center">
                        {t('tapAgainToConfirm')}
                      </div>
                    )}
                    <div
                      className={`grid grid-cols-2 ${
                        settings.largeButtonMode ? 'gap-3' : 'gap-2'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => handleCardYes(dose, med!)}
                        style={{ minHeight: settings.largeButtonMode ? '64px' : '48px' }}
                        className={`px-4 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-xs active:scale-95 focus-visible:ring-4 focus-visible:ring-emerald-400 ${
                          settings.highContrast
                            ? 'bg-yellow-300 text-black hover:bg-yellow-200'
                            : 'bg-emerald-600 text-white hover:bg-emerald-700'
                        }`}
                      >
                        <CheckCircle2 className="w-5 h-5 shrink-0" />
                        <div className="text-left">
                          <span className="block font-black">{t('confirmTakenYes')}</span>
                          <span className="text-[10px] font-normal opacity-90">{t('confirmTakenYesSub')}</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCardNo(dose, med!)}
                        style={{ minHeight: settings.largeButtonMode ? '64px' : '48px' }}
                        className={`px-4 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-xs active:scale-95 focus-visible:ring-4 focus-visible:ring-rose-400 ${
                          settings.highContrast
                            ? 'bg-neutral-900 border border-red-500 text-red-400 hover:bg-neutral-800'
                            : 'bg-rose-600 text-white hover:bg-rose-700'
                        }`}
                      >
                        <XCircle className="w-5 h-5 shrink-0" />
                        <div className="text-left">
                          <span className="block font-black">{t('confirmNotTakenNo')}</span>
                          <span className="text-[10px] font-normal opacity-90">{t('confirmNotTakenNoSub')}</span>
                        </div>
                      </button>
                    </div>
                  </div>
                )}

                {/* If Taken */}
                {isTaken && (
                  <div className="mt-2 pt-2 border-t border-emerald-200/60 flex items-center justify-between text-[11px] text-emerald-800 dark:text-yellow-200">
                    <span className="flex items-center gap-1 font-medium">
                      <Check className="w-3.5 h-3.5" />
                      Confirmed at {new Date(dose.confirmedAt || dose.scheduledTime).toLocaleTimeString()}
                    </span>
                    <span className="text-[10px] opacity-80">{t('consciousCheckIn')}</span>
                  </div>
                )}

                {/* If Missed / Declined */}
                {(isMissed || isDeclined) && (
                  <div className="mt-2 pt-2 border-t border-rose-200/60 flex items-center justify-between text-[11px] text-rose-800 dark:text-yellow-200">
                    <span className="flex items-center gap-1 font-medium">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                      {dose.alertStatus === 'ACKNOWLEDGED'
                        ? 'Guardian Acknowledged'
                        : dose.alertStatus === 'QUEUED'
                        ? 'Guardian Alert Queued (BLE/LAN)'
                        : 'Alert Dispatched'}
                    </span>
                    <button
                      type="button"
                      onClick={() => onConfirmDose(dose, med!, true)}
                      className="text-[10px] font-bold underline hover:opacity-80 py-1 px-2"
                    >
                      Undo / Mark Taken Now
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
