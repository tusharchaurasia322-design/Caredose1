import React, { useState, useMemo } from 'react';
import { AlertLogItem, DoseEvent } from '../services/db';
import {
  History,
  Download,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Clock,
  ShieldCheck,
  FileText,
  BarChart2,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend
} from 'recharts';

interface HistoryTabProps {
  alertLogs: AlertLogItem[];
  doseEvents: DoseEvent[];
  highContrast: boolean;
  largeText: boolean;
}

export const HistoryTab: React.FC<HistoryTabProps> = ({
  alertLogs,
  doseEvents,
  highContrast,
  largeText,
}) => {
  const [filterType, setFilterType] = useState<string>('ALL');

  // Compute past 7 days adherence metrics for Recharts bar chart
  const last7DaysData = useMemo(() => {
    const days: Array<{
      dateKey: string;
      dayName: string;
      confirmed: number;
      missed: number;
      total: number;
      adherenceRate: number;
    }> = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      const dayName = i === 0 ? 'Today' : d.toLocaleDateString(undefined, { weekday: 'short', month: 'numeric', day: 'numeric' });

      const dayEvents = doseEvents.filter(event => {
        const eventDate = new Date(event.scheduledTime).toISOString().split('T')[0];
        return eventDate === dateKey;
      });

      const confirmed = dayEvents.filter(e => e.status === 'CONFIRMED_YES').length;
      const missed = dayEvents.filter(e => e.status === 'MISSED' || e.status === 'CONFIRMED_NO').length;
      const total = confirmed + missed;
      const adherenceRate = total > 0 ? Math.round((confirmed / total) * 100) : (confirmed > 0 ? 100 : 0);

      days.push({
        dateKey,
        dayName,
        confirmed,
        missed,
        total,
        adherenceRate
      });
    }

    return days;
  }, [doseEvents]);

  const total7DayConfirmed = last7DaysData.reduce((acc, d) => acc + d.confirmed, 0);
  const total7DayMissed = last7DaysData.reduce((acc, d) => acc + d.missed, 0);
  const total7DayTotal = total7DayConfirmed + total7DayMissed;
  const overall7DayRate = total7DayTotal > 0 ? Math.round((total7DayConfirmed / total7DayTotal) * 100) : (total7DayConfirmed > 0 ? 100 : 0);

  const filteredLogs = alertLogs.filter(item => {
    if (filterType === 'ALL') return true;
    return item.type === filterType;
  });

  const exportAuditLog = () => {
    const data = {
      exportDate: new Date().toISOString(),
      adherence7Days: last7DaysData,
      alerts: alertLogs,
      doses: doseEvents
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `caredose-audit-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Header and Export */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className={`font-black ${largeText ? 'text-2xl' : 'text-lg'}`}>Patient Adherence & Audit Trail</h2>
          <p className="text-xs text-slate-500 dark:text-yellow-200">
            7-day medication compliance analytics and cryptographically verifiable audit trail
          </p>
        </div>

        <button
          type="button"
          onClick={exportAuditLog}
          className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-yellow-300 bg-white dark:bg-neutral-900 text-xs font-bold hover:bg-slate-50 flex items-center gap-1.5 shadow-xs transition-transform active:scale-95"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Audit</span>
        </button>
      </div>

      {/* 7-DAY ADHERENCE RECHARTS BAR CHART SECTION */}
      <section
        className={`p-4 sm:p-5 rounded-2xl border transition-all ${
          highContrast
            ? 'bg-neutral-900 border-2 border-yellow-300 text-yellow-300'
            : 'bg-white border-slate-200 text-slate-800 shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-xl ${highContrast ? 'bg-yellow-300 text-black' : 'bg-teal-100 text-teal-800'}`}>
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`font-black ${largeText ? 'text-lg' : 'text-sm'}`}>
                7-Day Adherence Trends
              </h3>
              <p className="text-xs text-slate-500 dark:text-yellow-200">
                Visualizing confirmed vs. missed doses over the past 7 days
              </p>
            </div>
          </div>

          {/* Quick Metrics Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className={`px-3 py-1 rounded-xl text-xs font-black flex items-center gap-1.5 border ${
              overall7DayRate >= 80
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-neutral-800 dark:text-emerald-400'
                : overall7DayRate >= 50
                ? 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-neutral-800 dark:text-amber-400'
                : 'bg-rose-50 text-rose-800 border-rose-300 dark:bg-neutral-800 dark:text-rose-400'
            }`}>
              {overall7DayRate >= 80 ? (
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              ) : (
                <TrendingDown className="w-4 h-4 text-rose-600" />
              )}
              <span>{overall7DayRate}% 7-Day Adherence</span>
            </div>

            <span className="text-[11px] font-bold text-slate-500 dark:text-yellow-200">
              ({total7DayConfirmed} taken / {total7DayMissed} missed)
            </span>
          </div>
        </div>

        {/* Recharts Responsive Container */}
        <div className="w-full h-64 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={last7DaysData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={highContrast ? '#444' : '#e2e8f0'}
                vertical={false}
              />
              <XAxis
                dataKey="dayName"
                tick={{ fontSize: 11, fill: highContrast ? '#facc15' : '#64748b' }}
                stroke={highContrast ? '#666' : '#cbd5e1'}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: highContrast ? '#facc15' : '#64748b' }}
                stroke={highContrast ? '#666' : '#cbd5e1'}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div
                        className={`p-3 rounded-xl shadow-xl border text-xs space-y-1 ${
                          highContrast
                            ? 'bg-neutral-950 border-yellow-300 text-yellow-300'
                            : 'bg-white border-slate-200 text-slate-900'
                        }`}
                      >
                        <p className="font-black text-sm">{label}</p>
                        <p className="text-emerald-600 dark:text-yellow-300 font-bold">
                          ✓ Confirmed: {data.confirmed} dose{data.confirmed === 1 ? '' : 's'}
                        </p>
                        <p className="text-rose-600 dark:text-rose-400 font-bold">
                          ✕ Missed / Declined: {data.missed} dose{data.missed === 1 ? '' : 's'}
                        </p>
                        <p className="pt-1 border-t border-slate-100 dark:border-neutral-800 text-[11px] font-mono opacity-80">
                          Day Adherence: {data.adherenceRate}%
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                formatter={(value) => (
                  <span className={highContrast ? 'text-yellow-300 font-bold' : 'text-slate-700 font-bold'}>
                    {value}
                  </span>
                )}
              />
              <Bar
                dataKey="confirmed"
                name="Confirmed Doses"
                fill={highContrast ? '#facc15' : '#0d9488'}
                radius={[4, 4, 0, 0]}
                barSize={20}
              />
              <Bar
                dataKey="missed"
                name="Missed / Declined"
                fill={highContrast ? '#ef4444' : '#f43f5e'}
                radius={[4, 4, 0, 0]}
                barSize={20}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
        <button
          type="button"
          onClick={() => setFilterType('ALL')}
          className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
            filterType === 'ALL'
              ? 'bg-teal-700 text-white shadow-xs'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-neutral-800 dark:text-yellow-200'
          }`}
        >
          All ({alertLogs.length})
        </button>
        <button
          type="button"
          onClick={() => setFilterType('MISSED_DOSE')}
          className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
            filterType === 'MISSED_DOSE'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-neutral-800 dark:text-yellow-200'
          }`}
        >
          Missed Doses
        </button>
        <button
          type="button"
          onClick={() => setFilterType('DOSE_DECLINED')}
          className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
            filterType === 'DOSE_DECLINED'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-neutral-800 dark:text-yellow-200'
          }`}
        >
          Declined
        </button>
        <button
          type="button"
          onClick={() => setFilterType('SILENCE_48H_ESCALATION')}
          className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
            filterType === 'SILENCE_48H_ESCALATION'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-neutral-800 dark:text-yellow-200'
          }`}
        >
          48h Escalations
        </button>
      </div>

      {/* Log list */}
      {filteredLogs.length === 0 ? (
        <div
          className={`p-8 rounded-xl border text-center text-xs text-slate-500 ${
            highContrast ? 'bg-neutral-950 border-yellow-300' : 'bg-white border-slate-200'
          }`}
        >
          <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="font-semibold">No alerts recorded in this category</p>
          <p className="mt-1">All events will be chronologically documented here without cloud dependency.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredLogs.map(item => {
            const isMissed = item.type === 'MISSED_DOSE';
            const isDeclined = item.type === 'DOSE_DECLINED';
            const isEscalation = item.type === 'SILENCE_48H_ESCALATION';
            const isAck = item.status === 'ACKNOWLEDGED';

            return (
              <div
                key={item.id}
                className={`p-3.5 rounded-xl border text-xs transition-all ${
                  highContrast
                    ? 'bg-neutral-900 border-yellow-300 text-yellow-300'
                    : isAck
                    ? 'bg-white border-slate-200 text-slate-800 shadow-xs'
                    : 'bg-rose-50/60 border-rose-200 text-slate-800 shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`font-black text-[10px] px-2 py-0.5 rounded uppercase tracking-wider ${
                        isMissed
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : isDeclined
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : isEscalation
                          ? 'bg-purple-100 text-purple-800 border border-purple-300'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {item.type}
                    </span>

                    <span className="text-slate-400">·</span>

                    <span className="font-semibold text-slate-600 dark:text-yellow-200">
                      Channel: {item.channelUsed}
                    </span>
                  </div>

                  <span
                    className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      isAck
                        ? 'bg-emerald-100 text-emerald-800'
                        : item.status === 'DELIVERED'
                        ? 'bg-blue-100 text-blue-800'
                        : item.status === 'QUEUED'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                <p className="mt-2 text-slate-700 dark:text-yellow-100 font-medium leading-relaxed">
                  {item.details}
                </p>

                <div className="mt-2 pt-2 border-t border-slate-100 dark:border-neutral-800 flex items-center justify-between text-[10px] text-slate-400 dark:text-yellow-300">
                  <span>ID: {item.id}</span>
                  <span>{new Date(item.timestamp).toLocaleString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
