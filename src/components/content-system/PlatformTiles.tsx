"use client";

import React from 'react';
import { LayoutGrid } from 'lucide-react';
import type { BusinessChannel } from '@/types/business';
import { accountStatus } from '@/lib/content-system';
import { PlatformLogo, platformColor } from './PlatformLogo';

const CORE_PLATFORMS = ['Instagram', 'YouTube', 'LinkedIn'];

interface Props {
  channels: BusinessChannel[];
  filter: string;
  onFilter: (platform: string) => void;
}

export function PlatformTiles({ channels, filter, onFilter }: Props) {
  const active = channels.filter(c => c.status === 'Active');
  const used = [...new Set(active.map(c => c.platform))];
  const platforms = [...CORE_PLATFORMS, ...used.filter(p => !CORE_PLATFORMS.includes(p)).sort()];

  const stats = (list: BusinessChannel[]) => {
    const st = list.map(accountStatus);
    const late = st.filter(s => s.next < 0).length;
    const today = st.filter(s => s.next === 0).length;
    const onTrack = list.length ? Math.round(((list.length - late - today) / list.length) * 100) : 0;
    return { late, today, onTrack };
  };

  const tile = (key: string, label: string, list: BusinessChannel[], icon: React.ReactNode, color: string) => {
    const s = stats(list);
    const selected = filter === key;
    const empty = list.length === 0;
    return (
      <button
        key={key}
        type="button"
        onClick={() => onFilter(selected && key !== 'All' ? 'All' : key)}
        aria-pressed={selected}
        className={`text-left rounded-2xl p-4 bg-white dark:bg-zinc-900 border transition-all hover:-translate-y-0.5 ${
          selected ? 'border-zinc-900 dark:border-zinc-100 shadow-sm' : 'border-zinc-100 dark:border-zinc-800'
        } ${empty ? 'opacity-60' : ''}`}
      >
        <div className="flex items-center justify-between">
          {icon}
          <span className="text-[11px] font-bold text-zinc-400">{list.length} {list.length === 1 ? 'account' : 'accounts'}</span>
        </div>
        <div className="mt-3 text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">{label}</div>
        <div className="mt-0.5 text-[11px] font-bold text-zinc-400">
          {empty ? 'Not set up' : (
            <>
              <span className={s.late ? 'text-rose-500' : ''}>{s.late} late</span>
              {' · '}
              <span className={s.today ? 'text-amber-500' : ''}>{s.today} today</span>
            </>
          )}
        </div>
        <div className="mt-3 h-1 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden" title={`${s.onTrack}% on track`}>
          <div className="h-full rounded-full transition-all" style={{ width: `${empty ? 0 : s.onTrack}%`, background: color }} />
        </div>
      </button>
    );
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {tile('All', 'All platforms', active,
        <span className="w-6 h-6 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center"><LayoutGrid size={14} /></span>,
        '#10b981')}
      {platforms.map(p => tile(p, p, active.filter(c => c.platform === p), <PlatformLogo platform={p} size={24} />, platformColor(p)))}
    </div>
  );
}
