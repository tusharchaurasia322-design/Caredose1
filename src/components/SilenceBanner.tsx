// src/components/SilenceBanner.tsx
import React, { useState, useEffect } from 'react';
import { PatientProfile } from '../services/db';
import { EscalationWatchdog } from '../services/escalation';
import { sound, SpeechEngine } from '../services/audio';
import { AccessibilitySettings } from '../services/accessibility';
import { I18nService, t } from '../services/i18n';
import { ShieldAlert, ShieldCheck, HeartPulse, Clock, Info } from 'lucide-react';
import confetti from 'canvas-confetti';

interface SilenceBannerProps {
  patient: PatientProfile | null;
  settings: AccessibilitySettings;
  onCheckInConfirmed: () => void;
}

export const SilenceBanner: React.FC<SilenceBannerProps> = ({
  patient,
  settings,
  onCheckInConfirmed,
}) => {
  const [hoursRemaining, setHoursRemaining] = useState<number>(48);
  const [percentRemaining, setPercentRemaining] = useState<number>(100);
  const [isViolated, setIsViolated] = useState<boolean>(false);
  const [showInfo, setShowInfo] = useState<boolean>(false);
  const [checkingIn, setCheckingIn] = useState<boolean>(false);

  useEffect(() => {
    if (!patient) return;

    const checkSilence = async () => {
      try {
        const res = await EscalationWatchdog.evaluateSilence(patient.id);
        setHoursRemaining(res.hoursRemaining);
        setPercentRemaining(res.percentRemaining);
        setIsViolated(res.isViolated);
      } catch (err) {
        console.error('Error evaluating silence:', err);
      }
    };

    checkSilence();
    const interval = setInterval(checkSilence, 15000); // Check every 15s
    return () => clearInterval(interval);
  }, [patient]);

  const handleWellnessCheckIn = async () => {
    if (!patient || checkingIn) return;
    setCheckingIn(true);
    try {
      await EscalationWatchdog.recordQualifyingCheckIn(patient.id);
      sound.playSuccessChime();
      if (settings.vibrationEnabled) {
        sound.vibrate([100, 50, 100]);
      }

      const langInfo = I18nService.getLanguageInfo(settings.language);
      const msg = settings.language === 'hi'
        ? 'सचेत चेक-इन दर्ज किया गया। 48-घंटे की सुरक्षा घड़ी रीसेट कर दी गई है।'
        : 'Wellness check-in recorded. Forty-eight hour silence countdown has been reset.';

      SpeechEngine.speak(msg, settings.ttsEnabled, langInfo.speechLangCode);

      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.2 }
      });

      onCheckInConfirmed();
    } finally {
      setTimeout(() => setCheckingIn(false), 500);
    }
  };

  if (!patient) return null;

  const isUrgent = hoursRemaining <= 12;
  const isCritical = hoursRemaining <= 4;
  const isExtraLarge = settings.fontSize === 'EXTRA_LARGE';
  const isLarge = settings.fontSize === 'LARGE' || isExtraLarge;

  return (
    <div
      className={`rounded-2xl border transition-all ${
        settings.highContrast
          ? isViolated || isCritical
            ? 'bg-neutral-950 border-2 border-red-400 text-yellow-300'
            : 'bg-neutral-950 border-2 border-yellow-300 text-yellow-300'
          : isViolated
          ? 'bg-rose-50 border-rose-300 text-rose-950 shadow-sm'
          : isCritical
          ? 'bg-amber-50 border-amber-300 text-amber-950 shadow-sm'
          : 'bg-white border-slate-200 text-slate-800 shadow-sm'
      } p-4`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div
            className={`p-2 rounded-xl shrink-0 ${
              settings.highContrast
                ? 'bg-yellow-300 text-black'
                : isViolated || isCritical
                ? 'bg-rose-100 text-rose-700'
                : 'bg-teal-100 text-teal-800'
            }`}
          >
            {isViolated ? (
              <ShieldAlert className="w-6 h-6" />
            ) : isCritical ? (
              <HeartPulse className="w-6 h-6 animate-pulse" />
            ) : (
              <ShieldCheck className="w-6 h-6" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                className={`text-xs font-bold uppercase tracking-wider ${
                  settings.highContrast
                    ? 'text-yellow-400'
                    : isViolated
                    ? 'text-rose-700'
                    : isCritical
                    ? 'text-amber-700'
                    : 'text-slate-500'
                }`}
              >
                {t('silenceWatchdogTitle')}
              </span>
              <button
                type="button"
                onClick={() => setShowInfo(!showInfo)}
                className="text-slate-400 hover:text-slate-600 focus-visible:outline-none"
                aria-label="Information about 48-Hour Silence Rule"
              >
                <Info className="w-3.5 h-3.5 inline" />
              </button>
            </div>

            <div className="flex items-baseline gap-2 mt-0.5">
              <span className={`font-black tracking-tight ${isExtraLarge ? 'text-2xl sm:text-3xl' : isLarge ? 'text-xl' : 'text-lg'}`}>
                {isViolated ? t('silenceViolated') : `${hoursRemaining} hrs`}
              </span>
              <span className={`text-xs ${settings.highContrast ? 'text-yellow-200' : 'text-slate-500'}`}>
                {isViolated ? '' : t('silenceRemaining')}
              </span>
            </div>

            {/* Progress indicator bar */}
            <div
              className={`w-full h-1.5 rounded-full mt-2 overflow-hidden ${
                settings.highContrast ? 'bg-neutral-800' : 'bg-slate-100'
              }`}
            >
              <div
                className={`h-full transition-all duration-500 ${
                  settings.highContrast
                    ? 'bg-yellow-300'
                    : isViolated || isCritical
                    ? 'bg-rose-500'
                    : isUrgent
                    ? 'bg-amber-500'
                    : 'bg-teal-600'
                }`}
                style={{ width: `${percentRemaining}%` }}
              />
            </div>
          </div>
        </div>

        {/* Big Safe Check-in button */}
        <div className="shrink-0 flex flex-col items-end">
          <button
            type="button"
            onClick={handleWellnessCheckIn}
            disabled={checkingIn}
            style={{ minHeight: settings.largeButtonMode ? '56px' : '44px' }}
            className={`px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wide flex items-center gap-1.5 transition-all shadow active:scale-95 focus-visible:ring-4 focus-visible:ring-teal-400 ${
              settings.highContrast
                ? 'bg-yellow-300 text-black hover:bg-yellow-200 border-2 border-white'
                : 'bg-teal-700 text-white hover:bg-teal-800'
            }`}
          >
            <HeartPulse className="w-4 h-4" />
            <span>{checkingIn ? '...' : t('iAmSafe')}</span>
          </button>
          <span className={`text-[10px] mt-1 text-right font-medium ${settings.highContrast ? 'text-yellow-200' : 'text-slate-400'}`}>
            {t('consciousCheckIn')}
          </span>
        </div>
      </div>

      {showInfo && (
        <div
          className={`mt-3 pt-3 border-t text-xs leading-relaxed ${
            settings.highContrast ? 'border-neutral-800 text-yellow-200' : 'border-slate-100 text-slate-600'
          }`}
        >
          <p className="font-semibold text-slate-800 dark:text-yellow-100 mb-1">
            Why does passive opening not count?
          </p>
          <p>
            To protect patients who may be incapacitated, CareDose strictly requires a conscious human
            interaction: confirming a scheduled dose with <strong>YES</strong> or tapping the{' '}
            <strong>"{t('iAmSafe')}"</strong> button. Merely launching the app or receiving background pings does
            not reset the 48-hour safety clock.
          </p>
        </div>
      )}
    </div>
  );
};
