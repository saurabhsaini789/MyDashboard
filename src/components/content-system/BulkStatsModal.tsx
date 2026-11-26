"use client";

import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { STAT_METRICS, type BusinessChannel, type ChannelStat } from '@/types/business';
import { brandName, daysSinceStat, headlineMetric, localDateStr, statAgeLabel } from '@/lib/content-system';
import { PlatformLogo } from './PlatformLogo';

interface Props {
  /** Accounts to log, usually the ones with no stats in 30+ days. */
  accounts: BusinessChannel[];
  stats: ChannelStat[];
  onAdd: (entries: ChannelStat[]) => void;
  onClose: () => void;
}

const input = 'w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 px-3 py-2 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-white/10';
const label = 'text-[10px] font-bold text-zinc-400 uppercase px-1';
const METRICS = STAT_METRICS.filter(m => m !== 'Other');

/** One form to log a number for several accounts at once. Empty rows are skipped. */
export function BulkStatsModal({ accounts, stats, onAdd, onClose }: Props) {
  const [date, setDate] = useState(localDateStr());
  const [metrics, setMetrics] = useState<Record<string, string>>(() => Object.fromEntries(
    accounts.map(a => {
      const m = headlineMetric(stats, a) || (a.platform.toLowerCase() === 'youtube' ? 'Subscribers' : 'Followers');
      return [a.id, METRICS.includes(m) ? m : 'Followers'];
    }),
  ));
  const [values, setValues] = useState<Record<string, string>>({});
  const [error, setError] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const entries: ChannelStat[] = [];
    for (const a of accounts) {
      const raw = (values[a.id] || '').replace(/,/g, '').trim();
      if (!raw) continue;
      const num = Number(raw);
      if (!isFinite(num) || num < 0) { setError(`${brandName(a)} · ${a.platform}: enter a number, like 12400`); return; }
      entries.push({ id: crypto.randomUUID(), channelId: a.id, metric: metrics[a.id], value: num, date, createdAt: new Date().toISOString() });
    }
    if (!entries.length) { setError('Fill in at least one number'); return; }
    onAdd(entries);
    onClose();
  };

  const filled = accounts.filter(a => (values[a.id] || '').trim()).length;

  return (
    <Modal isOpen onClose={onClose} title="Log stats" onSubmit={submit} submitText={filled ? `Save ${filled} ${filled === 1 ? 'entry' : 'entries'}` : 'Save'} accentColor="zinc">
      <div className="flex flex-col gap-1.5 sm:w-48">
        <span className={label}>Date for all</span>
        <input type="date" value={date} max={localDateStr()} onChange={e => setDate(e.target.value)} className={input} />
      </div>
      <div className="divide-y divide-zinc-100 dark:divide-zinc-800 -mt-2">
        {accounts.map(a => (
          <div key={a.id} className="py-3 grid grid-cols-[auto_1fr] sm:grid-cols-[auto_1fr_9rem_8rem] items-center gap-x-3 gap-y-2">
            <PlatformLogo platform={a.platform} size={26} />
            <div className="min-w-0">
              <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">{brandName(a)}</div>
              <div className="text-[11px] font-medium text-zinc-400 truncate">{a.platform} · {statAgeLabel(daysSinceStat(stats, a.id))}</div>
            </div>
            <select
              value={metrics[a.id]}
              onChange={e => setMetrics(m => ({ ...m, [a.id]: e.target.value }))}
              aria-label={`Metric for ${brandName(a)} on ${a.platform}`}
              className={`${input} col-start-2 sm:col-start-auto`}
            >
              {METRICS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <input
              inputMode="numeric"
              value={values[a.id] || ''}
              onChange={e => { setValues(v => ({ ...v, [a.id]: e.target.value })); setError(''); }}
              placeholder="12400"
              aria-label={`Value for ${brandName(a)} on ${a.platform}`}
              className={`${input} col-start-2 sm:col-start-auto`}
            />
          </div>
        ))}
      </div>
      {error && <div className="text-xs font-bold text-rose-500 -mt-4">{error}</div>}
    </Modal>
  );
}
