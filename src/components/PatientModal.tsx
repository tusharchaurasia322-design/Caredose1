// src/components/PatientModal.tsx
import React, { useState } from 'react';
import { PatientProfile } from '../services/db';
import { LANGUAGES, SupportedLanguage, t } from '../services/i18n';
import { AccessibilitySettings } from '../services/accessibility';
import { UserPlus, X, Phone, Calendar, Globe, Sparkles } from 'lucide-react';

interface PatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSavePatient: (patient: PatientProfile) => Promise<void>;
  settings: AccessibilitySettings;
}

export const PatientModal: React.FC<PatientModalProps> = ({
  isOpen,
  onClose,
  onSavePatient,
  settings,
}) => {
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [phone, setPhone] = useState('');
  const [preferredLang, setPreferredLang] = useState<SupportedLanguage>(settings.language);
  const [highContrast, setHighContrast] = useState(settings.highContrast);
  const [largeFont, setLargeFont] = useState(settings.fontSize !== 'NORMAL');
  const [screenReaderVoice, setScreenReaderVoice] = useState(settings.ttsEnabled);
  const [vibrationAlert, setVibrationAlert] = useState(settings.vibrationEnabled);
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    try {
      const newPatient: PatientProfile = {
        id: 'patient_' + Date.now(),
        name: name.trim(),
        dob: dob.trim() || undefined,
        phone: phone.trim() || undefined,
        preferredLanguage: preferredLang,
        highContrast,
        largeFont,
        screenReaderVoice,
        vibrationAlert,
        lastQualifyingCheckIn: Date.now(),
        createdAt: Date.now()
      };

      await onSavePatient(newPatient);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const isExtraLarge = settings.fontSize === 'EXTRA_LARGE';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="patient-modal-title"
      className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
    >
      <div
        className={`w-full max-w-lg rounded-3xl p-6 max-h-[92vh] overflow-y-auto space-y-4 shadow-2xl border ${
          settings.highContrast
            ? 'bg-neutral-950 border-2 border-yellow-300 text-yellow-300'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2.5 rounded-2xl ${
                settings.highContrast ? 'bg-yellow-300 text-black' : 'bg-teal-100 text-teal-800'
              }`}
            >
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 id="patient-modal-title" className={`font-black ${isExtraLarge ? 'text-2xl' : 'text-lg'}`}>
                {t('addNewPatient')}
              </h2>
              <p className="text-xs text-slate-500 dark:text-yellow-200">
                {t('addNewPatientDesc')}
              </p>
            </div>
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

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Patient Name */}
          <div>
            <label className="block font-bold text-xs mb-1">
              {t('patientName')} <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Ramesh Patel, Sunita Sharma"
              value={name}
              onChange={e => setName(e.target.value)}
              className={`w-full rounded-xl border p-3 text-sm transition-colors ${
                settings.highContrast
                  ? 'bg-neutral-900 border-yellow-300 text-yellow-300 placeholder-yellow-600'
                  : 'bg-slate-50 border-slate-300 focus:bg-white focus:border-teal-600'
              }`}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Phone Number */}
            <div>
              <label className="block font-bold text-xs mb-1">
                {t('phoneNumber')} (for guardian alerts &amp; direct calling)
              </label>
              <div className="relative">
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className={`w-full rounded-xl border p-3 pl-9 text-sm ${
                    settings.highContrast
                      ? 'bg-neutral-900 border-yellow-300 text-yellow-300'
                      : 'bg-slate-50 border-slate-300'
                  }`}
                />
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              </div>
            </div>

            {/* Date of Birth / Age */}
            <div>
              <label className="block font-bold text-xs mb-1">{t('dob')}</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. 1952-05-14 or Age 72"
                  value={dob}
                  onChange={e => setDob(e.target.value)}
                  className={`w-full rounded-xl border p-3 pl-9 text-sm ${
                    settings.highContrast
                      ? 'bg-neutral-900 border-yellow-300 text-yellow-300'
                      : 'bg-slate-50 border-slate-300'
                  }`}
                />
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              </div>
            </div>
          </div>

          {/* Preferred Language */}
          <div>
            <label className="block font-bold text-xs mb-1 flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-teal-600" />
              <span>Preferred Language (Independent per patient)</span>
            </label>
            <select
              value={preferredLang}
              onChange={e => setPreferredLang(e.target.value as SupportedLanguage)}
              className={`w-full rounded-xl border p-3 text-sm ${
                settings.highContrast
                  ? 'bg-neutral-900 border-yellow-300 text-yellow-300'
                  : 'bg-slate-50 border-slate-300'
              }`}
            >
              {LANGUAGES.map(lang => (
                <option key={lang.code} value={lang.code}>
                  {lang.nativeName} ({lang.name})
                </option>
              ))}
            </select>
          </div>

          {/* Patient Accessibility Presets */}
          <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-neutral-800 space-y-2.5">
            <span className="font-bold text-xs uppercase tracking-wider text-slate-500 block">
              Patient Accessibility Accommodations
            </span>

            <label className="flex items-center justify-between cursor-pointer">
              <span>{t('highContrast')}</span>
              <input
                type="checkbox"
                checked={highContrast}
                onChange={e => setHighContrast(e.target.checked)}
                className="w-4 h-4 rounded text-teal-700"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span>{t('largeText')}</span>
              <input
                type="checkbox"
                checked={largeFont}
                onChange={e => setLargeFont(e.target.checked)}
                className="w-4 h-4 rounded text-teal-700"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span>{t('speechVoice')}</span>
              <input
                type="checkbox"
                checked={screenReaderVoice}
                onChange={e => setScreenReaderVoice(e.target.checked)}
                className="w-4 h-4 rounded text-teal-700"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span>{t('vibration')}</span>
              <input
                type="checkbox"
                checked={vibrationAlert}
                onChange={e => setVibrationAlert(e.target.checked)}
                className="w-4 h-4 rounded text-teal-700"
              />
            </label>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={saving || !name.trim()}
            style={{ minHeight: settings.largeButtonMode ? '64px' : '52px' }}
            className={`w-full py-3.5 px-4 rounded-2xl font-black text-sm uppercase tracking-wider transition-all shadow-md active:scale-98 ${
              settings.highContrast
                ? 'bg-yellow-300 text-black hover:bg-yellow-200'
                : 'bg-teal-700 text-white hover:bg-teal-800'
            }`}
          >
            {saving ? 'Saving...' : t('savePatient')}
          </button>
        </form>
      </div>
    </div>
  );
};
