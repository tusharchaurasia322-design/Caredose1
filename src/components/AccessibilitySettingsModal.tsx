// src/components/AccessibilitySettingsModal.tsx
import React, { useState } from 'react';
import { AccessibilityService, AccessibilitySettings } from '../services/accessibility';
import { LANGUAGES, SupportedLanguage, I18nService, t } from '../services/i18n';
import { sound, SpeechEngine } from '../services/audio';
import {
  X,
  Volume2,
  Sliders,
  RotateCcw,
  Eye,
  Check,
  Vibrate,
  ShieldCheck,
  Smartphone,
  Sparkles,
  HelpCircle,
  Move,
  Mic
} from 'lucide-react';

interface AccessibilitySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AccessibilitySettings;
  onUpdateSettings: (partial: Partial<AccessibilitySettings>) => void;
  onReopenOnboarding: () => void;
}

export const AccessibilitySettingsModal: React.FC<AccessibilitySettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onReopenOnboarding,
}) => {
  const [activeTab, setActiveTab] = useState<'CONTROLS' | 'LANGUAGE' | 'GUIDANCE'>('CONTROLS');
  const [testFeedback, setTestFeedback] = useState<string>('');

  if (!isOpen) return null;

  const handleLanguageChange = (lang: SupportedLanguage) => {
    onUpdateSettings({ language: lang });
    I18nService.speakLanguagePreview(lang);
  };

  const setFloatingPreset = (preset: 'BOTTOM_RIGHT' | 'BOTTOM_LEFT' | 'TOP_RIGHT' | 'TOP_LEFT') => {
    let pos = { x: 20, y: 120 };
    if (preset === 'BOTTOM_RIGHT') pos = { x: Math.max(10, window.innerWidth - 80), y: window.innerHeight - 150 };
    if (preset === 'BOTTOM_LEFT') pos = { x: 20, y: window.innerHeight - 150 };
    if (preset === 'TOP_RIGHT') pos = { x: Math.max(10, window.innerWidth - 80), y: 80 };
    if (preset === 'TOP_LEFT') pos = { x: 20, y: 80 };
    onUpdateSettings({ floatingBtnPosition: pos });
  };

  const handleTestAudioAndVibration = () => {
    sound.playReminderChime();
    sound.vibrate([200, 100, 200]);
    SpeechEngine.speak(
      I18nService.t('timeForMedicine') + '. Lisinopril 10mg. ' + I18nService.t('confirmTakenYes'),
      settings.ttsEnabled
    );
    setTestFeedback('Tested: chime, vibration, and spoken alert executed.');
    setTimeout(() => setTestFeedback(''), 4000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="accessibility-settings-title"
      className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-5"
    >
      <div
        className={`w-full max-w-2xl rounded-2xl max-h-[92vh] flex flex-col shadow-2xl border ${
          settings.highContrast
            ? 'bg-neutral-950 border-2 border-yellow-300 text-yellow-300'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-teal-600 dark:text-yellow-300" />
            <div>
              <h2 id="accessibility-settings-title" className="font-black text-lg">
                {t('accessibilitySettings')}
              </h2>
              <p className="text-xs text-slate-500 dark:text-yellow-200">
                Independent configuration for vision, hearing, motor control &amp; language
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 focus:outline-none"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab navigation */}
        <div className="flex items-center gap-1 px-5 pt-3 border-b border-slate-100 dark:border-neutral-800 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('CONTROLS')}
            className={`px-3 py-2 border-b-2 transition-colors ${
              activeTab === 'CONTROLS'
                ? 'border-teal-700 text-teal-700 dark:border-yellow-300 dark:text-yellow-300'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Display &amp; Motor
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('LANGUAGE')}
            className={`px-3 py-2 border-b-2 transition-colors ${
              activeTab === 'LANGUAGE'
                ? 'border-teal-700 text-teal-700 dark:border-yellow-300 dark:text-yellow-300'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {t('language')} ({I18nService.getLanguageInfo(settings.language).nativeName})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('GUIDANCE')}
            className={`px-3 py-2 border-b-2 transition-colors ${
              activeTab === 'GUIDANCE'
                ? 'border-teal-700 text-teal-700 dark:border-yellow-300 dark:text-yellow-300'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            TalkBack &amp; Assistive Tech
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 text-xs space-y-4">
          {/* TAB 1: CONTROLS */}
          {activeTab === 'CONTROLS' && (
            <div className="space-y-4">
              {/* Text Size Selection */}
              <div>
                <label className="font-bold text-sm block mb-1.5">Text Size &amp; Display Scale</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => onUpdateSettings({ fontSize: 'NORMAL' })}
                    className={`py-3 px-2 rounded-xl border font-bold text-xs flex flex-col items-center gap-1 ${
                      settings.fontSize === 'NORMAL'
                        ? 'bg-teal-700 text-white border-teal-700'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <span className="text-sm">Standard</span>
                    <span className="text-[10px] opacity-80">14-16px</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onUpdateSettings({ fontSize: 'LARGE' })}
                    className={`py-3 px-2 rounded-xl border font-bold text-xs flex flex-col items-center gap-1 ${
                      settings.fontSize === 'LARGE'
                        ? 'bg-teal-700 text-white border-teal-700'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <span className="text-base font-black">Large</span>
                    <span className="text-[10px] opacity-80">18-20px</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onUpdateSettings({ fontSize: 'EXTRA_LARGE' })}
                    className={`py-3 px-2 rounded-xl border font-bold text-xs flex flex-col items-center gap-1 ${
                      settings.fontSize === 'EXTRA_LARGE'
                        ? 'bg-teal-700 text-white border-teal-700'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <span className="text-lg font-black">Extra Large</span>
                    <span className="text-[10px] opacity-80">22-26px</span>
                  </button>
                </div>
              </div>

              {/* High Contrast */}
              <label className="p-3.5 rounded-xl border flex items-center justify-between cursor-pointer">
                <div>
                  <span className="font-bold text-sm block">{t('highContrast')}</span>
                  <span className="text-slate-500">
                    WCAG AAA compliant pure black background with high-visibility yellow and cyan accents.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.highContrast}
                  onChange={e => onUpdateSettings({ highContrast: e.target.checked })}
                  className="w-5 h-5 rounded text-teal-700"
                />
              </label>

              {/* Simplified Interface Mode */}
              <label className="p-3.5 rounded-xl border flex items-center justify-between cursor-pointer">
                <div>
                  <span className="font-bold text-sm block">{t('simplifiedMode')}</span>
                  <span className="text-slate-500">{t('simplifiedModeDesc')}</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.simplifiedMode}
                  onChange={e => onUpdateSettings({ simplifiedMode: e.target.checked })}
                  className="w-5 h-5 rounded text-teal-700"
                />
              </label>

              {/* Large Buttons Mode (64-80dp) */}
              <label className="p-3.5 rounded-xl border flex items-center justify-between cursor-pointer">
                <div>
                  <span className="font-bold text-sm block">{t('largeButtonMode')}</span>
                  <span className="text-slate-500">{t('largeButtonModeDesc')}</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.largeButtonMode}
                  onChange={e => onUpdateSettings({ largeButtonMode: e.target.checked })}
                  className="w-5 h-5 rounded text-teal-700"
                />
              </label>

              {/* Tremor Safeguard Double-Tap */}
              <label className="p-3.5 rounded-xl border flex items-center justify-between cursor-pointer">
                <div>
                  <span className="font-bold text-sm block">{t('tremorSafeguard')}</span>
                  <span className="text-slate-500">{t('tremorSafeguardDesc')}</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.confirmationSafeguard}
                  onChange={e => onUpdateSettings({ confirmationSafeguard: e.target.checked })}
                  className="w-5 h-5 rounded text-teal-700"
                />
              </label>

              {/* Speech Voice (TTS) */}
              <label className="p-3.5 rounded-xl border flex items-center justify-between cursor-pointer">
                <div>
                  <span className="font-bold text-sm block">{t('speechVoice')}</span>
                  <span className="text-slate-500">{t('speechVoiceDesc')}</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.ttsEnabled}
                  onChange={e => onUpdateSettings({ ttsEnabled: e.target.checked })}
                  className="w-5 h-5 rounded text-teal-700"
                />
              </label>

              {/* Hands-Free Voice Command Listener ("CareDose, I took my medicine") */}
              <label className="p-3.5 rounded-xl border flex items-center justify-between cursor-pointer bg-teal-50/40 dark:bg-yellow-950/20 border-teal-200 dark:border-yellow-300/40">
                <div className="space-y-0.5 pr-2">
                  <div className="flex items-center gap-1.5 font-bold text-sm text-teal-900 dark:text-yellow-300">
                    <Mic className="w-4 h-4 text-teal-700 dark:text-yellow-300" />
                    <span>{t('voiceCommands')}</span>
                  </div>
                  <span className="text-slate-600 dark:text-yellow-200 block text-xs">
                    {t('voiceCommandsDesc')}
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.voiceCommandsEnabled ?? true}
                  onChange={e => onUpdateSettings({ voiceCommandsEnabled: e.target.checked })}
                  className="w-5 h-5 rounded text-teal-700"
                />
              </label>

              {/* Vibration Alerts */}
              <label className="p-3.5 rounded-xl border flex items-center justify-between cursor-pointer">
                <div>
                  <span className="font-bold text-sm block">{t('vibration')}</span>
                  <span className="text-slate-500">{t('vibrationDesc')}</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.vibrationEnabled}
                  onChange={e => onUpdateSettings({ vibrationEnabled: e.target.checked })}
                  className="w-5 h-5 rounded text-teal-700"
                />
              </label>

              {/* Visual Flash Indicator */}
              <label className="p-3.5 rounded-xl border flex items-center justify-between cursor-pointer">
                <div>
                  <span className="font-bold text-sm block">{t('visualAlert')}</span>
                  <span className="text-slate-500">{t('visualAlertDesc')}</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.visualFlashingAlert}
                  onChange={e => onUpdateSettings({ visualFlashingAlert: e.target.checked })}
                  className="w-5 h-5 rounded text-teal-700"
                />
              </label>

              {/* Floating Button Placement Options */}
              <div className="p-3.5 rounded-xl border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm flex items-center gap-1.5">
                    <Move className="w-4 h-4 text-teal-700" />
                    <span>{t('floatingBtnPos')}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setFloatingPreset('BOTTOM_RIGHT')}
                    className="text-xs text-teal-700 hover:underline font-bold"
                  >
                    {t('resetBtnPos')}
                  </button>
                </div>
                <p className="text-slate-500 text-xs">
                  You can freely drag the accessibility button across the screen, or pick a preset if dragging is difficult:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setFloatingPreset('TOP_LEFT')}
                    className="p-2 rounded-lg border text-xs font-bold hover:bg-slate-50 text-center"
                  >
                    Top-Left
                  </button>
                  <button
                    type="button"
                    onClick={() => setFloatingPreset('TOP_RIGHT')}
                    className="p-2 rounded-lg border text-xs font-bold hover:bg-slate-50 text-center"
                  >
                    Top-Right
                  </button>
                  <button
                    type="button"
                    onClick={() => setFloatingPreset('BOTTOM_LEFT')}
                    className="p-2 rounded-lg border text-xs font-bold hover:bg-slate-50 text-center"
                  >
                    Bottom-Left
                  </button>
                  <button
                    type="button"
                    onClick={() => setFloatingPreset('BOTTOM_RIGHT')}
                    className="p-2 rounded-lg border text-xs font-bold hover:bg-slate-50 text-center"
                  >
                    Bottom-Right
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LANGUAGE SELECTION */}
          {activeTab === 'LANGUAGE' && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-700 dark:text-yellow-100">
                Supported Indian &amp; Regional Languages:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {LANGUAGES.map(lang => {
                  const isSelected = settings.language === lang.code;
                  const isTtsSupported = I18nService.isSpeechVoiceAvailable(lang.code);

                  return (
                    <div
                      key={lang.code}
                      onClick={() => handleLanguageChange(lang.code)}
                      role="button"
                      tabIndex={0}
                      className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between min-h-[58px] ${
                        isSelected
                          ? settings.highContrast
                            ? 'bg-neutral-900 border-2 border-yellow-300 text-yellow-300'
                            : 'bg-teal-50 border-2 border-teal-700 text-teal-950 shadow-sm'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div>
                        <div className="font-black text-base">{lang.nativeName}</div>
                        <div className="text-xs text-slate-500 dark:text-yellow-200">
                          {lang.name} · {lang.status === 'FULLY_SUPPORTED' ? t('fullySupported') : 'Fallback Mode'}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Voice: {isTtsSupported ? 'Available on device' : 'Audio tone fallback'}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          handleLanguageChange(lang.code);
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

          {/* TAB 3: TALKBACK & ASSISTIVE GUIDANCE */}
          {activeTab === 'GUIDANCE' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-slate-50 dark:bg-neutral-900 border rounded-xl text-slate-700 dark:text-yellow-200 space-y-2">
                <h4 className="font-bold text-sm text-slate-900 dark:text-yellow-100">
                  TalkBack &amp; Android Screen-Reader Compliance
                </h4>
                <p>
                  CareDose provides semantic HTML5 landmarks, explicit ARIA roles (<code className="font-mono">role="dialog"</code>, <code className="font-mono">aria-live="polite"</code>), and descriptive names on all critical controls.
                </p>
                <ul className="list-disc pl-4 space-y-1 text-xs">
                  <li><strong>YES / NO Dose Buttons:</strong> Announced with exact medicine name, scheduled time, and instruction details.</li>
                  <li><strong>Status Indicators:</strong> Not dependent on color alone; announces "Taken", "Pending", or "Missed" explicitly.</li>
                  <li><strong>Keyboard Navigation:</strong> Full Tab / Shift-Tab and Enter / Space navigation support.</li>
                  <li><strong>Switch Access:</strong> Sequential linear navigation through simplified cards.</li>
                </ul>
              </div>

              {/* Interactive test button */}
              <div className="p-3.5 border rounded-xl space-y-2">
                <span className="font-bold text-sm block">Live Accessibility Hardware Test</span>
                <p className="text-xs text-slate-500">
                  Trigger an instantaneous test to verify speech output, Web Audio tones, and vibration motor function on this device.
                </p>
                <button
                  type="button"
                  onClick={handleTestAudioAndVibration}
                  className="px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-xs"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>Test Sound, Speech &amp; Vibration Now</span>
                </button>
                {testFeedback && (
                  <p className="text-xs text-emerald-600 font-bold mt-1">{testFeedback}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-neutral-800 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onReopenOnboarding}
              className="text-xs text-teal-700 dark:text-yellow-300 font-bold hover:underline flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Run Setup Wizard</span>
            </button>
            <span className="text-slate-300">·</span>
            <button
              type="button"
              onClick={() => AccessibilityService.resetDefaults()}
              className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>{t('resetSettings')}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-black text-xs uppercase tracking-wider shadow-md min-h-[44px]"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
