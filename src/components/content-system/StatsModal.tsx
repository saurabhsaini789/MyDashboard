"use client";

import React, { useState } from 'react';
import { Download, Trash2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Modal } from '../ui/Modal';
import type { BusinessChannel, ChannelStat, MetricKind } from '@/types/business';
import { formatStat, headlineStat, localDateStr, type Brand } from '@/lib/content-system';
import { accountMetrics, engagementRate, PERIOD_LABEL, pctChange, snapshots, snapshotsCsv } from '@/lib/content-metrics';
import { PlatformLogo } from './PlatformLogo';
import { MetricInputs, parseMetricValues } from './MetricInputs';

interface Props {
  brand: Brand;
  initialChannel: BusinessChannel;
  stats: ChannelStat[];
  /** Saves a snapshot; entries for the same account, metric and day replace the old ones. */
  onAdd: (entries: ChannelStat[]) => void;
  onDelete: (ids: string[]) => void;
  onAddMetric: (channelId: string, name: string, kind: MetricKind) => void;
  onClose: () => void;
}

const label = 'text-[10px] font-bold text-zinc-400 uppercase px-1';
const ER = 'Engagement rate';

function Change({ value }: { value: number | null }) {
  if (value === null || !isFinite(value)) return <span className="text-zinc-300 dark:text-zinc-600">—</span>;
  const up = value >= 0;
  return <span className={up ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>{up ? '+' : '−'}{Math.abs(value).toFixed(Math.abs(value) < 10 ? 1 : 0)}%</span>;
}

/** Mount with a fresh `key` each time it opens. */
export function StatsModal({ brand, initialChannel, stats, onAdd, onDelete, onAddMetric, onClose }: Props) {
  const [channelId, setChannelId] = useState(initialChannel.id);
  const channel = brand.accounts.find(a => a.id === channelId) || initialChannel;
  const [date, setDate] = useState(localDateStr());
  const [values, setValues] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');

  const metrics = accountMetrics(channel, stats);
  const snaps = snapshots(stats, channel.id);
  const used = metrics.filter(m => snaps.some(s => s.values[m.name] !== undefined));
  const headline = headlineStat(stats, channel)?.metric;
  const [chartMetric, setChartMetric] = useState<string | null>(null);
  const shown = chartMetric && (chartMetric === ER || used.some(m => m.name === chartMetric)) ? chartMetric : headline || used[0]?.name || null;
  const chartData = shown
    ? [...snaps].reverse().map(s => ({ date: s.date, value: shown === ER ? engagementRate(s.values) : s.values[shown] })).filter(d => d.value !== null && d.value !== undefined)
    : [];
  const hasEr = snaps.some(s => engagementRate(s.values) !== null);
  const latest = snaps[0];
  const prev = snaps[1];

  // Whole-brand audience: latest followers / subscribers across its accounts.
  const audience = brand.accounts.reduce((sum, a) => {
    const s = snapshots(stats, a.id).find(x => x.values.Followers !== undefined || x.values.Subscribers !== undefined);
    return sum + (s ? (s.values.Followers ?? s.values.Subscribers ?? 0) : 0);
  }, 0);

  const switchChannel = (id: string) => {
    setChannelId(id);
    setValues({});
    setChartMetric(null);
    setError('');
    setSaved('');
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const { parsed, error: bad } = parseMetricValues(values);
    if (bad) { setError(bad); return; }
    const names = Object.keys(parsed);
    if (!names.length) { setError('Fill in at least one number'); return; }
    if (!date) { setError('Pick a date'); return; }
    const now = new Date().toISOString();
    onAdd(names.map(metric => ({ id: crypto.randomUUID(), channelId: channel.id, metric, value: parsed[metric], date, createdAt: now })));
    setValues({});
    setError('');
    setSaved(`Saved ${names.length} ${names.length === 1 ? 'number' : 'numbers'} for ${date}`);
  };

  const exportCsv = () => {
    const blob = new Blob([snapshotsCsv(channel, used, snaps)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${channel.name.replace(/[^\w.-]+/g, '_')}-${channel.platform.replace(/[^\w.-]+/g, '_')}-stats.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <Modal isOpen onClose={onClose} title={`Stats · ${brand.name}`} onSubmit={submit} submitText="Save snapshot" cancelText="Done" accentColor="zinc" maxWidth="max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {brand.accounts.length > 1 ? (
          <div className="flex flex-wrap gap-2">
            {brand.accounts.map(a => (
              <button
                key={a.id}
                type="button"
                onClick={() => switchChannel(a.id)}
                aria-pressed={a.id === channel.id}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all ${
                  a.id === channel.id ? 'border-zinc-900 dark:border-white text-zinc-900 dark:text-white' : 'border-zinc-100 dark:border-zinc-800 text-zinc-400'
                }`}
              >
                <PlatformLogo platform={a.platform} size={18} /> {a.platform}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-700 dark:text-zinc-200"><PlatformLogo platform={channel.platform} size={18} /> {channel.platform}</div>
        )}
        {brand.accounts.length > 1 && audience > 0 && (
          <span className="text-xs font-bold text-zinc-500">Brand audience <span className="text-zinc-900 dark:text-zinc-100">{formatStat(audience)}</span></span>
        )}
      </div>

      {/* Log a snapshot */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1.5">
            <span className={label}>Snapshot date</span>
            <input type="date" value={date} max={localDateStr()} onChange={e => { setDate(e.target.value); setError(''); }}
              className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 px-3 py-2 rounded-xl text-sm font-medium outline-none" />
          </label>
          <p className="text-[11px] text-zinc-400 pb-2 max-w-md">Fill in what you have; blanks are skipped. For activity, copy the <b>{PERIOD_LABEL}</b> figure from the app&apos;s insights. Grey numbers are last time&apos;s.</p>
        </div>
        <MetricInputs
          channel={channel}
          stats={stats}
          values={values}
          onChange={(m, v) => { setValues(x => ({ ...x, [m]: v })); setError(''); setSaved(''); }}
          onAddMetric={(name, kind) => onAddMetric(channel.id, name, kind)}
        />
        {error && <div className="text-xs font-bold text-rose-500">{error}</div>}
        {saved && <div className="text-xs font-bold text-emerald-600">{saved}</div>}
      </div>

      {/* History */}
      <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-bold uppercase text-zinc-900 dark:text-zinc-100">History · {channel.platform}</span>
          {snaps.length > 0 && (
            <button type="button" onClick={exportCsv} className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700">
              <Download size={12} /> Export CSV
            </button>
          )}
        </div>

        {snaps.length === 0 ? (
          <div className="py-6 text-center text-xs font-bold text-zinc-400 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
            No snapshots yet. Save the first one above to start tracking growth.
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-1.5">
              {[...used.map(m => m.name), ...(hasEr ? [ER] : [])].map(m => (
                <button key={m} type="button" onClick={() => setChartMetric(m)} aria-pressed={shown === m}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${shown === m ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white' : 'text-zinc-500 border-zinc-200 dark:border-zinc-700'}`}>
                  {m}
                </button>
              ))}
            </div>
            {chartData.length > 1 ? (
              <div className="h-44 -ml-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(161,161,170,0.2)" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#a1a1aa' }} tickLine={false} axisLine={false} />
                    <YAxis tickFormatter={v => (shown === ER ? `${Number(v).toFixed(1)}%` : formatStat(Number(v)))} tick={{ fontSize: 10, fill: '#a1a1aa' }} tickLine={false} axisLine={false} width={48} />
                    <Tooltip formatter={v => [shown === ER ? `${Number(v).toFixed(2)}%` : Number(v).toLocaleString(), shown]} />
                    <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-[11px] text-zinc-400 px-1">The chart appears once {shown || 'a metric'} has two snapshots.</p>
            )}

            <div className="overflow-x-auto -mx-1 px-1">
              <table className="w-full text-xs tabular-nums">
                <thead>
                  <tr className="text-[10px] uppercase text-zinc-400">
                    <th className="sticky left-0 bg-white dark:bg-zinc-900 text-left font-bold py-2 pr-3">Date</th>
                    {used.map(m => (
                      <th key={m.name} className="text-right font-bold py-2 px-2 whitespace-nowrap" title={m.kind === 'period' ? PERIOD_LABEL : 'running total'}>
                        {m.name}{m.kind === 'period' && <span className="font-medium normal-case"> 28d</span>}
                      </th>
                    ))}
                    {hasEr && <th className="text-right font-bold py-2 px-2 whitespace-nowrap">Eng. rate</th>}
                    <th className="w-6" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {prev && (
                    <tr className="bg-zinc-50/70 dark:bg-zinc-800/40 font-bold">
                      <td className="sticky left-0 bg-zinc-50 dark:bg-zinc-800 py-2 pr-3 text-zinc-500 whitespace-nowrap">vs {prev.date}</td>
                      {used.map(m => <td key={m.name} className="text-right py-2 px-2"><Change value={pctChange(latest.values[m.name], prev.values[m.name])} /></td>)}
                      {hasEr && (() => {
                        const a = engagementRate(latest.values), b = engagementRate(prev.values);
                        return <td className="text-right py-2 px-2">{a !== null && b !== null ? <span className={a >= b ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>{a >= b ? '+' : '−'}{Math.abs(a - b).toFixed(1)} pts</span> : <span className="text-zinc-300 dark:text-zinc-600">—</span>}</td>;
                      })()}
                      <td />
                    </tr>
                  )}
                  {snaps.map(s => {
                    const er = engagementRate(s.values);
                    return (
                      <tr key={s.date} className="text-zinc-700 dark:text-zinc-200">
                        <td className="sticky left-0 bg-white dark:bg-zinc-900 py-2 pr-3 font-bold text-zinc-500 whitespace-nowrap">{s.date}</td>
                        {used.map(m => <td key={m.name} className="text-right py-2 px-2 font-bold">{s.values[m.name] !== undefined ? s.values[m.name].toLocaleString() : <span className="text-zinc-300 dark:text-zinc-600">—</span>}</td>)}
                        {hasEr && <td className="text-right py-2 px-2 font-bold">{er !== null ? `${er.toFixed(1)}%` : <span className="text-zinc-300 dark:text-zinc-600">—</span>}</td>}
                        <td className="text-right py-2 pl-1">
                          <button type="button" onClick={() => { if (window.confirm(`Delete the ${s.date} snapshot (${s.ids.length} ${s.ids.length === 1 ? 'number' : 'numbers'})?`)) onDelete(s.ids); }}
                            aria-label={`Delete snapshot from ${s.date}`} className="text-zinc-300 hover:text-rose-500">
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {hasEr && <p className="text-[11px] text-zinc-400 px-1">Engagement rate = likes, reactions, comments, shares, reposts, replies and saves ÷ reach (or impressions, or views), from the same snapshot.</p>}
          </>
        )}
      </div>
    </Modal>
  );
}
