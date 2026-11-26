"use client";

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import type { BusinessChannel, ChannelStat, MetricKind } from '@/types/business';
import { accountMetrics, PERIOD_LABEL, snapshots } from '@/lib/content-metrics';

interface Props {
  channel: BusinessChannel;
  stats: ChannelStat[];
  values: Record<string, string>;
  onChange: (metric: string, value: string) => void;
  /** Adds a metric this platform's preset doesn't have. */
  onAddMetric?: (name: string, kind: MetricKind) => void;
  /** Tighter grid for the bulk form. */
  compact?: boolean;
}

const input = 'w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 px-3 py-2 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-white/10 tabular-nums';
const label = 'text-[10px] font-bold text-zinc-400 uppercase px-1 truncate';

/** Every metric for one account, grouped into running totals and last-28-days activity. Last values show as hints. */
export function MetricInputs({ channel, stats, values, onChange, onAddMetric, compact = false }: Props) {
  const metrics = accountMetrics(channel, stats);
  const last = snapshots(stats, channel.id);
  const hint = (m: string) => last.find(s => s.values[m] !== undefined)?.values[m];
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newKind, setNewKind] = useState<MetricKind>('period');

  const grid = compact ? 'grid grid-cols-2 sm:grid-cols-4 gap-2' : 'grid grid-cols-2 sm:grid-cols-3 gap-3';
  const group = (kind: MetricKind, title: string) => {
    const list = metrics.filter(m => m.kind === kind);
    if (!list.length) return null;
    return (
      <div>
        <div className="mb-1.5 px-1 text-[10px] font-bold uppercase text-zinc-500 dark:text-zinc-400">{title}</div>
        <div className={grid}>
          {list.map(m => {
            const h = hint(m.name);
            return (
              <label key={m.name} className="flex flex-col gap-1 min-w-0">
                <span className={label}>{m.name}</span>
                <input
                  inputMode="decimal"
                  value={values[m.name] || ''}
                  onChange={e => onChange(m.name, e.target.value)}
                  placeholder={h !== undefined ? h.toLocaleString() : '—'}
                  aria-label={`${m.name}${kind === 'period' ? `, ${PERIOD_LABEL}` : ''} for ${channel.name} on ${channel.platform}`}
                  className={input}
                />
              </label>
            );
          })}
        </div>
      </div>
    );
  };

  const add = () => {
    const name = newName.trim();
    if (!name || !onAddMetric) return;
    onAddMetric(name, newKind);
    setNewName('');
    setAdding(false);
  };

  return (
    <div className="space-y-4">
      {group('total', 'Totals now')}
      {group('period', `Activity · ${PERIOD_LABEL}`)}
      {onAddMetric && (adding ? (
        <div className="flex flex-wrap items-center gap-2">
          <input autoFocus value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }} placeholder="Metric name, e.g. Link clicks" className={`${input} !w-56`} />
          <div className="flex rounded-xl bg-zinc-100 dark:bg-zinc-800 p-0.5">
            {([['total', 'Running total'], ['period', 'Last 28 days']] as const).map(([k, t]) => (
              <button key={k} type="button" onClick={() => setNewKind(k)} aria-pressed={newKind === k}
                className={`px-3 py-1.5 rounded-[10px] text-[11px] font-bold ${newKind === k ? 'bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 shadow-sm' : 'text-zinc-400'}`}>
                {t}
              </button>
            ))}
          </div>
          <button type="button" onClick={add} className="px-3 py-2 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-bold">Add</button>
          <button type="button" onClick={() => setAdding(false)} className="px-2 py-2 text-xs font-bold text-zinc-400">Cancel</button>
        </div>
      ) : (
        <button type="button" onClick={() => setAdding(true)} className="flex items-center gap-1 text-[11px] font-bold text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200">
          <Plus size={12} /> Add a metric
        </button>
      ))}
    </div>
  );
}

/** Turns filled inputs into numbers. Returns an error message for the first bad value. */
export function parseMetricValues(values: Record<string, string>): { parsed: Record<string, number>; error?: string } {
  const parsed: Record<string, number> = {};
  for (const [m, raw] of Object.entries(values)) {
    const v = raw.replace(/,/g, '').trim();
    if (!v) continue;
    const n = Number(v);
    if (!isFinite(n) || n < 0) return { parsed, error: `${m}: enter a number, like 12400` };
    parsed[m] = n;
  }
  return { parsed };
}
