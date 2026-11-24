// src/components/AddChoiceModal.tsx
import React from 'react';
import { UserPlus, Pill, X, Sparkles, ShieldCheck } from 'lucide-react';
import { t } from '../services/i18n';
import { AccessibilitySettings } from '../services/accessibility';

interface AddChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAddPatient: () => void;
  onSelectAddGuardian?: () => void;
  onSelectAddMedication: () => void;
  settings: AccessibilitySettings;
}

export const AddChoiceModal: React.FC<AddChoiceModalProps> = ({
  isOpen,
  onClose,
  onSelectAddPatient,
  onSelectAddGuardian,
  onSelectAddMedication,
  settings,
}) => {
  if (!isOpen) return null;

  const isExtraLarge = settings.fontSize === 'EXTRA_LARGE';
  const isLarge = settings.fontSize === 'LARGE' || isExtraLarge;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-choice-title"
      className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
    >
      <div
        className={`w-full max-w-md rounded-3xl p-6 shadow-2xl border space-y-4 ${
          settings.highContrast
            ? 'bg-neutral-950 border-2 border-yellow-300 text-yellow-300'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-neutral-800">
          <div>
            <h2 id="add-choice-title" className={`font-black ${isExtraLarge ? 'text-2xl' : 'text-lg'}`}>
              {t('whatWouldYouLikeToAdd')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-yellow-200 mt-0.5">
              Select an option below to proceed
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 focus:outline-none"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* The Main Large Accessible Buttons */}
        <div className="space-y-3 pt-1">
          {/* Button 1: Add New Patient */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onSelectAddPatient();
            }}
            style={{ minHeight: settings.largeButtonMode ? '84px' : '72px' }}
            className={`w-full p-4 rounded-2xl border-2 text-left flex items-center gap-4 transition-all shadow-md active:scale-98 focus-visible:ring-4 focus-visible:ring-teal-400 ${
              settings.highContrast
                ? 'bg-neutral-900 border-yellow-300 text-yellow-300 hover:bg-neutral-800'
                : 'bg-teal-50/70 border-teal-600 text-teal-950 hover:bg-teal-100/80'
            }`}
          >
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                settings.highContrast
                  ? 'bg-yellow-300 text-black'
                  : 'bg-teal-700 text-white'
              }`}
            >
              <UserPlus className="w-7 h-7" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black px-2 py-0.5 rounded bg-teal-200/60 dark:bg-yellow-300 dark:text-black uppercase">
                  1
                </span>
                <span className={`font-black tracking-tight ${isExtraLarge ? 'text-xl' : 'text-base'}`}>
                  {t('addNewPatient')}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-yellow-200 mt-1 leading-snug">
                {t('addNewPatientDesc')}
              </p>
            </div>
          </button>

          {/* Button 2: Add Designated Guardian */}
          {onSelectAddGuardian && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onSelectAddGuardian();
              }}
              style={{ minHeight: settings.largeButtonMode ? '84px' : '72px' }}
              className={`w-full p-4 rounded-2xl border-2 text-left flex items-center gap-4 transition-all shadow-md active:scale-98 focus-visible:ring-4 focus-visible:ring-blue-400 ${
                settings.highContrast
                  ? 'bg-neutral-900 border-yellow-300 text-yellow-300 hover:bg-neutral-800'
                  : 'bg-blue-50/70 border-blue-600 text-blue-950 hover:bg-blue-100/80'
              }`}
            >
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                  settings.highContrast
                    ? 'bg-yellow-300 text-black'
                    : 'bg-blue-700 text-white'
                }`}
              >
                <ShieldCheck className="w-7 h-7" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black px-2 py-0.5 rounded bg-blue-200/60 dark:bg-yellow-300 dark:text-black uppercase">
                    2
                  </span>
                  <span className={`font-black tracking-tight ${isExtraLarge ? 'text-xl' : 'text-base'}`}>
                    Add Designated Guardian
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-yellow-200 mt-1 leading-snug">
                  Pair caregiver device for zero-cost Bluetooth and Wi-Fi emergency escalation
                </p>
              </div>
            </button>
          )}

          {/* Button 3: New Medication */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onSelectAddMedication();
            }}
            style={{ minHeight: settings.largeButtonMode ? '84px' : '72px' }}
            className={`w-full p-4 rounded-2xl border-2 text-left flex items-center gap-4 transition-all shadow-md active:scale-98 focus-visible:ring-4 focus-visible:ring-emerald-400 ${
              settings.highContrast
                ? 'bg-neutral-900 border-yellow-300 text-yellow-300 hover:bg-neutral-800'
                : 'bg-emerald-50/70 border-emerald-600 text-emerald-950 hover:bg-emerald-100/80'
            }`}
          >
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                settings.highContrast
                  ? 'bg-yellow-300 text-black'
                  : 'bg-emerald-700 text-white'
              }`}
            >
              <Pill className="w-7 h-7" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black px-2 py-0.5 rounded bg-emerald-200/60 dark:bg-yellow-300 dark:text-black uppercase">
                  3
                </span>
                <span className={`font-black tracking-tight ${isExtraLarge ? 'text-xl' : 'text-base'}`}>
                  {t('addNewMedication')}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-yellow-200 mt-1 leading-snug">
                {t('addNewMedicationDesc')}
              </p>
            </div>
          </button>
        </div>

        {/* Cancel button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 rounded-xl border border-slate-200 dark:border-neutral-800 text-xs font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-neutral-900"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};
