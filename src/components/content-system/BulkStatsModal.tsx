"use client";

import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import type { BusinessChannel, ChannelStat } from '@/types/business';
import { brandName, daysSinceStat, localDateStr, statAgeLabel } from '@/lib/content-system';
import { PERIOD_LABEL } from '@/lib/content-metrics';
import { PlatformLogo } from './PlatformLogo';
import { MetricInputs, parseMetricValues } from './MetricInputs';

interface Props {
  /** Accounts to log, usually the ones with no stats in 30+ days. */
  accounts: BusinessChannel[];
  stats: ChannelStat[];
  onAdd: (entries: ChannelStat[]) => void;
  onClose: () => void;
}

/** One form to log a full snapshot for several accounts at once. Blank fields and accounts are skipped. */
export function BulkStatsModal({ accounts, stats, onAdd, onClose }: Props) {
  const [date, setDate] = useState(localDateStr());
  const [values, setValues] = useState<Record<string, Record<string, string>>>({});
  const [error, setError] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date().toISOString();
    const entries: ChannelStat[] = [];
    for (const a of accounts) {
      const { parsed, error: bad } = parseMetricValues(values[a.id] || {});
      if (bad) { setError(`${brandName(a)} · ${a.platform} — ${bad}`); return; }
      for (const [metric, value] of Object.entries(parsed)) {
        entries.push({ id: crypto.randomUUID(), channelId: a.id, metric, value, date, createdAt: now });
      }
    }
    if (!entries.length) { setError('Fill in at least one number'); return; }
    onAdd(entries);
    onClose();
  };

  const filledAccounts = accounts.filter(a => Object.values(values[a.id] || {}).some(v => v.trim())).length;

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Log stats"
      onSubmit={submit}
      submitText={filledAccounts ? `Save ${filledAccounts} ${filledAccounts === 1 ? 'account' : 'accounts'}` : 'Save'}
      accentColor="zinc"
      maxWidth="max-w-4xl"
    >
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-[10px] font-bold text-zinc-400 uppercase px-1">Date for all</span>
          <input type="date" value={date} max={localDateStr()} onChange={e => setDate(e.target.value)}
            className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 px-3 py-2 rounded-xl text-sm font-medium outline-none" />
        </label>
        <p className="text-[11px] text-zinc-400 pb-2 max-w-md">Fill in what you have; blanks are skipped. For activity, copy the <b>{PERIOD_LABEL}</b> figure.</p>
      </div>
      {error && <div className="text-xs font-bold text-rose-500 -mt-2">{error}</div>}
      <div className="space-y-6">
        {accounts.map(a => (
          <div key={a.id} className="rounded-2xl border border-zinc-100 dark:border-zinc-800 p-4">
            <div className="flex items-center gap-3 mb-3">
              <PlatformLogo platform={a.platform} size={26} />
              <div className="min-w-0">
                <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">{brandName(a)}</div>
                <div className="text-[11px] font-medium text-zinc-400 truncate">{a.platform} · {statAgeLabel(daysSinceStat(stats, a.id))}</div>
              </div>
            </div>
            <MetricInputs
              channel={a}
              stats={stats}
              compact
              values={values[a.id] || {}}
              onChange={(m, v) => { setValues(x => ({ ...x, [a.id]: { ...(x[a.id] || {}), [m]: v } })); setError(''); }}
            />
          </div>
        ))}
      </div>
    </Modal>
  );
}
