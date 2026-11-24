// src/components/DueDoseModal.tsx
import React, { useEffect, useState, useRef } from 'react';
import { DoseEvent, Medicine } from '../services/db';
import { sound, SpeechEngine } from '../services/audio';
import { AccessibilitySettings } from '../services/accessibility';
import { I18nService, t } from '../services/i18n';
import {
  CheckCircle2,
  XCircle,
  Volume2,
  Pill,
  Clock,
  AlertCircle,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  RotateCcw,
  Sparkles,
  PhoneCall,
  Mic,
  MicOff,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { VoiceCommandService, VoiceListenerStatus } from '../services/voiceListener';

interface DueDoseModalProps {
  dose: DoseEvent;
  med: Medicine;
  settings: AccessibilitySettings;
  onConfirm: (confirmed: boolean) => void;
  onDismiss: () => void;
}

export const DueDoseModal: React.FC<DueDoseModalProps> = ({
  dose,
  med,
  settings,
  onConfirm,
  onDismiss,
}) => {
  // Phase of modal: 'PROMPT' -> 'RECEIPT_YES' or 'RECEIPT_NO'
  const [phase, setPhase] = useState<'PROMPT' | 'RECEIPT_YES' | 'RECEIPT_NO'>('PROMPT');
  // Tremor safeguard state
  const [pendingChoice, setPendingChoice] = useState<'YES' | 'NO' | null>(null);
  // Auto-close countdown for receipt
  const [countdown, setCountdown] = useState<number>(6);
  // Tablet inventory count state
  const [currentStock, setCurrentStock] = useState<number>(med.totalStock ?? 20);
  // Active spoken caption to display on-screen subtitles so the taker knows exactly what was said
  const [activeCaption, setActiveCaption] = useState<string>('');
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Hands-free Voice Command Listener State
  const [voiceStatus, setVoiceStatus] = useState<VoiceListenerStatus>('idle');
  const [voiceTranscript, setVoiceTranscript] = useState<string>('');
  const [voiceMatched, setVoiceMatched] = useState<boolean>(false);
  const [confirmedByVoice, setConfirmedByVoice] = useState<boolean>(false);
  const [voiceActive, setVoiceActive] = useState<boolean>(settings.voiceCommandsEnabled ?? true);

  // Subscribe to speech captions
  useEffect(() => {
    const unsub = SpeechEngine.subscribeCaptions((text, speaking) => {
      setActiveCaption(text);
      setIsSpeaking(speaking);
    });
    return () => unsub();
  }, []);

  // Initial reminder prompt
  useEffect(() => {
    sound.playReminderChime();
    if (settings.vibrationEnabled) {
      sound.vibrate([300, 150, 300, 150, 400]);
    }

    const langInfo = I18nService.getLanguageInfo(settings.language);
    const spokenPrompt = settings.language === 'hi'
      ? `दवाई का समय: ${med.name}। ${med.dosage}। ${med.instructions || 'कृपया पानी के साथ लें।'}`
      : `Time for your medicine: ${med.name}. ${med.dosage}. ${med.instructions || ''}`;

    SpeechEngine.speak(spokenPrompt, settings.ttsEnabled, langInfo.speechLangCode, 0.80);

    return () => {
      SpeechEngine.stop();
      VoiceCommandService.stopListening();
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [dose.id, med.name, med.dosage, med.instructions, settings.ttsEnabled, settings.language, settings.vibrationEnabled]);

  // Execute confirmation (can be triggered by voice command or touch YES)
  const executeConfirmYes = (isVoiceTrigger: boolean = false) => {
    // Stop voice listener once confirmed
    VoiceCommandService.stopListening();

    if (isVoiceTrigger) {
      setConfirmedByVoice(true);
      setVoiceMatched(true);
      sound.vibrate([100, 50, 150]);
    }

    // Deduct 1 tablet from inventory count
    const newStock = Math.max(0, currentStock - 1);
    setCurrentStock(newStock);

    // Save dose in DB immediately
    onConfirm(true);

    // Transition to Taker Confirmation Receipt
    setPhase('RECEIPT_YES');
    sound.playSuccessChime();
    if (settings.vibrationEnabled) {
      sound.vibrate([150, 80, 200]);
    }

    confetti({
      particleCount: 60,
      spread: 80,
      origin: { y: 0.5 }
    });

    const langInfo = I18nService.getLanguageInfo(settings.language);
    let spokenReceipt = '';
    const voicePrefix = isVoiceTrigger
      ? (settings.language === 'hi' ? 'वॉयस कमांड स्वीकृत! ' : 'Voice command confirmed! ')
      : '';

    if (settings.language === 'hi') {
      spokenReceipt = `${voicePrefix}पुष्टि हुई! आपकी ${med.name} दवाई सुरक्षित दर्ज कर ली गई है। अब आपके पास ${newStock} गोलियां शेष हैं। सुरक्षा घड़ी रीसेट हो गई है।`;
      if (newStock <= (med.lowStockThreshold || 5)) {
        spokenReceipt += ` ध्यान दें: केवल ${newStock} गोलियां बाकी हैं, कृपया जल्द ही नई दवा लाएं।`;
      }
    } else {
      spokenReceipt = `${voicePrefix}Confirmed! Your dose of ${med.name} has been safely recorded as taken. You now have ${newStock} tablets remaining. Your 48-hour safety clock is reset.`;
      if (newStock <= (med.lowStockThreshold || 5)) {
        spokenReceipt += ` Notice: Low stock alert. Only ${newStock} tablets left. Please refill your prescription soon.`;
      }
    }

    SpeechEngine.speak(spokenReceipt, settings.ttsEnabled, langInfo.speechLangCode, 0.80);

    // Start auto-close countdown
    let remaining = 6;
    setCountdown(remaining);
    countdownTimerRef.current = setInterval(() => {
      remaining -= 1;
      setCountdown(remaining);
      if (remaining <= 0) {
        if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
        onDismiss();
      }
    }, 1000);
  };

  // Hands-free Voice Command Listener: triggers when user says "CareDose, I took my medicine"
  useEffect(() => {
    if (phase !== 'PROMPT' || !voiceActive) {
      VoiceCommandService.stopListening();
      return;
    }

    const cleanup = VoiceCommandService.startListening({
      language: settings.language,
      continuous: true,
      autoRestart: true,
      onStatusChange: (status) => {
        setVoiceStatus(status);
      },
      onTranscript: (transcript, isFinal) => {
        setVoiceTranscript(transcript);
      },
      onMatch: () => {
        executeConfirmYes(true);
      }
    });

    return () => {
      cleanup();
    };
  }, [phase, voiceActive, settings.language, currentStock, med.name, med.lowStockThreshold]);

  // Handle YES Click
  const handleYesClick = () => {
    if (settings.confirmationSafeguard && pendingChoice !== 'YES') {
      setPendingChoice('YES');
      sound.vibrate([100]);
      SpeechEngine.speak(t('tapAgainToConfirm'), settings.ttsEnabled, undefined, 0.82);
      return;
    }
    executeConfirmYes(false);
  };

  // Handle NO Click
  const handleNoClick = () => {
    if (settings.confirmationSafeguard && pendingChoice !== 'NO') {
      setPendingChoice('NO');
      sound.vibrate([100]);
      SpeechEngine.speak(t('tapAgainToConfirm'), settings.ttsEnabled, undefined, 0.82);
      return;
    }

    VoiceCommandService.stopListening();

    // Save dose as declined in DB & dispatch guardian alert
    onConfirm(false);

    // Transition to Taker Declined Receipt
    setPhase('RECEIPT_NO');
    sound.playAlertChime();

    const langInfo = I18nService.getLanguageInfo(settings.language);
    const spokenReceipt = settings.language === 'hi'
      ? `दवाई नहीं ली गई दर्ज किया गया। आपके पास अभी भी ${currentStock} गोलियां मौजूद हैं। आपके अभिभावक को सहायता के लिए सूचित कर दिया गया है।`
      : `Recorded as not taken. You still have ${currentStock} tablets available. Your designated guardian has been notified to assist you.`;

    SpeechEngine.speak(spokenReceipt, settings.ttsEnabled, langInfo.speechLangCode, 0.80);
  };

  const handleReplaySpeech = (textToSpeak: string) => {
    const langInfo = I18nService.getLanguageInfo(settings.language);
    SpeechEngine.speak(textToSpeak, true, langInfo.speechLangCode, 0.78);
  };

  const timeString = new Date(dose.scheduledTime).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });

  const isExtraLarge = settings.fontSize === 'EXTRA_LARGE';
  const isLarge = settings.fontSize === 'LARGE' || isExtraLarge;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="dose-modal-title"
      className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200"
    >
      <div
        className={`w-full max-w-md rounded-3xl p-6 sm:p-7 shadow-2xl text-center space-y-4 border ${
          settings.highContrast
            ? 'bg-neutral-950 border-4 border-yellow-300 text-yellow-300'
            : 'bg-white border-slate-200 text-slate-900'
        } ${
          phase === 'PROMPT' && settings.visualFlashingAlert
            ? 'ring-4 ring-teal-500/60 ring-offset-4 ring-offset-black animate-pulse'
            : ''
        }`}
      >
        {/* =========================================================================
            ON-SCREEN SPOKEN SUBTITLES / CAPTION BANNER
            Addresses: "Voice is not clear I don't what she said"
            Displays the exact spoken words in prominent, high-legibility text!
           ========================================================================= */}
        {activeCaption && (
          <div
            className={`p-3 rounded-2xl border text-left flex items-start gap-2.5 transition-all shadow-sm ${
              settings.highContrast
                ? 'bg-neutral-900 border-yellow-300 text-yellow-200'
                : 'bg-teal-50/95 border-teal-200 text-teal-950'
            }`}
          >
            <div className="p-1 rounded-md bg-teal-700 text-white shrink-0 mt-0.5">
              <Volume2 className={`w-4 h-4 ${isSpeaking ? 'animate-bounce' : ''}`} />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-black uppercase tracking-wider block opacity-75">
                {t('captionsSpeaking')}
              </span>
              <p className="text-xs sm:text-sm font-bold leading-snug">
                "{activeCaption}"
              </p>
            </div>
          </div>
        )}

        {/* =========================================================================
            PHASE 1: PROMPT VIEW (Initial due dose prompt)
           ========================================================================= */}
        {phase === 'PROMPT' && (
          <>
            {/* Visual Attention Badge */}
            <div className="flex items-center justify-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${
                  settings.highContrast
                    ? 'bg-yellow-300 text-black'
                    : 'bg-teal-100 text-teal-800 border border-teal-200'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>{t('timeForMedicine')} · {timeString}</span>
              </span>
            </div>

            {/* Pill photo or icon */}
            {med.photoBlobUri ? (
              <div className="relative mx-auto w-36 h-36 rounded-2xl overflow-hidden border-2 border-slate-300 shadow-md">
                <img
                  src={med.photoBlobUri}
                  alt={med.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div
                className={`mx-auto w-24 h-24 rounded-2xl flex items-center justify-center shadow-inner ${
                  settings.highContrast
                    ? 'bg-neutral-900 text-yellow-300 border-2 border-yellow-300'
                    : 'bg-teal-50 text-teal-700'
                }`}
              >
                <Pill className="w-12 h-12" />
              </div>
            )}

            {/* Medicine details */}
            <div>
              <h2
                id="dose-modal-title"
                className={`font-black tracking-tight leading-tight ${
                  isExtraLarge ? 'text-3xl sm:text-4xl' : isLarge ? 'text-2xl sm:text-3xl' : 'text-2xl'
                }`}
              >
                {med.name}
              </h2>
              <p
                className={`font-bold mt-1 ${
                  isExtraLarge ? 'text-xl' : isLarge ? 'text-lg' : 'text-base'
                } ${settings.highContrast ? 'text-yellow-200' : 'text-slate-700'}`}
              >
                {med.dosage}
              </p>
              {med.instructions && (
                <p
                  className={`mt-1.5 max-w-sm mx-auto leading-relaxed ${
                    isExtraLarge ? 'text-sm' : 'text-xs'
                  } ${settings.highContrast ? 'text-yellow-100' : 'text-slate-500'}`}
                >
                  {med.instructions}
                </p>
              )}
            </div>

            {/* Read Aloud button (crystal-clear replay) */}
            <button
              type="button"
              onClick={() => {
                const text = settings.language === 'hi'
                  ? `दवाई का समय: ${med.name}। ${med.dosage}। वर्तमान में ${currentStock} गोलियां उपलब्ध हैं। ${med.instructions || 'कृपया पानी के साथ लें।'}`
                  : `Time for your medicine: ${med.name}. ${med.dosage}. Currently ${currentStock} tablets available. ${med.instructions || ''}`;
                handleReplaySpeech(text);
              }}
              className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-colors ${
                settings.highContrast
                  ? 'bg-neutral-900 border border-yellow-300 text-yellow-300 hover:bg-neutral-800'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
              aria-label={t('readAloud')}
            >
              <Volume2 className="w-4 h-4" />
              <span>{t('readAloud')}</span>
            </button>

            {/* Current Inventory Banner */}
            <div
              className={`p-3 rounded-2xl border flex items-center justify-between text-xs font-bold transition-all ${
                settings.highContrast
                  ? 'bg-neutral-900 border-yellow-300 text-yellow-300'
                  : 'bg-emerald-50/90 border-emerald-300 text-emerald-950 shadow-xs'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800 dark:bg-yellow-300 dark:text-black">
                  <Pill className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <span className="block text-[11px] opacity-80 uppercase tracking-wider font-extrabold">
                    {t('tabletsCurrentlyPresent')}
                  </span>
                  <span className="text-xs font-semibold">
                    {med.name} bottle/strip
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="font-mono text-base font-black px-2.5 py-1 rounded-xl bg-white dark:bg-neutral-800 border border-emerald-300 dark:border-yellow-300 text-emerald-900 dark:text-yellow-200 shadow-xs inline-block">
                  {currentStock} Tablets
                </span>
              </div>
            </div>

            {/* HANDS-FREE VOICE COMMAND LISTENER BANNER */}
            {voiceActive && (
              <div
                className={`p-3.5 rounded-2xl border transition-all text-left space-y-2 ${
                  settings.highContrast
                    ? 'bg-neutral-900 border-2 border-yellow-300 text-yellow-300'
                    : voiceMatched
                    ? 'bg-emerald-100 border-2 border-emerald-500 text-emerald-950 ring-2 ring-emerald-300'
                    : voiceStatus === 'hearing'
                    ? 'bg-teal-50 border-2 border-teal-500 text-teal-950 shadow-md ring-2 ring-teal-200'
                    : 'bg-gradient-to-r from-teal-50/90 to-cyan-50/90 border border-teal-200 text-teal-950 shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`relative p-2 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                        voiceMatched
                          ? 'bg-emerald-600 text-white'
                          : voiceStatus === 'hearing'
                          ? 'bg-teal-600 text-white animate-pulse'
                          : voiceStatus === 'listening'
                          ? 'bg-teal-700 text-white'
                          : 'bg-slate-200 text-slate-700 dark:bg-neutral-800 dark:text-yellow-300'
                      }`}
                    >
                      <Mic className="w-5 h-5 shrink-0" />
                      {voiceStatus === 'listening' && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-black uppercase tracking-wider block">
                          {t('voiceCommandActive')}
                        </span>
                        {voiceStatus === 'listening' && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                            Listening...
                          </span>
                        )}
                        {voiceStatus === 'hearing' && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-200 text-teal-900 animate-pulse">
                            Hearing voice...
                          </span>
                        )}
                        {voiceStatus === 'unsupported' && (
                          <span className="text-[10px] opacity-75 font-normal">(Mic not supported in browser)</span>
                        )}
                        {voiceStatus === 'permission_denied' && (
                          <span className="text-[10px] text-amber-700 dark:text-yellow-300 font-bold">
                            (Mic permission denied)
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-medium mt-0.5 leading-snug">
                        Say: <strong className="font-black text-teal-800 dark:text-yellow-200 underline decoration-teal-500 decoration-2">"CareDose, I took my medicine"</strong> to confirm hands-free.
                      </p>
                    </div>
                  </div>

                  {/* Instant Test / Voice Simulation Button */}
                  <button
                    type="button"
                    onClick={() => {
                      VoiceCommandService.simulatePhrase('CareDose, I took my medicine');
                    }}
                    title="Tap to test hands-free voice trigger"
                    aria-label="Test saying: CareDose, I took my medicine"
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

                {/* Live Heard Transcript Preview */}
                {voiceTranscript && (
                  <div className="pt-2 border-t border-teal-200/60 dark:border-neutral-800 flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5 truncate max-w-[280px]">
                      <span className="font-bold opacity-75">{t('voiceHeard')}:</span>
                      <span className="font-mono italic font-semibold truncate">"{voiceTranscript}"</span>
                    </div>
                    {voiceMatched && (
                      <span className="text-emerald-700 dark:text-yellow-300 font-black flex items-center gap-1 shrink-0">
                        <Check className="w-3.5 h-3.5" />
                        Verified!
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Tremor Safeguard Prompt Banner if active */}
            {pendingChoice && (
              <div className="p-2.5 rounded-xl bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold flex items-center justify-center gap-1.5 animate-bounce">
                <AlertCircle className="w-4 h-4 text-amber-700" />
                <span>{t('tapAgainToConfirm')}</span>
              </div>
            )}

            {/* PROMINENT TOUCH CONFIRMATION BUTTONS (64 - 80dp height) */}
            <div
              className={`grid grid-cols-2 ${
                settings.largeButtonMode ? 'gap-4 pt-3' : 'gap-3 pt-2'
              }`}
            >
              {/* YES Button */}
              <button
                type="button"
                onClick={handleYesClick}
                aria-label={`${t('confirmTakenYes')}: ${t('confirmTakenYesSub')} ${med.name}`}
                style={{ minHeight: settings.largeButtonMode ? '80px' : '64px' }}
                className={`p-4 rounded-2xl font-black flex flex-col items-center justify-center gap-1 transition-all shadow-lg active:scale-95 focus-visible:ring-4 focus-visible:ring-emerald-400 ${
                  settings.highContrast
                    ? pendingChoice === 'YES'
                      ? 'bg-yellow-400 text-black ring-4 ring-white'
                      : 'bg-yellow-300 text-black hover:bg-yellow-200 border-2 border-white'
                    : pendingChoice === 'YES'
                    ? 'bg-emerald-700 text-white ring-4 ring-emerald-300'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xl">
                  <CheckCircle2 className="w-6 h-6 shrink-0" />
                  <span>{t('confirmTakenYes')}</span>
                </div>
                <span className="text-xs font-semibold opacity-95">
                  {pendingChoice === 'YES' ? t('tapAgainToConfirm') : t('confirmTakenYesSub')}
                </span>
              </button>

              {/* NO Button */}
              <button
                type="button"
                onClick={handleNoClick}
                aria-label={`${t('confirmNotTakenNo')}: ${t('confirmNotTakenNoSub')} ${med.name}`}
                style={{ minHeight: settings.largeButtonMode ? '80px' : '64px' }}
                className={`p-4 rounded-2xl font-black flex flex-col items-center justify-center gap-1 transition-all shadow-lg active:scale-95 focus-visible:ring-4 focus-visible:ring-rose-400 ${
                  settings.highContrast
                    ? pendingChoice === 'NO'
                      ? 'bg-neutral-800 text-red-300 ring-4 ring-red-400 border-2 border-red-400'
                      : 'bg-neutral-900 border-2 border-red-500 text-red-400 hover:bg-neutral-800'
                    : pendingChoice === 'NO'
                    ? 'bg-rose-700 text-white ring-4 ring-rose-300'
                    : 'bg-rose-600 text-white hover:bg-rose-700'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xl">
                  <XCircle className="w-6 h-6 shrink-0" />
                  <span>{t('confirmNotTakenNo')}</span>
                </div>
                <span className="text-xs font-semibold opacity-95">
                  {pendingChoice === 'NO' ? t('tapAgainToConfirm') : t('confirmNotTakenNoSub')}
                </span>
              </button>
            </div>

            {/* Snooze option */}
            <button
              type="button"
              onClick={onDismiss}
              className={`text-xs underline opacity-80 hover:opacity-100 mt-2 block mx-auto py-2 px-3 ${
                settings.highContrast ? 'text-yellow-300' : 'text-slate-500'
              }`}
            >
              {t('snooze5Min')}
            </button>
          </>
        )}

        {/* =========================================================================
            PHASE 2: TAKER CONFIRMATION RECEIPT (WHEN YES IS PRESSED)
            Addresses: "when yes or no button is pressed give a confirmation to taker"
           ========================================================================= */}
        {phase === 'RECEIPT_YES' && (
          <div className="space-y-4 py-2 animate-in zoom-in-95 duration-200">
            {/* Big Celebratory Green Check Icon */}
            <div className="w-20 h-20 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-lg ring-8 ring-emerald-50 dark:ring-neutral-900">
              <CheckCircle2 className="w-12 h-12" />
            </div>

            {/* Clear, Unmistakable Title */}
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-emerald-800 dark:text-yellow-300 leading-tight">
                {t('doseConfirmedTitle')}
              </h2>
              <p className="text-xs sm:text-sm font-bold text-slate-700 dark:text-yellow-100 mt-1">
                {med.name} · {med.dosage}
              </p>
            </div>

            {/* INVENTORY TABLETS REMAINING CARD */}
            <div
              className={`p-4 rounded-2xl border-2 text-center space-y-1.5 transition-all ${
                settings.highContrast
                  ? 'bg-neutral-900 border-yellow-300 text-yellow-300'
                  : 'bg-emerald-50/90 border-emerald-400 text-emerald-950 shadow-sm'
              }`}
            >
              <span className="text-[11px] font-black uppercase tracking-wider block text-emerald-800 dark:text-yellow-300">
                {t('tabletsRemaining')}
              </span>
              <div className="flex items-center justify-center gap-2">
                <Pill className="w-6 h-6 text-emerald-600 dark:text-yellow-300 shrink-0" />
                <span className="text-3xl font-black font-mono text-emerald-950 dark:text-yellow-200">
                  {currentStock}
                </span>
                <span className="text-sm font-bold text-slate-600 dark:text-yellow-100">
                  Tablets Left
                </span>
              </div>
              <p className="text-[11px] opacity-80">
                1 tablet taken ({currentStock + 1} ➔ {currentStock}). Inventory updated in your CareDose log.
              </p>

              {currentStock <= (med.lowStockThreshold || 5) && (
                <div className="mt-2 p-2 rounded-xl bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold flex items-center justify-center gap-1.5 animate-pulse">
                  <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>{t('lowStockWarning')} ({currentStock} tablets left)</span>
                </div>
              )}
            </div>

            {/* Hands-Free Voice Badge (if triggered by voice command) */}
            {confirmedByVoice && (
              <div className="p-2.5 rounded-xl bg-teal-100 dark:bg-neutral-800 border-2 border-teal-400 dark:border-yellow-300 text-teal-950 dark:text-yellow-200 text-xs font-black flex items-center justify-center gap-2 shadow-xs">
                <Mic className="w-4 h-4 text-teal-700 dark:text-yellow-300 animate-pulse" />
                <span>Confirmed hands-free via voice: "CareDose, I took my medicine"</span>
              </div>
            )}

            {/* Receipt Summary Card */}
            <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-neutral-900 border border-emerald-200 dark:border-yellow-300 text-left space-y-2 text-xs">
              <div className="flex justify-between items-center text-emerald-950 dark:text-yellow-200">
                <span className="opacity-80">{t('doseRecordedAt')}:</span>
                <span className="font-mono font-bold text-sm">{new Date().toLocaleTimeString()}</span>
              </div>
              <div className="pt-2 border-t border-emerald-200/60 dark:border-neutral-800 flex items-start gap-2 text-emerald-900 dark:text-yellow-100">
                <ShieldCheck className="w-4 h-4 text-emerald-700 dark:text-yellow-300 shrink-0 mt-0.5" />
                <span className="text-[11px] leading-tight">
                  {t('doseConfirmedSub')}
                </span>
              </div>
            </div>

            {/* Audio Replay Button */}
            <button
              type="button"
              onClick={() => {
                const text = settings.language === 'hi'
                  ? `पुष्टि हुई! आपकी ${med.name} दवाई सुरक्षित दर्ज कर ली गई है। अब आपके पास ${currentStock} गोलियां शेष हैं।`
                  : `Confirmed! Your dose of ${med.name} has been safely recorded as taken. You now have ${currentStock} tablets remaining.`;
                handleReplaySpeech(text);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 text-slate-700 dark:text-yellow-200"
            >
              <Volume2 className="w-4 h-4" />
              <span>Hear Confirmation Again</span>
            </button>

            {/* Big Prominent "OK, Done" Button */}
            <button
              type="button"
              onClick={onDismiss}
              style={{ minHeight: settings.largeButtonMode ? '68px' : '56px' }}
              className={`w-full py-3.5 px-5 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl transition-all active:scale-95 ${
                settings.highContrast
                  ? 'bg-yellow-300 text-black hover:bg-yellow-200'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>{t('takerReceiptOk')} ({countdown}s)</span>
            </button>
          </div>
        )}

        {/* =========================================================================
            PHASE 3: TAKER DECLINED RECEIPT (WHEN NO IS PRESSED)
            Addresses: "when yes or no button is pressed give a confirmation to taker"
           ========================================================================= */}
        {phase === 'RECEIPT_NO' && (
          <div className="space-y-4 py-2 animate-in zoom-in-95 duration-200">
            {/* Warning Shield Icon */}
            <div className="w-20 h-20 mx-auto rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shadow-lg ring-8 ring-rose-50 dark:ring-neutral-900">
              <ShieldAlert className="w-12 h-12" />
            </div>

            {/* Clear, Unmistakable Title */}
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-rose-800 dark:text-yellow-300 leading-tight">
                {t('doseDeclinedTitle')}
              </h2>
              <p className="text-xs sm:text-sm font-bold text-slate-700 dark:text-yellow-100 mt-1">
                {med.name} · {med.dosage}
              </p>
            </div>

            {/* INVENTORY TABLETS STATUS (UNCHANGED) */}
            <div
              className={`p-3.5 rounded-2xl border text-center space-y-1 transition-all ${
                settings.highContrast
                  ? 'bg-neutral-900 border-yellow-300 text-yellow-300'
                  : 'bg-slate-100 border-slate-300 text-slate-800'
              }`}
            >
              <span className="text-[11px] font-black uppercase tracking-wider block text-slate-600 dark:text-yellow-300">
                {t('tabletsCurrentlyPresent')}
              </span>
              <div className="flex items-center justify-center gap-2">
                <Pill className="w-5 h-5 text-slate-500 dark:text-yellow-300 shrink-0" />
                <span className="text-2xl font-black font-mono text-slate-900 dark:text-yellow-200">
                  {currentStock}
                </span>
                <span className="text-xs font-bold text-slate-600 dark:text-yellow-100">
                  Tablets Available (Unchanged)
                </span>
              </div>
            </div>

            {/* Receipt Summary Card */}
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-neutral-900 border border-rose-200 dark:border-yellow-300 text-left space-y-2 text-xs">
              <div className="flex justify-between items-center text-rose-950 dark:text-yellow-200">
                <span className="opacity-80">{t('doseRecordedAt')}:</span>
                <span className="font-mono font-bold text-sm">{new Date().toLocaleTimeString()}</span>
              </div>
              <div className="pt-2 border-t border-rose-200/60 dark:border-neutral-800 flex items-start gap-2 text-rose-900 dark:text-yellow-100">
                <AlertCircle className="w-4 h-4 text-rose-700 dark:text-yellow-300 shrink-0 mt-0.5" />
                <span className="text-[11px] leading-tight">
                  {t('doseDeclinedSub')}
                </span>
              </div>
            </div>

            {/* Replay audio */}
            <button
              type="button"
              onClick={() => {
                const text = settings.language === 'hi'
                  ? `दवाई नहीं ली गई दर्ज किया गया। आपके पास अभी भी ${currentStock} गोलियां मौजूद हैं। आपके अभिभावक को सूचित कर दिया गया है।`
                  : `Recorded as not taken. You still have ${currentStock} tablets available. Designated guardian has been notified to assist you.`;
                handleReplaySpeech(text);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 text-slate-700 dark:text-yellow-200"
            >
              <Volume2 className="w-4 h-4" />
              <span>Hear Alert Again</span>
            </button>

            {/* Action buttons: Change to YES or Close */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setPendingChoice(null);
                  handleYesClick();
                }}
                style={{ minHeight: settings.largeButtonMode ? '64px' : '50px' }}
                className="w-full py-3 px-4 rounded-2xl font-black text-xs uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2 shadow"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{t('changeToYes')}</span>
              </button>

              <button
                type="button"
                onClick={onDismiss}
                style={{ minHeight: settings.largeButtonMode ? '56px' : '44px' }}
                className="w-full py-2.5 px-4 rounded-2xl font-bold text-xs border border-slate-300 dark:border-neutral-700 text-slate-700 dark:text-yellow-300 hover:bg-slate-50"
              >
                {t('takerReceiptOk')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
