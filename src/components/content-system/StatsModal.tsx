"use client";

import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Modal } from '../ui/Modal';
import { STAT_METRICS, type BusinessChannel, type ChannelStat } from '@/types/business';
import { formatStat, localDateStr, statHistory, type Brand } from '@/lib/content-system';
import { PlatformLogo } from './PlatformLogo';

interface Props {
  brand: Brand;
  initialChannel: BusinessChannel;
  stats: ChannelStat[];
  onAdd: (stat: ChannelStat) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

const input = 'w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 px-3 py-2.5 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-white/10';
const label = 'text-[10px] font-bold text-zinc-400 uppercase px-1';

const defaultMetric = (c: BusinessChannel) => (c.platform.toLowerCase() === 'youtube' ? 'Subscribers' : 'Followers');

/** Mount with a fresh `key` each time it opens. */
export function StatsModal({ brand, initialChannel, stats, onAdd, onDelete, onClose }: Props) {
  const [channelId, setChannelId] = useState(initialChannel.id);
  const channel = brand.accounts.find(a => a.id === channelId) || initialChannel;
  const logged = [...new Set(stats.filter(s => s.channelId === channel.id).map(s => s.metric))];

  const [metric, setMetric] = useState(defaultMetric(initialChannel));
  const [customMetric, setCustomMetric] = useState('');
  const [value, setValue] = useState('');
  const [date, setDate] = useState(localDateStr());
  const [error, setError] = useState('');

  const metricOptions = [...new Set([...STAT_METRICS.filter(m => m !== 'Other'), ...logged]), 'Other'];
  const activeMetric = metric === 'Other' ? customMetric.trim() : metric;
  const history = activeMetric ? statHistory(stats, channel.id, activeMetric) : [];

  const switchChannel = (id: string) => {
    setChannelId(id);
    const next = brand.accounts.find(a => a.id === id);
    if (next) setMetric(defaultMetric(next));
    setError('');
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(value.replace(/,/g, ''));
    if (!activeMetric) { setError('Name the metric'); return; }
    if (value.trim() === '' || !isFinite(num) || num < 0) { setError('Enter a number, like 12400'); return; }
    if (!date) { setError('Pick a date'); return; }
    onAdd({ id: crypto.randomUUID(), channelId: channel.id, metric: activeMetric, value: num, date, createdAt: new Date().toISOString() });
    setValue('');
    setError('');
  };

  const first = history[0];
  const last = history[history.length - 1];
  const growth = first && last && history.length > 1 ? last.value - first.value : null;

  return (
    <Modal isOpen onClose={onClose} title={`Stats · ${brand.name}`} onSubmit={submit} submitText="Log entry" cancelText="Done" accentColor="zinc">
      {brand.accounts.length > 1 && (
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
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="flex flex-col gap-1.5">
          <span className={label}>Metric</span>
          <select value={metric} onChange={e => { setMetric(e.target.value); setError(''); }} className={input}>
            {metricOptions.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className={label}>Value</span>
          <input inputMode="numeric" value={value} onChange={e => { setValue(e.target.value); setError(''); }} placeholder="12400" className={input} />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className={label}>Date</span>
          <input type="date" value={date} max={localDateStr()} onChange={e => { setDate(e.target.value); setError(''); }} className={input} />
        </div>
        {metric === 'Other' && (
          <div className="flex flex-col gap-1.5 sm:col-span-3">
            <span className={label}>Metric name</span>
            <input value={customMetric} onChange={e => { setCustomMetric(e.target.value); setError(''); }} placeholder="Shares" className={input} />
          </div>
        )}
      </div>
      {error && <div className="text-xs font-bold text-rose-500 -mt-4">{error}</div>}

      <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800">
        <div className="flex items-baseline justify-between mb-3">
          <span className="text-xs font-bold uppercase text-zinc-900 dark:text-zinc-100">{activeMetric || 'Metric'} on {channel.platform}</span>
          {growth !== null && (
            <span className={`text-xs font-bold ${growth >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {growth >= 0 ? '+' : '−'}{formatStat(Math.abs(growth))} since {first.date}
            </span>
          )}
        </div>

        {history.length > 1 && (
          <div className="h-44 -ml-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history.map(h => ({ date: h.date, value: h.value }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(161,161,170,0.2)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#a1a1aa' }} tickLine={false} axisLine={false} />
                <YAxis tickFormatter={v => formatStat(Number(v))} tick={{ fontSize: 10, fill: '#a1a1aa' }} tickLine={false} axisLine={false} width={48} />
                <Tooltip formatter={v => [Number(v).toLocaleString(), activeMetric]} />
                <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {history.length ? (
          <div className="mt-3 max-h-48 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800">
            {[...history].reverse().map(h => (
              <div key={h.id} className="flex items-center justify-between py-2 text-sm">
                <span className="text-zinc-500">{h.date}</span>
                <span className="flex items-center gap-3">
                  <span className="font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">{h.value.toLocaleString()}</span>
                  <button type="button" onClick={() => onDelete(h.id)} aria-label={`Delete entry from ${h.date}`} className="text-zinc-300 hover:text-rose-500">
                    <Trash2 size={13} />
                  </button>
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center text-xs font-bold text-zinc-400 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
            No entries yet. Log the first one above to start tracking growth.
          </div>
        )}
      </div>
    </Modal>
  );
}
