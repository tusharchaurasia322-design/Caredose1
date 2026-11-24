// src/components/MedicinesTab.tsx
import React, { useState } from 'react';
import { Medicine } from '../services/db';
import { Pill, Plus, Trash2, Clock, Bell, AlertTriangle, RefreshCw, Check, Calendar, TrendingDown } from 'lucide-react';
import { t } from '../services/i18n';

interface MedicinesTabProps {
  medicines: Medicine[];
  highContrast: boolean;
  largeText: boolean;
  onOpenAddModal: () => void;
  onDeleteMedicine: (id: string) => Promise<void>;
  onTriggerTestPrompt: (med: Medicine) => void;
  onRefillMedicine?: (id: string, amount: number) => Promise<void>;
}

export const MedicinesTab: React.FC<MedicinesTabProps> = ({
  medicines,
  highContrast,
  largeText,
  onOpenAddModal,
  onDeleteMedicine,
  onTriggerTestPrompt,
  onRefillMedicine,
}) => {
  const [refillActiveMedId, setRefillActiveMedId] = useState<string | null>(null);
  const [customRefillAmount, setCustomRefillAmount] = useState<number>(20);

  const handleQuickAdd = async (medId: string, amount: number) => {
    if (onRefillMedicine) {
      await onRefillMedicine(medId, amount);
      setRefillActiveMedId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`font-bold ${largeText ? 'text-xl' : 'text-base'}`}>Medication Cabinet</h2>
          <p className="text-xs text-slate-500 dark:text-yellow-200">
            {medicines.length} Configured Regimen{medicines.length === 1 ? '' : 's'} · Inventory Tracked
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenAddModal}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs transition-all active:scale-95 min-h-[36px] ${
            highContrast
              ? 'bg-yellow-300 text-black hover:bg-yellow-200'
              : 'bg-teal-700 text-white hover:bg-teal-800'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Medicine</span>
        </button>
      </div>

      {medicines.length === 0 ? (
        <div
          className={`text-center py-10 px-4 rounded-xl border-2 border-dashed ${
            highContrast
              ? 'bg-neutral-950 border-yellow-300 text-yellow-300'
              : 'bg-white border-slate-200 text-slate-500'
          }`}
        >
          <Pill className="w-8 h-8 mx-auto mb-2 text-teal-600 opacity-60" />
          <p className="font-semibold text-sm mb-1">Your cabinet is empty</p>
          <p className="text-xs max-w-xs mx-auto mb-3">
            Add your prescriptions or daily supplements with tablet count to start receiving automated reminders.
          </p>
          <button
            type="button"
            onClick={onOpenAddModal}
            className="px-3 py-1.5 bg-teal-700 text-white text-xs font-bold rounded-lg shadow"
          >
            + Add First Medication
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {medicines.map(m => {
            const stock = m.totalStock !== undefined ? m.totalStock : 20;
            const isLowStock = stock <= (m.lowStockThreshold || 5);
            const dailyDoses = m.scheduledTimes && m.scheduledTimes.length > 0 ? m.scheduledTimes.length : 1;
            const daysRemaining = dailyDoses > 0 ? Math.floor(stock / dailyDoses) : 0;

            const targetDate = new Date();
            targetDate.setDate(targetDate.getDate() + daysRemaining);
            const formattedDueDate = targetDate.toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            });

            const isUrgentRefill = stock === 0 || daysRemaining <= 3;

            return (
              <div
                key={m.id}
                className={`p-4 rounded-xl border transition-all ${
                  highContrast
                    ? 'bg-neutral-900 border-yellow-300 text-yellow-300'
                    : 'bg-white border-slate-200 text-slate-800 shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {m.photoBlobUri ? (
                      <img
                        src={m.photoBlobUri}
                        alt={m.name}
                        className="w-14 h-14 rounded-lg object-cover border border-slate-300 shrink-0"
                      />
                    ) : (
                      <div
                        className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${
                          highContrast
                            ? 'bg-yellow-300 text-black'
                            : m.pillColor === 'Red'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-teal-50 text-teal-700'
                        }`}
                      >
                        <Pill className="w-6 h-6" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className={`font-black tracking-tight ${largeText ? 'text-lg' : 'text-base'}`}>
                          {m.name}
                        </h3>
                        {/* Tablet Stock Badge */}
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black border ${
                            isLowStock
                              ? 'bg-amber-100 border-amber-400 text-amber-950 animate-pulse'
                              : 'bg-emerald-100 border-emerald-300 text-emerald-900'
                          }`}
                        >
                          <Pill className="w-3.5 h-3.5" />
                          <span>
                            {isLowStock ? '⚠️ Low: ' : ''}
                            {stock} Tablets Available
                          </span>
                        </span>
                      </div>

                      <p className="text-xs font-bold text-slate-600 dark:text-yellow-200 mt-0.5">
                        {m.dosage} {m.pillColor && `· ${m.pillColor}`}
                      </p>

                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {m.scheduledTimes.map(time => (
                          <span
                            key={time}
                            className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-yellow-200"
                          >
                            {time}
                          </span>
                        ))}
                      </div>

                      {/* REFILL DUE ESTIMATION BANNER */}
                      <div className={`mt-2 p-2.5 rounded-lg border text-xs flex items-center justify-between gap-2 flex-wrap ${
                        isUrgentRefill
                          ? highContrast
                            ? 'bg-neutral-950 border-2 border-yellow-300 text-yellow-300'
                            : 'bg-amber-50 border-amber-300 text-amber-950 dark:bg-neutral-900 dark:text-amber-300'
                          : highContrast
                          ? 'bg-neutral-950 border border-yellow-400/50 text-yellow-200'
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}>
                        <div className="flex items-center gap-1.5">
                          <Calendar className={`w-3.5 h-3.5 shrink-0 ${isUrgentRefill ? 'text-amber-600 dark:text-yellow-300' : 'text-teal-600'}`} />
                          <span className="font-extrabold">
                            {stock === 0 ? (
                              '⚠️ Refill Overdue: 0 Tablets Left'
                            ) : daysRemaining <= 0 ? (
                              '⚠️ Refill Due Today (< 1 day remaining)'
                            ) : daysRemaining === 1 ? (
                              `⚠️ Refill Due Tomorrow (${formattedDueDate})`
                            ) : (
                              `Refill Due: ${formattedDueDate}`
                            )}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-[11px] opacity-90">
                          <span className="font-medium">
                            Rate: <strong>{dailyDoses} dose{dailyDoses > 1 ? 's' : ''}/day</strong>
                          </span>
                          <span>·</span>
                          <span>
                            <strong>{daysRemaining} day{daysRemaining === 1 ? '' : 's'}</strong> supply
                          </span>
                        </div>
                      </div>

                      {m.instructions && (
                        <p className="text-[11px] text-slate-500 dark:text-yellow-300 mt-1.5 leading-snug">
                          {m.instructions}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onDeleteMedicine(m.id)}
                    className="text-slate-400 hover:text-rose-600 p-1 shrink-0"
                    title="Delete medication"
                    aria-label={`Delete ${m.name}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Stock Refill Controls Banner */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-neutral-800 flex items-center justify-between flex-wrap gap-2 text-[11px]">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-slate-500 dark:text-yellow-200">Refill Stock:</span>
                    <button
                      type="button"
                      onClick={() => handleQuickAdd(m.id, 10)}
                      className="px-2 py-0.5 rounded-md bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold active:scale-95 transition-all"
                      title="Add 10 tablets"
                    >
                      +10
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickAdd(m.id, 20)}
                      className="px-2 py-0.5 rounded-md bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold active:scale-95 transition-all"
                      title="Add 20 tablets (standard strip)"
                    >
                      +20
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickAdd(m.id, 30)}
                      className="px-2 py-0.5 rounded-md bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold active:scale-95 transition-all"
                      title="Add 30 tablets"
                    >
                      +30
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setRefillActiveMedId(refillActiveMedId === m.id ? null : m.id)
                      }
                      className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                    >
                      {refillActiveMedId === m.id ? 'Close' : 'Custom'}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => onTriggerTestPrompt(m)}
                    className="text-teal-700 dark:text-yellow-300 hover:underline font-bold"
                  >
                    Test Due Prompt
                  </button>
                </div>

                {/* Custom Refill Expanded Row */}
                {refillActiveMedId === m.id && (
                  <div className="mt-2 p-2.5 rounded-lg bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold">Add tablets:</span>
                      <input
                        type="number"
                        min="1"
                        value={customRefillAmount}
                        onChange={e => setCustomRefillAmount(parseInt(e.target.value) || 0)}
                        className="w-16 p-1 text-center font-bold text-xs rounded border border-slate-300 dark:border-neutral-600 bg-white dark:bg-neutral-900"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleQuickAdd(m.id, customRefillAmount)}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold"
                    >
                      Save Refill
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
