// src/components/Header.tsx
import React from 'react';
import { Volume2, VolumeX, Eye, BookOpen, User, Users, ShieldCheck, Sliders, Globe, HelpCircle } from 'lucide-react';
import { PatientProfile } from '../services/db';
import { AccessibilitySettings } from '../services/accessibility';
import { I18nService, t } from '../services/i18n';

interface HeaderProps {
  settings: AccessibilitySettings;
  appMode: 'PATIENT' | 'GUARDIAN' | 'DUAL';
  setAppMode: (mode: 'PATIENT' | 'GUARDIAN' | 'DUAL') => void;
  activePatient: PatientProfile | null;
  patients?: PatientProfile[];
  onSelectPatient?: (p: PatientProfile) => void;
  onOpenAddPatient?: () => void;
  onOpenAuditGuide: () => void;
  onOpenAccessibilitySettings: () => void;
  onToggleTts: () => void;
  onToggleHighContrast: () => void;
  onOpenHelp?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  appMode,
  setAppMode,
  activePatient,
  patients = [],
  onSelectPatient,
  onOpenAddPatient,
  onOpenAuditGuide,
  onOpenAccessibilitySettings,
  onToggleTts,
  onToggleHighContrast,
  onOpenHelp,
}) => {
  const currentLang = I18nService.getLanguageInfo(settings.language);

  return (
    <header
      className={`sticky top-0 z-30 px-4 py-3 shadow-md transition-colors ${
        settings.highContrast
          ? 'bg-neutral-950 border-b-2 border-yellow-300 text-yellow-300'
          : 'bg-teal-800 text-white'
      }`}
    >
      <div className="max-w-2xl mx-auto flex items-center justify-between gap-2">
        {/* Brand identity */}
        <div className="flex items-center gap-2.5">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xl shadow-sm ${
              settings.highContrast ? 'bg-yellow-300 text-black' : 'bg-white text-teal-800'
            }`}
          >
            C
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-tight text-lg leading-none">
                {t('appName')}
              </span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                  settings.highContrast
                    ? 'bg-yellow-300/20 text-yellow-300 border border-yellow-300'
                    : 'bg-teal-700 text-teal-100'
                }`}
              >
                {t('zeroCostBadge')}
              </span>
            </div>
            <p className={`text-[11px] leading-tight opacity-90 ${settings.highContrast ? 'text-yellow-200' : 'text-teal-100'}`}>
              {t('tagline')}
            </p>
          </div>
        </div>

        {/* Accessibility & Specs Buttons */}
        <div className="flex items-center gap-1.5">
          {/* Language Switcher Quick Trigger */}
          <button
            type="button"
            onClick={onOpenAccessibilitySettings}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 min-h-[40px] ${
              settings.highContrast
                ? 'bg-neutral-900 border border-yellow-300 text-yellow-300'
                : 'bg-teal-700/80 hover:bg-teal-700 text-white'
            }`}
            title="Language"
            aria-label="Change Language"
          >
            <Globe className="w-4 h-4" />
            <span className="font-black text-xs">{currentLang.nativeName}</span>
          </button>

          {/* Full Accessibility Settings Trigger */}
          <button
            type="button"
            onClick={onOpenAccessibilitySettings}
            className={`p-2 rounded-xl text-xs font-bold transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center ${
              settings.highContrast
                ? 'bg-yellow-300 text-black font-extrabold'
                : 'bg-teal-700/80 hover:bg-teal-700 text-white'
            }`}
            title={t('accessibilitySettings')}
            aria-label={t('accessibilitySettings')}
          >
            <Sliders className="w-4 h-4" />
          </button>

          {/* High Contrast Toggle */}
          <button
            type="button"
            onClick={onToggleHighContrast}
            className={`p-2 rounded-xl text-xs font-bold transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center ${
              settings.highContrast
                ? 'bg-yellow-300 text-black font-extrabold'
                : 'bg-teal-700/80 hover:bg-teal-700 text-white'
            }`}
            title={t('highContrast')}
            aria-label={t('highContrast')}
          >
            <Eye className="w-4 h-4" />
          </button>

          {/* Specs / Guide Trigger */}
          <button
            type="button"
            onClick={onOpenAuditGuide}
            className={`p-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 min-h-[40px] ${
              settings.highContrast
                ? 'bg-neutral-900 border border-yellow-300 text-yellow-300 hover:bg-neutral-800'
                : 'bg-teal-700/80 hover:bg-teal-700 text-white'
            }`}
            title="Zero-Cost Architecture & Android Native Specs"
            aria-label="View Specs and Guide"
          >
            <BookOpen className="w-4 h-4" />
          </button>

          {/* Help & Feedback */}
          {onOpenHelp && (
            <button
              type="button"
              onClick={onOpenHelp}
              className={`p-2 rounded-xl text-xs font-bold transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center ${
                settings.highContrast
                  ? 'bg-neutral-900 border border-yellow-300 text-yellow-300 hover:bg-neutral-800'
                  : 'bg-teal-700/80 hover:bg-teal-700 text-white'
              }`}
              title="Help & Problem/Suggestion Feedback"
              aria-label="Help and Feedback"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Role Navigation Bar */}
      <div className="max-w-2xl mx-auto mt-2 pt-2 border-t border-teal-700/50 flex items-center justify-between flex-wrap gap-2 text-xs">
        <div className="flex items-center gap-1.5">
          <span className={`opacity-80 ${settings.highContrast ? 'text-yellow-200' : 'text-teal-200'}`}>
            {t('patient')}:
          </span>
          {patients.length > 1 && onSelectPatient ? (
            <select
              value={activePatient?.id}
              onChange={e => {
                const found = patients.find(p => p.id === e.target.value);
                if (found) onSelectPatient(found);
              }}
              className={`font-black rounded-lg px-2 py-0.5 border text-xs ${
                settings.highContrast
                  ? 'bg-neutral-900 border-yellow-300 text-yellow-300'
                  : 'bg-teal-900 border-teal-600 text-white'
              }`}
            >
              {patients.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          ) : activePatient ? (
            <span className="font-bold underline decoration-dotted">{activePatient.name}</span>
          ) : (
            <button
              type="button"
              onClick={onOpenAddPatient}
              className={`font-bold underline flex items-center gap-1 text-xs ${
                settings.highContrast ? 'text-yellow-300' : 'text-amber-200 hover:text-white'
              }`}
            >
              + {t('addPatientInfo')}
            </button>
          )}
        </div>

        <div className="flex items-center p-0.5 rounded-lg bg-black/20">
          <button
            type="button"
            onClick={() => setAppMode('PATIENT')}
            aria-pressed={appMode === 'PATIENT'}
            className={`px-3 py-1 rounded text-xs font-bold transition-all min-h-[32px] ${
              appMode === 'PATIENT'
                ? settings.highContrast
                  ? 'bg-yellow-300 text-black'
                  : 'bg-white text-teal-800 shadow'
                : 'text-white/80 hover:text-white'
            }`}
          >
            <span className="flex items-center gap-1">
              <User className="w-3.5 h-3.5 inline" />
              {t('patient')}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setAppMode('GUARDIAN')}
            aria-pressed={appMode === 'GUARDIAN'}
            className={`px-3 py-1 rounded text-xs font-bold transition-all min-h-[32px] ${
              appMode === 'GUARDIAN'
                ? settings.highContrast
                  ? 'bg-yellow-300 text-black'
                  : 'bg-white text-teal-800 shadow'
                : 'text-white/80 hover:text-white'
            }`}
          >
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 inline" />
              {t('guardian')}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setAppMode('DUAL')}
            aria-pressed={appMode === 'DUAL'}
            className={`px-3 py-1 rounded text-xs font-bold transition-all min-h-[32px] ${
              appMode === 'DUAL'
                ? settings.highContrast
                  ? 'bg-yellow-300 text-black'
                  : 'bg-amber-400 text-neutral-900 shadow font-extrabold'
                : 'text-white/80 hover:text-white'
            }`}
            title="Inspect Patient & Guardian coordination side-by-side"
          >
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5 inline" />
              {t('dualMode')}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
