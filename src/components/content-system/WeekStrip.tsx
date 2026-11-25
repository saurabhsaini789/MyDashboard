"use client";

import React from 'react';
import type { BusinessChannel } from '@/types/business';
import { accountStatus, brandName, dueOffsets, initials } from '@/lib/content-system';
import { PlatformLogo } from './PlatformLogo';

const MAX_PER_DAY = 4;

export function WeekStrip({ channels }: { channels: BusinessChannel[] }) {
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => new Date(today.getFullYear(), today.getMonth(), today.getDate() + i));
  const active = channels.filter(c => c.status === 'Active');

  const byDay = days.map((_, i) =>
    active
      .filter(c => dueOffsets(c).has(i))
      .map(c => ({ c, late: i === 0 && accountStatus(c).next < 0 }))
      .sort((a, b) => Number(b.late) - Number(a.late))
  );

  return (
    <div className="overflow-x-auto -mx-1 px-1 pb-1">
      <div className="grid grid-cols-7 gap-2 min-w-[640px]">
        {days.map((d, i) => {
          const items = byDay[i];
          return (
            <div
              key={i}
              className={`rounded-2xl p-2.5 min-h-[128px] bg-white dark:bg-zinc-900 border ${
                i === 0 ? 'border-zinc-900 dark:border-zinc-100' : 'border-zinc-100 dark:border-zinc-800'
              }`}
            >
              <div className="text-[10px] font-bold uppercase text-zinc-400">
                {i === 0 ? 'Today' : d.toLocaleDateString(undefined, { weekday: 'short' })}
              </div>
              <div className="text-base font-bold text-zinc-900 dark:text-zinc-100">{d.getDate()}</div>
              <div className="mt-1.5 space-y-1">
                {items.slice(0, MAX_PER_DAY).map(({ c, late }) => (
                  <div
                    key={c.id}
                    title={`${brandName(c)} · ${c.platform}${late ? ' · late' : ''}`}
                    className={`flex items-center gap-1.5 rounded-lg px-1.5 py-1 text-[11px] font-bold ${
                      late ? 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400' : 'bg-zinc-50 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'
                    }`}
                  >
                    <PlatformLogo platform={c.platform} size={14} />
                    <span className="truncate">{initials(brandName(c))}</span>
                  </div>
                ))}
                {items.length > MAX_PER_DAY && (
                  <div className="text-[10px] font-bold text-zinc-400 px-1">+{items.length - MAX_PER_DAY} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
