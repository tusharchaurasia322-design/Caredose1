// src/components/MedicineModal.tsx
import React, { useState } from 'react';
import { Medicine } from '../services/db';
import { Camera, Plus, Trash2, X, Pill, Check, Clock } from 'lucide-react';
import { t } from '../services/i18n';

interface MedicineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (med: Partial<Medicine>) => Promise<void>;
  patientId: string;
  highContrast: boolean;
  largeText: boolean;
}

export const MedicineModal: React.FC<MedicineModalProps> = ({
  isOpen,
  onClose,
  onSave,
  patientId,
  highContrast,
  largeText,
}) => {
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('1 Tablet');
  const [totalStock, setTotalStock] = useState<number>(20); // Default 20 tablets (e.g. Red tablet example)
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(5);
  const [unitType, setUnitType] = useState<string>('tablets');
  const [scheduledTimes, setScheduledTimes] = useState<string[]>(['08:00']);
  const [newTime, setNewTime] = useState('13:00');
  const [instructions, setInstructions] = useState('Take with a full glass of water after food');
  const [photoBlobUri, setPhotoBlobUri] = useState<string>('');
  const [pillColor, setPillColor] = useState('Red');
  const [remind30MinBefore, setRemind30MinBefore] = useState(true);
  const [enableEarlyReminder, setEnableEarlyReminder] = useState(true);
  const [reminderMinutesBefore, setReminderMinutesBefore] = useState<number>(30); // minimum limit 1 min, maximum suggested 30 min
  const [remind5MinBefore, setRemind5MinBefore] = useState(true);
  const [alertAfter5MinMissed, setAlertAfter5MinMissed] = useState(true);
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoBlobUri(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addTime = (timeToAdd: string) => {
    if (!scheduledTimes.includes(timeToAdd)) {
      setScheduledTimes([...scheduledTimes, timeToAdd].sort());
    }
  };

  const removeTime = (timeToRemove: string) => {
    if (scheduledTimes.length > 1) {
      setScheduledTimes(scheduledTimes.filter(t => t !== timeToRemove));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    try {
      await onSave({
        patientId,
        name: name.trim(),
        dosage: dosage.trim() || '1 Tablet',
        instructions: instructions.trim(),
        scheduledTimes,
        startDate: new Date().toISOString().split('T')[0],
        photoBlobUri: photoBlobUri || undefined,
        pillColor,
        isActive: true,
        remind30MinBefore: enableEarlyReminder && reminderMinutesBefore === 30,
        remind5MinBefore,
        reminderMinutesBefore: enableEarlyReminder ? Math.max(1, reminderMinutesBefore) : undefined,
        alertAfter5MinMissed,
        totalStock: Math.max(0, totalStock),
        lowStockThreshold,
        unitType
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
    >
      <div
        className={`w-full max-w-lg rounded-t-3xl sm:rounded-2xl max-h-[92vh] overflow-y-auto p-5 space-y-4 shadow-2xl border ${
          highContrast
            ? 'bg-neutral-950 border-2 border-yellow-300 text-yellow-300'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${highContrast ? 'bg-yellow-300 text-black' : 'bg-teal-100 text-teal-800'}`}>
              <Pill className="w-5 h-5" />
            </div>
            <div>
              <h2 id="modal-title" className="font-bold text-lg">
                {t('scheduleMedicine')}
              </h2>
              <p className="text-xs text-slate-500 dark:text-yellow-200">
                {t('tagline')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 focus:outline-none"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Medication Name */}
          <div>
            <label className="block font-bold text-xs mb-1">
              {t('medName')} <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g., Lisinopril, Metformin, Atorvastatin"
              value={name}
              onChange={e => setName(e.target.value)}
              className={`w-full rounded-lg border p-2.5 text-sm transition-colors ${
                highContrast
                  ? 'bg-neutral-900 border-yellow-300 text-yellow-300 placeholder-yellow-600'
                  : 'bg-slate-50 border-slate-300 focus:bg-white focus:border-teal-600'
              }`}
            />
          </div>

          {/* Dosage & Quick suggestions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-xs mb-1">{t('dosage')}</label>
              <input
                type="text"
                placeholder="e.g., 10mg, 1 Tablet, 5ml"
                value={dosage}
                onChange={e => setDosage(e.target.value)}
                className={`w-full rounded-lg border p-2.5 text-sm ${
                  highContrast
                    ? 'bg-neutral-900 border-yellow-300 text-yellow-300'
                    : 'bg-slate-50 border-slate-300 focus:bg-white focus:border-teal-600'
                }`}
              />
            </div>

            <div>
              <label className="block font-bold text-xs mb-1">Pill Color / Look</label>
              <select
                value={pillColor}
                onChange={e => setPillColor(e.target.value)}
                className={`w-full rounded-lg border p-2.5 text-sm ${
                  highContrast
                    ? 'bg-neutral-900 border-yellow-300 text-yellow-300'
                    : 'bg-slate-50 border-slate-300'
                }`}
              >
                <option value="Red">Red Tablet / Pill</option>
                <option value="White">White Round Tablet</option>
                <option value="Yellow">Yellow Capsule</option>
                <option value="Pink">Pink Oval Pill</option>
                <option value="Blue">Blue Capsule</option>
                <option value="Green">Green Tablet</option>
                <option value="Liquid">Liquid / Syrup</option>
              </select>
            </div>
          </div>

          {/* TOTAL TABLETS PRESENT (INVENTORY COUNTING) */}
          <div
            className={`p-3.5 rounded-2xl border transition-all ${
              highContrast
                ? 'bg-neutral-900 border-yellow-300 text-yellow-300'
                : 'bg-emerald-50/70 border-emerald-300 text-emerald-950 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-black text-xs flex items-center gap-1.5">
                <Pill className="w-4 h-4 text-emerald-700 dark:text-yellow-300" />
                <span>Total Tablets Present (Starting Count)</span>
              </label>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-200 text-emerald-900 dark:bg-yellow-300 dark:text-black">
                Auto-Deducts on YES
              </span>
            </div>

            <p className="text-[11px] leading-relaxed opacity-90 mb-3">
              Enter total tablets in your current bottle or strip (e.g. <strong>20</strong> Red tablets).
              Every time you take your dose, CareDose counts down (<strong>20 ➔ 19</strong>) and reports your remaining tablets in the confirmation message!
            </p>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setTotalStock(Math.max(0, totalStock - 1))}
                className="w-12 h-12 rounded-xl bg-white dark:bg-neutral-800 border-2 border-emerald-300 dark:border-yellow-300 font-black text-xl flex items-center justify-center hover:bg-emerald-100 active:scale-95 transition-all"
                aria-label="Decrease tablet count by 1"
              >
                −
              </button>

              <div className="flex-1 relative">
                <input
                  type="number"
                  min="0"
                  value={totalStock}
                  onChange={e => setTotalStock(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full text-center font-black text-2xl py-2 px-3 rounded-xl border-2 border-emerald-400 dark:border-yellow-300 bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-yellow-200 block text-center mt-0.5">
                  Tablets Available Now
                </span>
              </div>

              <button
                type="button"
                onClick={() => setTotalStock(totalStock + 1)}
                className="w-12 h-12 rounded-xl bg-white dark:bg-neutral-800 border-2 border-emerald-300 dark:border-yellow-300 font-black text-xl flex items-center justify-center hover:bg-emerald-100 active:scale-95 transition-all"
                aria-label="Increase tablet count by 1"
              >
                +
              </button>
            </div>

            {/* Quick Strip Presets */}
            <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
              <span className="text-[10px] font-bold opacity-80">Presets:</span>
              {[10, 15, 20, 30, 60].map(cnt => (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => setTotalStock(cnt)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all active:scale-95 ${
                    totalStock === cnt
                      ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                      : 'bg-white hover:bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-neutral-800 dark:text-yellow-200 dark:border-yellow-300'
                  }`}
                >
                  {cnt} {cnt === 20 ? '(e.g. Red Tab)' : 'Tablets'}
                </button>
              ))}
            </div>
          </div>

          {/* Scheduled Times */}
          <div>
            <label className="block font-bold text-xs mb-1">Scheduled Times (24h or AM/PM)</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {scheduledTimes.map(time => (
                <div
                  key={time}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-bold text-sm ${
                    highContrast
                      ? 'bg-neutral-900 border-yellow-300 text-yellow-300'
                      : 'bg-teal-50 border-teal-200 text-teal-900'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>{time}</span>
                  {scheduledTimes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTime(time)}
                      className="ml-1 text-slate-400 hover:text-rose-600"
                      aria-label={`Remove time ${time}`}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Quick preset buttons */}
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-[10px] text-slate-500 mr-1">Presets:</span>
              <button
                type="button"
                onClick={() => addTime('08:00')}
                className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-[11px] font-semibold text-slate-700"
              >
                + Morning 08:00
              </button>
              <button
                type="button"
                onClick={() => addTime('13:00')}
                className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-[11px] font-semibold text-slate-700"
              >
                + Lunch 13:00
              </button>
              <button
                type="button"
                onClick={() => addTime('20:00')}
                className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-[11px] font-semibold text-slate-700"
              >
                + Night 20:00
              </button>
            </div>

            {/* Custom time picker */}
            <div className="flex items-center gap-2 mt-2">
              <input
                type="time"
                value={newTime}
                onChange={e => setNewTime(e.target.value)}
                className={`rounded-lg border p-2 text-sm ${
                  highContrast ? 'bg-neutral-900 border-yellow-300 text-yellow-300' : 'border-slate-300'
                }`}
              />
              <button
                type="button"
                onClick={() => addTime(newTime)}
                className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-bold text-xs flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Time
              </button>
            </div>
          </div>

          {/* Instructions */}
          <div>
            <label className="block font-bold text-xs mb-1">{t('instructions')}</label>
            <input
              type="text"
              placeholder="e.g., Take with food. Do not crush."
              value={instructions}
              onChange={e => setInstructions(e.target.value)}
              className={`w-full rounded-lg border p-2.5 text-sm ${
                highContrast
                  ? 'bg-neutral-900 border-yellow-300 text-yellow-300'
                  : 'bg-slate-50 border-slate-300'
              }`}
            />
          </div>

          {/* Bottle / Strip Photo Upload */}
          <div>
            <label className="block font-bold text-xs mb-1">
              {t('bottlePhoto')} (Stored locally in IndexedDB)
            </label>
            <div className="flex items-center gap-3">
              {photoBlobUri ? (
                <div className="relative w-16 h-16 rounded-lg overflow-hidden border">
                  <img src={photoBlobUri} alt="Pill preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setPhotoBlobUri('')}
                    className="absolute top-0 right-0 p-1 bg-black/60 text-white rounded-bl"
                    aria-label="Remove photo"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-slate-400 hover:bg-slate-50 text-slate-600 font-medium">
                  <Camera className="w-4 h-4 text-teal-600" />
                  <span>Snap Photo / Upload</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoCapture}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Escalation & Custom Early Reminder Offsets */}
          <div className="pt-2 border-t border-slate-100 dark:border-neutral-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="block font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-yellow-200">
                Local Reminder Triggers
              </span>
              <span className="text-[10px] font-bold text-teal-700 dark:text-yellow-300">
                Zero Cloud Fees
              </span>
            </div>

            {/* CUSTOM EARLY REMINDER CONTROL (1 min to 30 min suggested) */}
            <div className={`p-3 rounded-xl border space-y-2.5 transition-colors ${
              highContrast
                ? 'bg-neutral-900 border-yellow-300'
                : 'bg-teal-50/70 border-teal-200 text-teal-950'
            }`}>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-xs">
                  <input
                    type="checkbox"
                    checked={enableEarlyReminder}
                    onChange={e => setEnableEarlyReminder(e.target.checked)}
                    className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                  />
                  <span>Early Chime & Notification Before Due Time</span>
                </label>
                {enableEarlyReminder && (
                  <span className="text-[11px] font-mono font-black px-2 py-0.5 rounded bg-teal-200/80 text-teal-900 dark:bg-yellow-300 dark:text-black">
                    {reminderMinutesBefore} min before
                  </span>
                )}
              </div>

              {enableEarlyReminder && (
                <div className="space-y-2 pl-6 pt-1 border-t border-teal-200/60 dark:border-neutral-800">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-700 dark:text-yellow-200">
                      Early Notice Lead Time:
                    </span>
                    <span className="text-slate-500 dark:text-yellow-300 text-[10px]">
                      (Min: 1 min · Max Suggested: 30 min)
                    </span>
                  </div>

                  {/* Preset Quick Chips */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[
                      { mins: 1, label: '1 min' },
                      { mins: 5, label: '5 min' },
                      { mins: 10, label: '10 min' },
                      { mins: 15, label: '15 min' },
                      { mins: 30, label: '30 min (Suggested)' }
                    ].map(chip => (
                      <button
                        key={chip.mins}
                        type="button"
                        onClick={() => setReminderMinutesBefore(chip.mins)}
                        className={`px-2 py-1 rounded-lg text-[11px] font-bold border transition-all active:scale-95 ${
                          reminderMinutesBefore === chip.mins
                            ? highContrast
                              ? 'bg-yellow-300 text-black border-yellow-300'
                              : 'bg-teal-700 text-white border-teal-800 shadow-xs'
                            : 'bg-white hover:bg-teal-100 text-teal-900 border-teal-300 dark:bg-neutral-800 dark:text-yellow-200'
                        }`}
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>

                  {/* Range Slider & Manual Custom Input */}
                  <div className="grid grid-cols-[1fr_auto] items-center gap-3 pt-1">
                    <input
                      type="range"
                      min="1"
                      max="30"
                      step="1"
                      value={Math.min(30, Math.max(1, reminderMinutesBefore))}
                      onChange={e => setReminderMinutesBefore(parseInt(e.target.value) || 1)}
                      className="w-full accent-teal-600 dark:accent-yellow-300 cursor-pointer"
                      title="Adjust early reminder minutes (1 to 30 min suggested)"
                    />
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="1"
                        max="120"
                        value={reminderMinutesBefore}
                        onChange={e => {
                          const val = parseInt(e.target.value);
                          setReminderMinutesBefore(isNaN(val) ? 1 : Math.max(1, val));
                        }}
                        className={`w-16 p-1 text-center font-bold text-xs rounded border ${
                          highContrast
                            ? 'bg-neutral-900 border-yellow-300 text-yellow-300'
                            : 'bg-white border-teal-300 text-teal-950'
                        }`}
                        title="Enter custom minutes before due time (minimum 1 min)"
                      />
                      <span className="text-[11px] font-bold text-slate-500 dark:text-yellow-300">
                        min
                      </span>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-500 dark:text-yellow-300 italic">
                    * Suggested maximum is 30 minutes, but you can set any custom time (minimum 1 min).
                  </p>
                </div>
              )}
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={remind5MinBefore}
                onChange={e => setRemind5MinBefore(e.target.checked)}
                className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
              />
              <span>Immediate modal prompt &amp; speech announcement at scheduled time</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={alertAfter5MinMissed}
                onChange={e => setAlertAfter5MinMissed(e.target.checked)}
                className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
              />
              <span>
                Escalate to Missed Dose &amp; queue guardian alert if unanswered after +5 minutes
              </span>
            </label>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={saving || !name.trim()}
            className={`w-full py-3.5 px-4 rounded-xl font-black text-sm uppercase tracking-wider transition-all shadow-md active:scale-98 min-h-[48px] ${
              highContrast
                ? 'bg-yellow-300 text-black hover:bg-yellow-200'
                : 'bg-teal-700 text-white hover:bg-teal-800'
            }`}
          >
            {saving ? 'Saving...' : t('saveMedicine')}
          </button>
        </form>
      </div>
    </div>
  );
};
