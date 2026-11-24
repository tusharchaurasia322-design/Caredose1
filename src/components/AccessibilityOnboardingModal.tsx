// src/components/AccessibilityOnboardingModal.tsx
import React, { useState } from 'react';
import { AccessibilityService, AccessibilitySettings } from '../services/accessibility';
import { LANGUAGES, LanguageInfo, SupportedLanguage, I18nService, t } from '../services/i18n';
import { sound, SpeechEngine } from '../services/audio';
import {
  Volume2,
  Check,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  X,
  Eye,
  Hand,
  Ear,
  Brain,
  MessageSquareOff,
  Sliders,
  CheckCircle2
} from 'lucide-react';

interface AccessibilityOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSettings: AccessibilitySettings;
  onSaveSettings: (settings: Partial<AccessibilitySettings>) => void;
}

export const AccessibilityOnboardingModal: React.FC<AccessibilityOnboardingModalProps> = ({
  isOpen,
  onClose,
  currentSettings,
  onSaveSettings,
}) => {
  const [step, setStep] = useState<number>(1);
  const [selectedLang, setSelectedLang] = useState<SupportedLanguage>(currentSettings.language);
  const [selectedNeeds, setSelectedNeeds] = useState<string[]>(currentSettings.selectedDisabilities || []);

  // Customized settings generated based on recommendations
  const [config, setConfig] = useState<Partial<AccessibilitySettings>>({
    highContrast: currentSettings.highContrast,
    fontSize: currentSettings.fontSize,
    simplifiedMode: currentSettings.simplifiedMode,
    largeButtonMode: currentSettings.largeButtonMode,
    ttsEnabled: currentSettings.ttsEnabled,
    vibrationEnabled: currentSettings.vibrationEnabled,
    visualFlashingAlert: currentSettings.visualFlashingAlert,
    confirmationSafeguard: currentSettings.confirmationSafeguard
  });

  if (!isOpen) return null;

  const handleSelectLanguage = (lang: SupportedLanguage) => {
    setSelectedLang(lang);
    I18nService.setLanguage(lang);
    I18nService.speakLanguagePreview(lang);
  };

  const toggleNeed = (needKey: string) => {
    let next: string[];
    if (needKey === 'none') {
      next = selectedNeeds.includes('none') ? [] : ['none'];
    } else {
      const filtered = selectedNeeds.filter(n => n !== 'none');
      if (filtered.includes(needKey)) {
        next = filtered.filter(n => n !== needKey);
      } else {
        next = [...filtered, needKey];
      }
    }
    setSelectedNeeds(next);

    // Regenerate recommendations
    const recommended = AccessibilityService.generateRecommendations(next);
    setConfig(prev => ({
      ...prev,
      ...recommended
    }));
  };

  const handleNext = () => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      // Generate recommendations when moving to step 3
      const recommended = AccessibilityService.generateRecommendations(selectedNeeds);
      setConfig(prev => ({
        ...prev,
        ...recommended
      }));
      setStep(3);
    } else {
      // Step 3: Complete
      onSaveSettings({
        language: selectedLang,
        selectedDisabilities: selectedNeeds,
        onboardingCompleted: true,
        ...config
      });
      sound.playSuccessChime();
      onClose();
    }
  };

  const needsList = [
    {
      id: 'hearing',
      label: t('hearingImpairment'),
      desc: 'Visual notifications, flashing beacons, vibration, captions without audio dependency',
      icon: Ear
    },
    {
      id: 'visual',
      label: t('visualImpairment'),
      desc: 'High-contrast dark mode, extra-large text, screen-reader announcements, spoken prompts',
      icon: Eye
    },
    {
      id: 'motor',
      label: t('limitedMovement'),
      desc: 'Large 80dp touch targets, generous spacing, simplified screens',
      icon: Hand
    },
    {
      id: 'tremors',
      label: t('tremors'),
      desc: 'Double-tap confirmation safeguards to prevent accidental clicks',
      icon: Sliders
    },
    {
      id: 'reading',
      label: t('difficultyReading'),
      desc: 'Spoken medicine reminders, plain language, one clear task per screen',
      icon: Volume2
    },
    {
      id: 'cognitive',
      label: t('cognitiveMemory'),
      desc: 'Automated repeat reminders, 48h guardian escalation, simple taken/not-taken status',
      icon: Brain
    },
    {
      id: 'speech',
      label: t('speechImpairment'),
      desc: 'Pure touch interaction with zero mandatory voice recognition',
      icon: MessageSquareOff
    },
    {
      id: 'none',
      label: t('noAssistance'),
      desc: 'Standard accessible layout with default touch controls',
      icon: CheckCircle2
    }
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
      className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-5"
    >
      <div
        className={`w-full max-w-xl rounded-2xl max-h-[92vh] flex flex-col shadow-2xl border ${
          config.highContrast
            ? 'bg-neutral-950 border-2 border-yellow-300 text-yellow-300'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-neutral-800 flex items-center justify-between">
          <div>
            <h2 id="onboarding-title" className="font-black text-lg">
              {t('accessibilitySetupTitle')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-yellow-200">
              {step === 1
                ? t('stepSelectLanguage')
                : step === 2
                ? t('stepSelectNeeds')
                : t('stepReviewRecommendations')}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 focus:outline-none"
            aria-label="Close setup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard Steps Content */}
        <div className="flex-1 overflow-y-auto p-5 text-xs space-y-4">
          {/* STEP 1: LANGUAGE SELECTION */}
          {step === 1 && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-700 dark:text-yellow-100">
                {t('selectLanguage')}:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {LANGUAGES.map(lang => {
                  const isSelected = selectedLang === lang.code;
                  return (
                    <div
                      key={lang.code}
                      onClick={() => handleSelectLanguage(lang.code)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') handleSelectLanguage(lang.code);
                      }}
                      className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between min-h-[58px] ${
                        isSelected
                          ? config.highContrast
                            ? 'bg-neutral-900 border-2 border-yellow-300 text-yellow-300'
                            : 'bg-teal-50 border-2 border-teal-700 text-teal-950 shadow-sm'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div>
                        <div className="font-black text-base">{lang.nativeName}</div>
                        <div className="text-xs text-slate-500 dark:text-yellow-200">
                          {lang.name} · {lang.status === 'FULLY_SUPPORTED' ? t('fullySupported') : 'Regional'}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          handleSelectLanguage(lang.code);
                        }}
                        className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 text-slate-700 dark:text-yellow-200 shrink-0"
                        title={t('languageSpokenPreview')}
                        aria-label={`Listen to ${lang.name}`}
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: ASSISTANCE NEEDS MULTI-SELECT */}
          {step === 2 && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-700 dark:text-yellow-100">
                Which accessibility needs apply to the patient or guardian? (Select all that apply)
              </p>

              <div className="space-y-2">
                {needsList.map(item => {
                  const Icon = item.icon;
                  const isChecked = selectedNeeds.includes(item.id);

                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleNeed(item.id)}
                      role="checkbox"
                      aria-checked={isChecked}
                      tabIndex={0}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') toggleNeed(item.id);
                      }}
                      className={`p-3.5 rounded-xl border cursor-pointer flex items-start gap-3 transition-all min-h-[56px] ${
                        isChecked
                          ? config.highContrast
                            ? 'bg-neutral-900 border-2 border-yellow-300 text-yellow-300'
                            : 'bg-teal-50/80 border-2 border-teal-700 text-teal-950'
                          : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-md border flex items-center justify-center shrink-0 mt-0.5 ${
                          isChecked
                            ? 'bg-teal-700 text-white border-teal-700'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isChecked && <Check className="w-4 h-4" />}
                      </div>

                      <div className="flex-1">
                        <div className="font-black text-sm flex items-center gap-1.5">
                          <Icon className="w-4 h-4 text-teal-700 dark:text-yellow-300" />
                          <span>{item.label}</span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-yellow-200 mt-0.5">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: REVIEW SMART RECOMMENDATIONS */}
          {step === 3 && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-teal-50 dark:bg-neutral-900 border border-teal-200 dark:border-yellow-300">
                <span className="font-bold text-teal-900 dark:text-yellow-200 block text-sm flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-teal-700" />
                  <span>Customized Interface Recommendations</span>
                </span>
                <p className="text-xs text-teal-800 dark:text-yellow-100 mt-1">
                  Based on your selections, we have enabled the following features. You can modify any setting now or later.
                </p>
              </div>

              <div className="space-y-2">
                {/* Large Buttons */}
                <label className="p-3 rounded-xl border flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="font-bold text-sm block">{t('largeButtonMode')}</span>
                    <span className="text-xs text-slate-500">{t('largeButtonModeDesc')}</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.largeButtonMode}
                    onChange={e => setConfig({ ...config, largeButtonMode: e.target.checked })}
                    className="w-5 h-5 rounded text-teal-700"
                  />
                </label>

                {/* High Contrast */}
                <label className="p-3 rounded-xl border flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="font-bold text-sm block">{t('highContrast')}</span>
                    <span className="text-xs text-slate-500">WCAG AAA deep black &amp; bright yellow palette</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.highContrast}
                    onChange={e => setConfig({ ...config, highContrast: e.target.checked })}
                    className="w-5 h-5 rounded text-teal-700"
                  />
                </label>

                {/* Simplified Mode */}
                <label className="p-3 rounded-xl border flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="font-bold text-sm block">{t('simplifiedMode')}</span>
                    <span className="text-xs text-slate-500">{t('simplifiedModeDesc')}</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.simplifiedMode}
                    onChange={e => setConfig({ ...config, simplifiedMode: e.target.checked })}
                    className="w-5 h-5 rounded text-teal-700"
                  />
                </label>

                {/* Tremor Safeguard */}
                <label className="p-3 rounded-xl border flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="font-bold text-sm block">{t('tremorSafeguard')}</span>
                    <span className="text-xs text-slate-500">{t('tremorSafeguardDesc')}</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.confirmationSafeguard}
                    onChange={e => setConfig({ ...config, confirmationSafeguard: e.target.checked })}
                    className="w-5 h-5 rounded text-teal-700"
                  />
                </label>

                {/* Spoken Reminders */}
                <label className="p-3 rounded-xl border flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="font-bold text-sm block">{t('speechVoice')}</span>
                    <span className="text-xs text-slate-500">{t('speechVoiceDesc')}</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.ttsEnabled}
                    onChange={e => setConfig({ ...config, ttsEnabled: e.target.checked })}
                    className="w-5 h-5 rounded text-teal-700"
                  />
                </label>

                {/* Vibration */}
                <label className="p-3 rounded-xl border flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="font-bold text-sm block">{t('vibration')}</span>
                    <span className="text-xs text-slate-500">{t('vibrationDesc')}</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.vibrationEnabled}
                    onChange={e => setConfig({ ...config, vibrationEnabled: e.target.checked })}
                    className="w-5 h-5 rounded text-teal-700"
                  />
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer Controls */}
        <div className="p-4 border-t border-slate-200 dark:border-neutral-800 flex items-center justify-between gap-2">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="px-4 py-2.5 rounded-xl border font-bold text-xs flex items-center gap-1.5 hover:bg-slate-50 min-h-[44px]"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              {t('skipForNow')}
            </button>
          )}

          <button
            type="button"
            onClick={handleNext}
            className="px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-md min-h-[48px]"
          >
            <span>{step === 3 ? t('finishSetup') : t('continue')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
