"use client";

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Pencil } from 'lucide-react';
import type { BusinessChannel } from '@/types/business';
import { brandName } from '@/lib/content-system';
import { PlatformLogo } from './PlatformLogo';

interface Props {
  channels: BusinessChannel[];
  onActivate: (channel: BusinessChannel) => void;
  onEdit: (channel: BusinessChannel) => void;
}

export function DraftsShelf({ channels, onActivate, onEdit }: Props) {
  const [open, setOpen] = useState(false);
  const inactive = channels.filter(c => c.status !== 'Active');
  if (inactive.length === 0) return null;

  return (
    <section>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="flex items-center gap-2 text-sm font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
      >
        {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        Drafts and paused · {inactive.length}
      </button>
      {open && (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {inactive.map(c => (
            <div key={c.id} className="flex items-center gap-3 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-700 p-3">
              <PlatformLogo platform={c.platform} size={26} />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-zinc-800 dark:text-zinc-100 truncate">{brandName(c)}</div>
                <div className="text-[10px] font-bold uppercase text-zinc-400">{c.status === 'Paused' ? 'Paused' : 'Draft'} · {c.platform}</div>
              </div>
              <button type="button" onClick={() => onEdit(c)} aria-label={`Edit ${c.name}`} className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200">
                <Pencil size={13} />
              </button>
              <button
                type="button"
                onClick={() => onActivate(c)}
                className="text-[11px] font-bold px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                Activate
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
